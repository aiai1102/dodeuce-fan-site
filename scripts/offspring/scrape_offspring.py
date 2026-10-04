#!/usr/bin/env python3
"""ドウデュース産駒一覧をnetkeibaから取得し、管理画面取込用のCSVを生成する。

繁殖牝馬（交配牝馬）の取得処理とは独立した処理。DBには書き込まない。
生成したCSVは管理画面（/admin/offspring-import）で内容を確認してから取り込む。

取得の流れ:
  1. 産駒一覧ページ（progeny_list.html）の Search_ResultTable から産駒IDと馬名を取得（複数ページ対応）
  2. 各産駒の詳細ページ（horse.html?id=...）の基本情報から
     父・母（リンクから母のnetkeiba ID）・母父・生年月日・性別・生産者・馬主を取得
  3. 父がドウデュースであることを確認
  4. 全件成功した場合のみ、一時ファイル経由で出力CSVを置き換える
     （途中で失敗した場合は既存CSVを上書きしない）

使い方:
  pip install -r scripts/offspring/requirements.txt
  python scripts/offspring/scrape_offspring.py --output data/dodeuce_offspring.csv
  # 取得したHTMLを保存して後から解析を検証する
  python scripts/offspring/scrape_offspring.py --save-html-dir tmp/html
  # 保存済みHTMLだけで解析する（ネットワークに接続しない）
  python scripts/offspring/scrape_offspring.py --from-html-dir tmp/html --output /tmp/check.csv
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import os
import re
import sys
import tempfile
import time
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional
from urllib.parse import parse_qs, urlencode, urljoin, urlparse

from bs4 import BeautifulSoup, Tag

SIRE_NETKEIBA_ID = "2019105283"
SIRE_NAME = "ドウデュース"
BASE_URL = "https://own.netkeiba.com/db/"
LIST_PATH = "progeny_list.html"
DETAIL_PATH = "horse.html"
PUBLIC_HORSE_URL = "https://db.netkeiba.com/horse/{id}/"

# netkeibaの馬IDは10文字の英数字（例: 2019105283 / 000a02c86e）。整数化しない。
HORSE_ID_RE = re.compile(r"^[0-9a-z]{10}$")
HORSE_ID_IN_HREF_RE = re.compile(
    r"(?:horse\.html\?(?:[^#\"']*&)?id=|/horse/(?:ped/)?)([0-9a-z]{10})(?![0-9a-z])"
)
MAX_PAGES = 50

CSV_COLUMNS = [
    "netkeiba_id",
    "name",
    "sex",
    "birth_year",
    "birth_date",
    "mother_netkeiba_id",
    "mother_name",
    "maternal_grandsire",
    "breeder",
    "owner",
    "netkeiba_url",
]


class ScrapeError(Exception):
    """取得・解析に失敗した。CSVは出力しない。"""


# ---------------------------------------------------------------------------
# 文字列ユーティリティ
# ---------------------------------------------------------------------------


def normalize_text(text: str) -> str:
    """NFKCで正規化し、連続する空白を1つにまとめる。"""
    text = unicodedata.normalize("NFKC", text or "")
    return re.sub(r"\s+", " ", text).strip()


def normalize_label(text: str) -> str:
    """見出し（th/dt）の比較用。空白と記号を除く。"""
    return re.sub(r"[\s:：]", "", normalize_text(text))


def cell_text(cell: Optional[Tag]) -> str:
    if cell is None:
        return ""
    return normalize_text(cell.get_text(" "))


def extract_horse_id(href: str) -> Optional[str]:
    match = HORSE_ID_IN_HREF_RE.search(href or "")
    return match.group(1) if match else None


def first_horse_link(cell: Optional[Tag]) -> tuple[Optional[str], str]:
    """セル内で最初の馬詳細リンクのIDとリンク文字列を返す。"""
    if cell is None:
        return None, ""
    for a in cell.find_all("a", href=True):
        horse_id = extract_horse_id(a["href"])
        if horse_id:
            return horse_id, normalize_text(a.get_text(" "))
    return None, ""


def normalize_sex(text: str) -> str:
    """「牡」「牝」「セ（セン・騸）」のみ受け付ける。判別できなければ空欄。"""
    value = normalize_text(text)
    if not value:
        return ""
    head = value[0]
    if head in ("牡", "牝"):
        return head
    if head in ("セ", "騸"):
        return "セ"
    return ""


def parse_birth_date(text: str) -> str:
    """「2025年3月12日」「2025/03/12」等をISO形式に。読めなければ空欄。"""
    value = normalize_text(text)
    match = re.search(r"(\d{4})\s*[年/.-]\s*(\d{1,2})\s*[月/.-]\s*(\d{1,2})", value)
    if not match:
        return ""
    year, month, day = (int(g) for g in match.groups())
    try:
        return dt.date(year, month, day).isoformat()
    except ValueError:
        raise ScrapeError(f"生年月日を日付として解釈できません: {value}")


def parse_year(text: str) -> str:
    match = re.search(r"(\d{4})", normalize_text(text))
    return match.group(1) if match else ""


# ---------------------------------------------------------------------------
# HTML取得
# ---------------------------------------------------------------------------


def decode_html(body: bytes, header_encoding: Optional[str] = None) -> str:
    """metaのcharset → HTTPヘッダ → EUC-JP系 → UTF-8 の順に厳密にデコードする。

    文字化けしたまま馬名を保存しないよう、どれでも読めなければエラーにする。
    """
    candidates: list[str] = []
    meta = re.search(rb"<meta[^>]+charset=[\"']?([A-Za-z0-9_-]+)", body[:4096], re.IGNORECASE)
    if meta:
        candidates.append(meta.group(1).decode("ascii"))
    if header_encoding:
        candidates.append(header_encoding)
    candidates += ["euc_jis_2004", "utf-8"]

    for encoding in candidates:
        enc = encoding.lower().replace("_", "-")
        if enc in ("euc-jp", "eucjp", "x-euc-jp"):
            # netkeibaのEUC-JPページには①などの拡張文字が含まれることがあるため上位互換で読む
            encoding = "euc_jis_2004"
        try:
            return body.decode(encoding)
        except (LookupError, UnicodeDecodeError):
            continue
    raise ScrapeError("HTMLの文字コードを判定できません")


@dataclass
class Fetcher:
    """HTTP取得（リクエスト間隔・リトライ付き）。保存済みHTMLからの読込にも対応。"""

    interval: float = 3.0
    timeout: float = 30.0
    retries: int = 3
    save_dir: Optional[Path] = None
    offline_dir: Optional[Path] = None
    user_agent: str = "dodeuce-fan-site offspring collector (+https://www.do-deuce-fan.com/)"
    sleep: Callable[[float], None] = time.sleep
    _last_request: float = field(default=0.0, init=False)
    _session: object = field(default=None, init=False)

    def get(self, url: str, cache_key: str) -> str:
        if self.offline_dir is not None:
            path = self.offline_dir / cache_key
            if not path.exists():
                raise ScrapeError(f"保存済みHTMLがありません: {path}")
            return decode_html(path.read_bytes())

        body, header_encoding = self._fetch(url)
        if self.save_dir is not None:
            self.save_dir.mkdir(parents=True, exist_ok=True)
            (self.save_dir / cache_key).write_bytes(body)
        return decode_html(body, header_encoding)

    def _fetch(self, url: str) -> tuple[bytes, Optional[str]]:
        import requests  # オフライン解析・テストではrequestsを不要にする

        if self._session is None:
            self._session = requests.Session()
            self._session.headers["User-Agent"] = self.user_agent

        last_error = ""
        for attempt in range(1, self.retries + 1):
            wait = self.interval - (time.monotonic() - self._last_request)
            if wait > 0:
                self.sleep(wait)
            self._last_request = time.monotonic()
            try:
                response = self._session.get(url, timeout=self.timeout)
            except requests.RequestException as exc:
                last_error = f"通信エラー: {exc}"
            else:
                if response.status_code == 200:
                    content_type = response.headers.get("Content-Type", "")
                    match = re.search(r"charset=([A-Za-z0-9_-]+)", content_type)
                    return response.content, match.group(1) if match else None
                last_error = f"HTTP {response.status_code}"
                # 429/5xx以外はリトライしても変わらないので即失敗
                if response.status_code != 429 and response.status_code < 500:
                    break
            if attempt < self.retries:
                self.sleep(self.interval * (2 ** attempt))
        raise ScrapeError(f"取得に失敗しました（{last_error}）: {url}")


# ---------------------------------------------------------------------------
# 産駒一覧ページの解析
# ---------------------------------------------------------------------------


@dataclass
class ListEntry:
    netkeiba_id: str
    name: str
    sex: str = ""
    birth_year: str = ""
    mother_name: str = ""
    maternal_grandsire: str = ""
    breeder: str = ""
    owner: str = ""


@dataclass
class ListPage:
    entries: list[ListEntry]
    total_count: Optional[int]
    page_urls: list[str]


# 一覧の見出し → 項目（見出し文字列は実ページで要確認。未知の見出しは無視する）
LIST_HEADER_MAP = {
    "馬名": "name",
    "性": "sex",
    "性別": "sex",
    "性齢": "sex",
    "生年": "birth_year",
    "生年月日": "birth_year",
    "母": "mother_name",
    "母名": "mother_name",
    "母父": "maternal_grandsire",
    "母の父": "maternal_grandsire",
    "生産者": "breeder",
    "馬主": "owner",
}


def parse_soup(html: str) -> BeautifulSoup:
    # html5libはブラウザと同じ規則で閉じタグの不整合（<th>…</td> など）を補正する
    return BeautifulSoup(html, "html5lib")


def parse_list_page(html: str, page_url: str) -> ListPage:
    soup = parse_soup(html)
    table = soup.find("table", class_="Search_ResultTable") or soup.find(id="Search_ResultTable")
    if table is None:
        raise ScrapeError("産駒一覧テーブル（Search_ResultTable）が見つかりません。ページ構造が変わった可能性があります")

    columns: dict[int, str] = {}
    entries: list[ListEntry] = []
    for tr in table.find_all("tr"):
        cells = tr.find_all(["th", "td"], recursive=False)
        if not cells:
            continue
        if all(c.name == "th" for c in cells):
            for index, cell in enumerate(cells):
                key = LIST_HEADER_MAP.get(normalize_label(cell.get_text()))
                if key:
                    columns[index] = key
            continue

        name_index = next((i for i, k in columns.items() if k == "name"), None)
        if name_index is not None and name_index < len(cells):
            horse_id, link_text = first_horse_link(cells[name_index])
        else:
            # 見出しが特定できない場合は行内で最初の馬リンクを産駒とみなす
            horse_id, link_text = first_horse_link(tr)
        if not horse_id:
            if cell_text(tr):
                raise ScrapeError(f"産駒IDを取得できない行があります: {cell_text(tr)[:80]}")
            continue

        entry = ListEntry(netkeiba_id=horse_id, name=link_text)
        for index, key in columns.items():
            if index >= len(cells) or key == "name":
                continue
            value = cell_text(cells[index])
            if key == "sex":
                entry.sex = normalize_sex(value)
            elif key == "birth_year":
                entry.birth_year = parse_year(value)
            else:
                setattr(entry, key, value)
        if not entry.name:
            raise ScrapeError(f"馬名を取得できません: {horse_id}")
        entries.append(entry)

    return ListPage(entries=entries, total_count=parse_total_count(soup), page_urls=find_page_urls(soup, page_url))


def parse_total_count(soup: BeautifulSoup) -> Optional[int]:
    text = normalize_text(soup.get_text(" "))
    for pattern in (r"全\s*([\d,]+)\s*(?:件|頭)", r"([\d,]+)\s*(?:件|頭)中"):
        match = re.search(pattern, text)
        if match:
            return int(match.group(1).replace(",", ""))
    return None


def find_page_urls(soup: BeautifulSoup, page_url: str) -> list[str]:
    """同じ種牡馬の産駒一覧の他ページへのリンクを集める。"""
    current = parse_qs(urlparse(page_url).query)
    urls: list[str] = []
    for a in soup.find_all("a", href=True):
        absolute = urljoin(page_url, a["href"])
        parsed = urlparse(absolute)
        if not parsed.path.endswith(LIST_PATH):
            continue
        query = parse_qs(parsed.query)
        if query.get("id") != current.get("id") or "page" not in query:
            continue
        urls.append(absolute)
    return urls


def page_number(url: str) -> int:
    values = parse_qs(urlparse(url).query).get("page", ["1"])
    try:
        return int(values[0])
    except ValueError:
        raise ScrapeError(f"ページ番号を解釈できません: {url}")


# ---------------------------------------------------------------------------
# 産駒詳細ページの解析
# ---------------------------------------------------------------------------


@dataclass
class Detail:
    sire_id: Optional[str]
    sire_name: str
    mother_id: Optional[str]
    mother_name: str
    maternal_grandsire: str
    birth_date: str
    sex: str
    breeder: str
    owner: str


def collect_labeled_cells(soup: BeautifulSoup) -> dict[str, Tag]:
    """th→td / dt→dd の見出しと値を、文書中で最初に現れたものから順に集める。"""
    cells: dict[str, Tag] = {}
    for header in soup.find_all(["th", "dt"]):
        label = normalize_label(header.get_text())
        if not label or label in cells:
            continue
        value = header.find_next_sibling("td" if header.name == "th" else "dd")
        if value is not None:
            cells[label] = value
    return cells


def parse_detail_page(html: str) -> Detail:
    soup = parse_soup(html)
    cells = collect_labeled_cells(soup)

    def text(*labels: str) -> str:
        for label in labels:
            if label in cells:
                return cell_text(cells[label])
        return ""

    sire_cell = cells.get("父")
    sire_id, sire_link_text = first_horse_link(sire_cell)
    mother_cell = cells.get("母")
    mother_id, mother_link_text = first_horse_link(mother_cell)

    sex = ""
    for label in ("性別", "性"):
        if label in cells:
            sex = normalize_sex(cell_text(cells[label]))
            break

    return Detail(
        sire_id=sire_id,
        sire_name=sire_link_text or cell_text(sire_cell),
        mother_id=mother_id,
        mother_name=mother_link_text or cell_text(mother_cell),
        maternal_grandsire=text("母父", "母の父"),
        birth_date=parse_birth_date(text("生年月日")),
        sex=sex,
        breeder=text("生産者"),
        owner=text("馬主"),
    )


# ---------------------------------------------------------------------------
# 全体の処理
# ---------------------------------------------------------------------------


@dataclass
class Result:
    rows: list[dict[str, str]]
    warnings: list[str]
    pages: int


def list_url(page: Optional[int] = None) -> str:
    params = {"id": SIRE_NETKEIBA_ID}
    if page and page > 1:
        params["page"] = str(page)
    return urljoin(BASE_URL, LIST_PATH) + "?" + urlencode(params)


def merge_value(field_name: str, list_value: str, detail_value: str, horse_id: str, warnings: list[str]) -> str:
    """一覧と詳細の両方にある項目は詳細を優先し、食い違いは警告する。推測では補完しない。"""
    if list_value and detail_value and list_value != detail_value:
        warnings.append(f"{horse_id}: {field_name}が一覧「{list_value}」と詳細「{detail_value}」で異なります（詳細を採用）")
    return detail_value or list_value


def collect(fetcher: Fetcher, log: Callable[[str], None] = lambda m: None) -> Result:
    warnings: list[str] = []

    # 1. 一覧（複数ページ）
    entries: dict[str, ListEntry] = {}
    visited: set[int] = set()
    pending: dict[int, str] = {1: list_url()}
    total_count: Optional[int] = None
    while pending:
        number = min(pending)
        url = pending.pop(number)
        if number in visited:
            continue
        if len(visited) >= MAX_PAGES:
            raise ScrapeError(f"ページ数が上限（{MAX_PAGES}）を超えました")
        visited.add(number)
        log(f"一覧 {number}ページ目を取得: {url}")
        page = parse_list_page(fetcher.get(url, f"list_page{number}.html"), url)
        if page.total_count is not None:
            if total_count is not None and total_count != page.total_count:
                raise ScrapeError(f"ページごとの総件数が一致しません（{total_count} / {page.total_count}）")
            total_count = page.total_count
        for entry in page.entries:
            if entry.netkeiba_id in entries:
                warnings.append(f"重複ID {entry.netkeiba_id}（{entry.name}）を除外しました")
                continue
            entries[entry.netkeiba_id] = entry
        for page_url in page.page_urls:
            n = page_number(page_url)
            if n not in visited and n not in pending:
                pending[n] = page_url

    if not entries:
        raise ScrapeError("産駒が1頭も取得できませんでした。ページ構造の変化や取得失敗の可能性があるためCSVは出力しません")
    if total_count is not None and total_count != len(entries):
        raise ScrapeError(f"取得件数（{len(entries)}頭）がページ記載の総件数（{total_count}頭）と一致しません")

    # 2. 詳細
    rows: list[dict[str, str]] = []
    for index, entry in enumerate(entries.values(), start=1):
        horse_id = entry.netkeiba_id
        url = urljoin(BASE_URL, DETAIL_PATH) + "?" + urlencode({"id": horse_id})
        log(f"詳細 {index}/{len(entries)}: {entry.name} ({horse_id})")
        detail = parse_detail_page(fetcher.get(url, f"horse_{horse_id}.html"))

        # 3. 父の確認
        if detail.sire_id is None and not detail.sire_name:
            raise ScrapeError(f"{horse_id}: 詳細ページで父を確認できません")
        if detail.sire_id is not None and detail.sire_id != SIRE_NETKEIBA_ID:
            raise ScrapeError(f"{horse_id}: 父のIDが{detail.sire_id}でドウデュースではありません")
        if detail.sire_id is None:
            if detail.sire_name != SIRE_NAME:
                raise ScrapeError(f"{horse_id}: 父が「{detail.sire_name}」でドウデュースではありません")
            warnings.append(f"{horse_id}: 父のリンクがなく、馬名でドウデュースを確認しました")

        if not detail.mother_id:
            warnings.append(f"{horse_id}: 詳細ページに母のリンクがなく、母のnetkeiba IDを取得できませんでした")

        birth_year = entry.birth_year
        if detail.birth_date:
            detail_year = detail.birth_date[:4]
            if birth_year and birth_year != detail_year:
                raise ScrapeError(f"{horse_id}: 一覧の生年{birth_year}と生年月日{detail.birth_date}が一致しません")
            birth_year = detail_year
        if not birth_year:
            warnings.append(f"{horse_id}: 生年を取得できませんでした")

        rows.append(
            {
                "netkeiba_id": horse_id,
                "name": entry.name,
                "sex": merge_value("性別", entry.sex, detail.sex, horse_id, warnings),
                "birth_year": birth_year,
                "birth_date": detail.birth_date,
                "mother_netkeiba_id": detail.mother_id or "",
                "mother_name": merge_value("母", entry.mother_name, detail.mother_name, horse_id, warnings),
                "maternal_grandsire": merge_value(
                    "母父", entry.maternal_grandsire, detail.maternal_grandsire, horse_id, warnings
                ),
                "breeder": merge_value("生産者", entry.breeder, detail.breeder, horse_id, warnings),
                "owner": merge_value("馬主", entry.owner, detail.owner, horse_id, warnings),
                "netkeiba_url": PUBLIC_HORSE_URL.format(id=horse_id),
            }
        )

    for row in rows:
        for key in ("netkeiba_id", "mother_netkeiba_id"):
            if row[key] and not HORSE_ID_RE.match(row[key]):
                raise ScrapeError(f"{row['netkeiba_id']}: {key}の形式が不正です: {row[key]}")

    return Result(rows=rows, warnings=warnings, pages=len(visited))


def write_csv_atomically(rows: list[dict[str, str]], output: Path) -> None:
    """一時ファイルに書いてから置き換える。書込途中で失敗しても既存ファイルは壊れない。"""
    output.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=f".{output.name}.", suffix=".tmp", dir=output.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(tmp_name, output)
    except BaseException:
        Path(tmp_name).unlink(missing_ok=True)
        raise


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="ドウデュース産駒CSVをnetkeibaから生成する")
    parser.add_argument("--output", type=Path, default=Path("data/dodeuce_offspring.csv"), help="出力CSV")
    parser.add_argument("--interval", type=float, default=3.0, help="リクエスト間隔（秒、1秒未満は不可）")
    parser.add_argument("--save-html-dir", type=Path, help="取得したHTMLを保存するディレクトリ（解析の検証用）")
    parser.add_argument("--from-html-dir", type=Path, help="保存済みHTMLから解析する（通信しない）")
    parser.add_argument("--dry-run", action="store_true", help="CSVを書き出さずに結果だけ表示する")
    args = parser.parse_args(argv)

    if args.interval < 1.0:
        parser.error("--intervalは1秒以上を指定してください")

    fetcher = Fetcher(interval=args.interval, save_dir=args.save_html_dir, offline_dir=args.from_html_dir)
    log = lambda message: print(message, file=sys.stderr)  # noqa: E731

    try:
        result = collect(fetcher, log)
    except ScrapeError as exc:
        print(f"エラー: {exc}", file=sys.stderr)
        print("CSVは出力していません（既存ファイルはそのままです）", file=sys.stderr)
        return 1

    for warning in result.warnings:
        print(f"警告: {warning}", file=sys.stderr)
    print(f"{result.pages}ページから産駒{len(result.rows)}頭を取得しました", file=sys.stderr)

    if args.dry_run:
        writer = csv.DictWriter(sys.stdout, fieldnames=CSV_COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(result.rows)
        return 0

    write_csv_atomically(result.rows, args.output)
    print(f"出力しました: {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
