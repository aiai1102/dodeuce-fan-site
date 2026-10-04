#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
netkeiba 交配牝馬一覧 CSV生成ツール

種牡馬の交配牝馬一覧ページから、Phase1のCSVフォーマットに準拠したCSVを生成します。
"""

import argparse
import csv
import re
import sys
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from urllib.parse import urlparse, parse_qs

import requests
from bs4 import BeautifulSoup


class NetkeibaMatingCSVGenerator:
    """netkeiba交配牝馬一覧のスクレイピングとCSV生成"""
    
    BASE_URL = "https://own.netkeiba.com/db/sire_broodmare.html"
    
    def __init__(self, sleep_seconds: int = 4):
        """
        Args:
            sleep_seconds: リクエスト間のスリープ時間（秒）
        """
        self.sleep_seconds = sleep_seconds
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def extract_netkeiba_id(self, url: str) -> Optional[str]:
        """URLからnetkeiba IDを抽出
        
        Args:
            url: 牝馬のURL（例: https://own.netkeiba.com/db/horse.html?id=2018104922）
        
        Returns:
            netkeiba ID（例: 2018104922）、抽出失敗時はNone
        """
        try:
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            if 'id' in params:
                return params['id'][0]
        except Exception as e:
            print(f"Warning: Failed to extract ID from URL {url}: {e}", file=sys.stderr)
        return None
    
    def parse_cover_date(self, date_str: str, year: int) -> Optional[str]:
        """種付け日を解析してYYYY-MM-DD形式に変換
        
        Args:
            date_str: 種付け日の文字列（例: "3月12日"）
            year: 年
        
        Returns:
            YYYY-MM-DD形式の日付文字列、解析失敗時はNone
        """
        try:
            # "3月12日" -> "03-12"
            match = re.search(r'(\d+)月(\d+)日', date_str)
            if match:
                month = int(match.group(1))
                day = int(match.group(2))
                return f"{year}-{month:02d}-{day:02d}"
        except Exception as e:
            print(f"Warning: Failed to parse cover date '{date_str}': {e}", file=sys.stderr)
        return None
    
    def calculate_expected_foaling_date(self, cover_date_str: str) -> Optional[str]:
        """種付け日から生産予定日を計算（+11ヶ月）
        
        Args:
            cover_date_str: YYYY-MM-DD形式の種付け日
        
        Returns:
            YYYY-MM-DD形式の生産予定日、計算失敗時はNone
        """
        try:
            cover_date = datetime.strptime(cover_date_str, '%Y-%m-%d')
            # 11ヶ月後を計算（約335日）
            expected_date = cover_date + timedelta(days=335)
            return expected_date.strftime('%Y-%m-%d')
        except Exception as e:
            print(f"Warning: Failed to calculate expected foaling date from '{cover_date_str}': {e}", file=sys.stderr)
        return None
    
    def parse_prize(self, prize_str: str) -> str:
        """獲得賞金を解析
        
        Args:
            prize_str: 賞金文字列（例: "8,197万円"）
        
        Returns:
            整形された賞金文字列
        """
        if not prize_str or prize_str.strip() == '-':
            return '0'
        # 数字とカンマのみ抽出
        prize_str = re.sub(r'[^\d,]', '', prize_str)
        return prize_str if prize_str else '0'
    
    def parse_best_win_class(self, class_str: str) -> str:
        """勝鞍クラスを解析
        
        Args:
            class_str: クラス文字列（例: "22'立雲峡S(3勝クラス)"）
        
        Returns:
            整形されたクラス文字列
        """
        if not class_str or class_str.strip() == '-':
            return ''
        return class_str.strip()
    
    def parse_offsprings_started(self, count_str: str) -> int:
        """既出走産駒頭数を解析
        
        Args:
            count_str: 頭数文字列
        
        Returns:
            頭数（整数）
        """
        try:
            return int(re.sub(r'\D', '', count_str))
        except:
            return 0
    
    def fetch_page(self, url: str, page: int = 1, stallion_id: str = None, year: int = None) -> Optional[BeautifulSoup]:
        """ページを取得してBeautifulSoupオブジェクトを返す

        Args:
            url: 取得するURL
            page: ページ番号（2以上の場合はPOSTリクエスト）
            stallion_id: 種牡馬ID（POSTリクエスト用）
            year: 年（POSTリクエスト用）

        Returns:
            BeautifulSoupオブジェクト、失敗時はNone
        """
        try:
            print(f"Fetching: {url} (page {page})", file=sys.stderr)

            if page == 1:
                response = self.session.get(url, timeout=30)
            else:
                # ページ2以降はPOSTリクエストでページ番号を送信
                post_data = {'page': str(page)}
                headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': url
                }
                print(f"POST data: {post_data}", file=sys.stderr)
                response = self.session.post(url, data=post_data, headers=headers, timeout=30)

            response.raise_for_status()
            response.encoding = response.apparent_encoding

            print(f"Response status: {response.status_code}, URL: {response.url}", file=sys.stderr)

            soup = BeautifulSoup(response.text, 'html.parser')
            return soup

        except requests.exceptions.RequestException as e:
            print(f"Error: Failed to fetch page: {e}", file=sys.stderr)
            return None
        except Exception as e:
            print(f"Error: Failed to parse page: {e}", file=sys.stderr)
            return None
    
    def parse_mare_row(self, row, year: int) -> Optional[Dict[str, str]]:
        """テーブル行から牝馬データを抽出
        
        Args:
            row: BeautifulSoupのtrタグ
            year: 年
        
        Returns:
            牝馬データの辞書、抽出失敗時はNone
        """
        try:
            cells = row.find_all(['th', 'td'])
            if len(cells) < 9:
                return None
            
            # 牝馬名とURL
            mare_link = cells[0].find('a')
            if not mare_link:
                return None
            
            mare_name = mare_link.text.strip()
            mare_url = mare_link.get('href', '')
            if mare_url and not mare_url.startswith('http'):
                mare_url = 'https://own.netkeiba.com' + mare_url
            
            netkeiba_id = self.extract_netkeiba_id(mare_url)
            if not netkeiba_id:
                print(f"Warning: Could not extract netkeiba_id for {mare_name}", file=sys.stderr)
                return None
            
            # 生年
            birth_year = cells[1].text.strip()
            
            # 父名
            sire_name = cells[2].text.strip()
            
            # 種付け日
            cover_date_link = cells[3].find('a')
            cover_date_text = cover_date_link.text.strip() if cover_date_link else cells[3].text.strip()
            cover_date = self.parse_cover_date(cover_date_text, year)
            
            # 生産予定日
            expected_foaling_date = self.calculate_expected_foaling_date(cover_date) if cover_date else ''
            
            # 獲得賞金
            total_prize = self.parse_prize(cells[4].text.strip())
            
            # 勝鞍クラス
            best_win_class = self.parse_best_win_class(cells[5].text.strip())
            
            # 既出走産駒頭数
            offsprings_started = self.parse_offsprings_started(cells[6].text.strip())
            
            # 代表産駒
            representative_offspring_name = ''
            representative_offspring_url = ''
            offspring_cell = cells[8]
            offspring_link = offspring_cell.find('a', class_='HorseName')
            if offspring_link:
                representative_offspring_name = offspring_link.text.strip()
                representative_offspring_url = offspring_link.get('href', '')
                if representative_offspring_url and not representative_offspring_url.startswith('http'):
                    representative_offspring_url = 'https://own.netkeiba.com' + representative_offspring_url
            
            return {
                'season_year': str(year),
                'netkeiba_id': netkeiba_id,
                'mare_name': mare_name,
                'mare_birth_year': birth_year,
                'mare_sire_name': sire_name,
                'cover_date': cover_date or '',
                'expected_foaling_date': expected_foaling_date,
                'total_prize': total_prize,
                'best_win_class': best_win_class,
                'offsprings_started': str(offsprings_started),
                'representative_offspring_name': representative_offspring_name,
                'representative_offspring_url': representative_offspring_url,
                'mare_netkeiba_url': mare_url
            }
            
        except Exception as e:
            print(f"Warning: Failed to parse mare row: {e}", file=sys.stderr)
            return None
    
    def scrape_mares(self, stallion_id: str, year: int) -> List[Dict[str, str]]:
        """種牡馬の交配牝馬一覧を取得

        Args:
            stallion_id: 種牡馬ID
            year: 年

        Returns:
            牝馬データのリスト
        """
        mares = []
        page = 1

        while True:
            # URLを構築（ベースURLは常に同じ）
            url = f"{self.BASE_URL}?_q=db/sire_broodmare.html&id={stallion_id}&year={year}"

            # ページを取得（page番号を渡す）
            soup = self.fetch_page(url, page, stallion_id, year)
            if not soup:
                break

            # テーブルを探す
            table = soup.find('table', id='Search_ResultTable')
            if not table:
                print("Warning: Could not find mare table", file=sys.stderr)
                break

            # 行を解析
            tbody = table.find('tbody')
            if not tbody:
                break

            rows = tbody.find_all('tr')
            if not rows:
                break

            page_mares = 0
            for row in rows:
                mare_data = self.parse_mare_row(row, year)
                if mare_data:
                    mares.append(mare_data)
                    page_mares += 1

            # 全件数を取得してログ出力
            total_count = 0
            if page == 1:
                pager = soup.find('div', class_='Common_Pager')
                if pager:
                    all_items = pager.find('li', class_='AllItemsNum')
                    if all_items:
                        count_text = all_items.get_text()
                        match = re.search(r'(\d+)', count_text)
                        if match:
                            total_count = int(match.group(1))
                            print(f"Total items: {total_count}", file=sys.stderr)

            print(f"Page {page}: Found {page_mares} mares (Total so far: {len(mares)})", file=sys.stderr)

            # ページネーションチェック（次ページがあるか）
            pager = soup.find('div', class_='Common_Pager')
            has_next = False
            if pager:
                # デバッグ: ページャーのHTMLを出力
                if page == 1:
                    print(f"Pager HTML (first 500 chars): {str(pager)[:500]}", file=sys.stderr)

                # 現在のページ番号を確認
                current_page_elem = pager.find('li', class_='Page_Active')
                if current_page_elem:
                    print(f"Current page element: {current_page_elem.get_text()}", file=sys.stderr)

                # title="Next"を持つリンクを探す
                next_link = pager.find('a', title='Next')
                if next_link:
                    print(f"Found next link by title='Next'", file=sys.stderr)
                else:
                    # または、「次」を含むテキストを持つリンクを探す
                    all_links = pager.find_all('a')
                    print(f"Total links in pager: {len(all_links)}", file=sys.stderr)
                    for link in all_links:
                        link_text = link.get_text().strip()
                        if '次' in link_text:
                            next_link = link
                            print(f"Found next link by text: '{link_text}'", file=sys.stderr)
                            break

                has_next = next_link is not None
                print(f"Has next page: {has_next}", file=sys.stderr)
            else:
                print("Warning: Pager not found", file=sys.stderr)

            if not has_next or page_mares == 0:
                break

            page += 1

            # スリープ
            print(f"Sleeping for {self.sleep_seconds} seconds...", file=sys.stderr)
            time.sleep(self.sleep_seconds)

        return mares
    
    def write_csv(self, mares: List[Dict[str, str]], output_path: str):
        """CSVファイルに書き込み
        
        Args:
            mares: 牝馬データのリスト
            output_path: 出力ファイルパス
        """
        fieldnames = [
            'season_year',
            'netkeiba_id',
            'mare_name',
            'mare_birth_year',
            'mare_sire_name',
            'cover_date',
            'expected_foaling_date',
            'total_prize',
            'best_win_class',
            'offsprings_started',
            'representative_offspring_name',
            'representative_offspring_url',
            'mare_netkeiba_url'
        ]
        
        try:
            with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(mares)
            
            print(f"\nSuccess: CSV file created: {output_path}", file=sys.stderr)
            print(f"Total mares: {len(mares)}", file=sys.stderr)
            
        except Exception as e:
            print(f"Error: Failed to write CSV file: {e}", file=sys.stderr)
            sys.exit(1)
    
    def run_from_stallion_id(self, stallion_id: str, year: int, output_path: str):
        """種牡馬IDから実行
        
        Args:
            stallion_id: 種牡馬ID
            year: 年
            output_path: 出力ファイルパス
        """
        print(f"Scraping mares for stallion ID: {stallion_id}, year: {year}", file=sys.stderr)
        mares = self.scrape_mares(stallion_id, year)
        
        if not mares:
            print("Warning: No mares found", file=sys.stderr)
        
        self.write_csv(mares, output_path)
    
    def run_from_url(self, url: str, output_path: str):
        """URLから実行
        
        Args:
            url: 交配牝馬一覧ページのURL
            output_path: 出力ファイルパス
        """
        try:
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            
            stallion_id = params.get('id', [None])[0]
            year = params.get('year', [None])[0]
            
            if not stallion_id or not year:
                print("Error: Could not extract stallion_id or year from URL", file=sys.stderr)
                sys.exit(1)
            
            year = int(year)
            self.run_from_stallion_id(stallion_id, year, output_path)
            
        except Exception as e:
            print(f"Error: Failed to parse URL: {e}", file=sys.stderr)
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='netkeiba 交配牝馬一覧 CSV生成ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # 種牡馬IDと年を指定
  python netkeiba_mating_csv_generator.py --stallion-id 2019105283 --year 2025 --output mares_2025.csv
  
  # URLを指定
  python netkeiba_mating_csv_generator.py --url "https://own.netkeiba.com/db/sire_broodmare.html?_q=db/sire_broodmare.html&id=2019105283&year=2025" --output mares_2025.csv
        """
    )
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--stallion-id', help='種牡馬ID（例: 2019105283）')
    group.add_argument('--url', help='交配牝馬一覧ページのURL')
    
    parser.add_argument('--year', type=int, help='年（--stallion-id使用時は必須）')
    parser.add_argument('--output', '-o', required=True, help='出力CSVファイルパス')
    parser.add_argument('--sleep', type=int, default=4, help='リクエスト間のスリープ時間（秒、デフォルト: 4）')
    
    args = parser.parse_args()
    
    # バリデーション
    if args.stallion_id and not args.year:
        parser.error('--stallion-id を使用する場合は --year も指定してください')
    
    # 実行
    generator = NetkeibaMatingCSVGenerator(sleep_seconds=args.sleep)
    
    if args.stallion_id:
        generator.run_from_stallion_id(args.stallion_id, args.year, args.output)
    else:
        generator.run_from_url(args.url, args.output)


if __name__ == '__main__':
    main()