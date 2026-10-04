"""scrape_offspring.py のテスト（架空のHTMLを使用。実在馬のデータではない）。

実行: python -m unittest discover -s scripts/offspring/tests -v
"""

from __future__ import annotations

import csv
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import scrape_offspring as so  # noqa: E402

LIST_HEAD = """<html><head><meta http-equiv="Content-Type" content="text/html; charset=EUC-JP"></head><body>
<div class="Pager">{pager}</div>
<p>全{total}件</p>
<table class="Search_ResultTable">
<tr><th>馬名</th><th>性</th><th>生年</th><th>母</th><th>母父</th></tr>
{rows}
</table></body></html>"""

# 母欄はリンクなし（名前のみ）
LIST_ROW = (
    '<tr><td><a href="/db/horse.html?id={id}">{name}</a></td><td>{sex}</td>'
    "<td>{year}</td><td>{mother}</td><td>{bms}</td></tr>"
)

# 基本情報は閉じタグが不整合（<th>…</td>、閉じタグなしの<td>）
DETAIL = """<html><head><meta charset="EUC-JP"></head><body>
<table class="db_prof_table">
<tr><th>生年月日</td><td>{birth}</th></tr>
<tr><th>父<td><a href="/db/horse.html?id={sire}">{sire_name}</a>
<tr><th>母</th><td>{mother_html}</td></tr>
<tr><th>母父</th><td>{bms}</tr>
<tr><th>生産者</th><td><a href="/db/breeder.html?id=x">{breeder}</a></td></tr>
<tr><th>馬主</th><td>{owner}
</table>
<table class="blood_table"><tr><th>父</th><td>別の表の父</td></tr></table>
</body></html>"""


def list_html(rows, total, pager=""):
    body = "\n".join(LIST_ROW.format(**r) for r in rows)
    return LIST_HEAD.format(rows=body, total=total, pager=pager)


def detail_html(
    birth="2025年3月12日",
    sire=so.SIRE_NETKEIBA_ID,
    sire_name="ドウデュース",
    mother_id="2015199999",
    mother_name="テストマザー",
    bms="テストグランサイア",
    breeder="テストファーム",
    owner="テストオーナー",
):
    if mother_id:
        mother_html = f'<a href="https://db.netkeiba.com/horse/{mother_id}/">{mother_name}</a>'
    else:
        mother_html = mother_name
    return DETAIL.format(
        birth=birth, sire=sire, sire_name=sire_name, mother_html=mother_html, bms=bms, breeder=breeder, owner=owner
    )


class OfflineSite:
    """保存済みHTML（EUC-JP）ディレクトリを作る。"""

    def __init__(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self._tmp.name)

    def put(self, key, html):
        (self.dir / key).write_bytes(html.encode("euc_jis_2004"))

    def fetcher(self):
        return so.Fetcher(offline_dir=self.dir)

    def close(self):
        self._tmp.cleanup()


class ParseTest(unittest.TestCase):
    def test_detail_with_broken_tags(self):
        detail = so.parse_detail_page(detail_html())
        self.assertEqual(detail.sire_id, so.SIRE_NETKEIBA_ID)
        self.assertEqual(detail.mother_id, "2015199999")
        self.assertEqual(detail.mother_name, "テストマザー")
        self.assertEqual(detail.birth_date, "2025-03-12")
        self.assertEqual(detail.maternal_grandsire, "テストグランサイア")
        self.assertEqual(detail.breeder, "テストファーム")
        self.assertEqual(detail.owner, "テストオーナー")

    def test_alphanumeric_id_is_kept_as_text(self):
        page = so.parse_list_page(
            list_html([dict(id="000a02c86e", name="テストAの2025", sex="牡", year="2025", mother="テストマザー", bms="X")], 1),
            so.list_url(),
        )
        self.assertEqual(page.entries[0].netkeiba_id, "000a02c86e")
        self.assertEqual(page.entries[0].mother_name, "テストマザー")
        self.assertEqual(page.total_count, 1)

    def test_missing_table_is_error(self):
        with self.assertRaises(so.ScrapeError):
            so.parse_list_page("<html><body>メンテナンス中</body></html>", so.list_url())

    def test_helpers(self):
        self.assertEqual(so.normalize_sex("セン"), "セ")
        self.assertEqual(so.normalize_sex("牝2"), "牝")
        self.assertEqual(so.normalize_sex("不明"), "")
        self.assertEqual(so.parse_birth_date(""), "")
        with self.assertRaises(so.ScrapeError):
            so.parse_birth_date("2025年2月30日")
        self.assertEqual(so.extract_horse_id("/db/horse.html?id=000a02c86e&x=1"), "000a02c86e")
        self.assertEqual(so.extract_horse_id("https://db.netkeiba.com/horse/2019105283/"), "2019105283")
        self.assertIsNone(so.extract_horse_id("/db/horse.html?id=12345"))


class CollectTest(unittest.TestCase):
    def setUp(self):
        self.site = OfflineSite()

    def tearDown(self):
        self.site.close()

    def two_pages(self):
        page2 = so.list_url(2).replace("https://own.netkeiba.com", "")
        pager = f'<a href="{page2}">2</a><a href="{page2}">次へ</a>'
        self.site.put(
            "list_page1.html",
            list_html(
                [
                    dict(id="000a02c86e", name="テストAの2025", sex="牡", year="2025", mother="テストマザー", bms="テストグランサイア"),
                    dict(id="2025190001", name="テストB", sex="牝", year="2025", mother="同名マザー", bms=""),
                ],
                3,
                pager,
            ),
        )
        # 2ページ目には1ページ目と重複するIDも含める
        self.site.put(
            "list_page2.html",
            list_html(
                [
                    dict(id="2025190001", name="テストB", sex="牝", year="2025", mother="同名マザー", bms=""),
                    dict(id="2026190002", name="同名マザーの2026", sex="", year="2026", mother="同名マザー", bms=""),
                ],
                3,
                '<a href="/db/progeny_list.html?id=2019105283">1</a>',
            ),
        )
        self.site.put("horse_000a02c86e.html", detail_html())
        self.site.put("horse_2025190001.html", detail_html(birth="2025年4月1日", mother_id="2016100001", mother_name="同名マザー"))
        # 同名の母でもIDが異なる（詳細ページのリンクで区別される）。性別は詳細にもなく空欄のまま
        self.site.put(
            "horse_2026190002.html",
            detail_html(birth="", mother_id="2017100002", mother_name="同名マザー", bms="", breeder="", owner=""),
        )

    def test_collect_multi_page(self):
        self.two_pages()
        result = so.collect(self.site.fetcher())
        self.assertEqual(result.pages, 2)
        ids = [r["netkeiba_id"] for r in result.rows]
        self.assertEqual(ids, ["000a02c86e", "2025190001", "2026190002"])
        self.assertTrue(any("重複ID 2025190001" in w for w in result.warnings))

        by_id = {r["netkeiba_id"]: r for r in result.rows}
        self.assertEqual(by_id["000a02c86e"]["mother_netkeiba_id"], "2015199999")
        self.assertEqual(by_id["000a02c86e"]["birth_date"], "2025-03-12")
        # 同名の母でも別IDとして保持される
        self.assertEqual(by_id["2025190001"]["mother_netkeiba_id"], "2016100001")
        self.assertEqual(by_id["2026190002"]["mother_netkeiba_id"], "2017100002")
        # 未掲載の情報は推測で補完しない
        row = by_id["2026190002"]
        self.assertEqual((row["sex"], row["birth_date"], row["breeder"], row["owner"]), ("", "", "", ""))
        self.assertEqual(row["birth_year"], "2026")

    def test_count_mismatch_fails(self):
        self.two_pages()
        self.site.put("list_page2.html", list_html([], 3))  # 2ページ目が空 → 総件数3と不一致
        with self.assertRaisesRegex(so.ScrapeError, "一致しません"):
            so.collect(self.site.fetcher())

    def test_non_dodeuce_sire_fails(self):
        self.two_pages()
        self.site.put("horse_2025190001.html", detail_html(sire="2010100000", sire_name="ベツノチチ"))
        with self.assertRaisesRegex(so.ScrapeError, "ドウデュースではありません"):
            so.collect(self.site.fetcher())

    def test_birth_year_mismatch_fails(self):
        self.two_pages()
        self.site.put("horse_000a02c86e.html", detail_html(birth="2024年3月12日"))
        with self.assertRaisesRegex(so.ScrapeError, "生年"):
            so.collect(self.site.fetcher())

    def test_mother_without_link_warns(self):
        self.two_pages()
        self.site.put("horse_2025190001.html", detail_html(mother_id="", mother_name="同名マザー"))
        result = so.collect(self.site.fetcher())
        row = next(r for r in result.rows if r["netkeiba_id"] == "2025190001")
        self.assertEqual(row["mother_netkeiba_id"], "")
        self.assertEqual(row["mother_name"], "同名マザー")
        self.assertTrue(any("母のリンクがなく" in w for w in result.warnings))

    def test_failure_does_not_overwrite_existing_csv(self):
        self.two_pages()
        (self.site.dir / "horse_2026190002.html").unlink()  # 詳細ページの取得失敗を再現
        output = self.site.dir / "out.csv"
        output.write_text("既存の内容", encoding="utf-8")
        code = so.main(["--from-html-dir", str(self.site.dir), "--output", str(output)])
        self.assertEqual(code, 1)
        self.assertEqual(output.read_text(encoding="utf-8"), "既存の内容")

    def test_success_writes_csv(self):
        self.two_pages()
        output = self.site.dir / "out.csv"
        code = so.main(["--from-html-dir", str(self.site.dir), "--output", str(output)])
        self.assertEqual(code, 0)
        with output.open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
        self.assertEqual(len(rows), 3)
        self.assertEqual(list(rows[0].keys()), so.CSV_COLUMNS)
        self.assertEqual(rows[0]["netkeiba_id"], "000a02c86e")


class FetcherTest(unittest.TestCase):
    def test_http_error_is_not_retried_for_404(self):
        calls = []

        class Response:
            status_code = 404
            headers = {}
            content = b""

        class Session:
            headers = {}

            def get(self, url, timeout):
                calls.append(url)
                return Response()

        fetcher = so.Fetcher(interval=1.0, sleep=lambda s: None)
        fetcher._session = Session()
        with self.assertRaisesRegex(so.ScrapeError, "HTTP 404"):
            fetcher.get("https://example.invalid/", "x.html")
        self.assertEqual(len(calls), 1)

    def test_server_error_is_retried_with_interval(self):
        sleeps = []

        class Response:
            status_code = 503
            headers = {}
            content = b""

        class Session:
            headers = {}

            def get(self, url, timeout):
                return Response()

        fetcher = so.Fetcher(interval=2.0, retries=3, sleep=sleeps.append)
        fetcher._session = Session()
        with self.assertRaisesRegex(so.ScrapeError, "HTTP 503"):
            fetcher.get("https://example.invalid/", "x.html")
        self.assertTrue(sleeps and all(s > 0 for s in sleeps))


if __name__ == "__main__":
    unittest.main()
