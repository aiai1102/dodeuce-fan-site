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

# 実際の公開HTML（2026-10-04確認）の構造を再現した架空データ:
# - 総件数は <div class="ResultCurrentBox"><p class="Txt">15 件</p></div>（空の同名要素が先にある）
# - 表は id="Search_ResultTable"。各行は馬名の<th>で始まり</td>で閉じる（閉じタグ不整合）
# - 母欄はリンクなし（名前のみ）、未掲載は空欄
LIST_HEAD = """<html><head><meta charset="utf-8"></head><body>
<div class="ResultCurrentBox">
<!--<p class="Txt">103 件</p>-->
</div>
<div class="ResultCurrentBox"><p class="Txt">{total} 件</p></div>
<div class="Pager">{pager}</div>
<table class="NkOwnersTable01" id="Search_ResultTable">
<thead><tr>
<th name="name">馬名<span class="sort_icon"></span></th><th name="sex">性別</th><th name="birthyear">生年</th>
<th name="trainer">厩舎</th><th name="f_name">父</th><th name="mare">母</th><th name="mf_name">母父</th>
<th name="owner">馬主</th><th name="breeder">生産者</th><th>戦績</th><th name="prize">賞金</th><th>勝鞍クラス</th>
</tr></thead>
<tbody>
{rows}
</tbody></table></body></html>"""

LIST_ROW = (
    '<tr><th class="Head HorseName Txt_L Male">\n<a href="https://own.netkeiba.com/db/horse.html?id={id}">{name}</a>\n</td>'
    '<td class="Txt_C"><span class="Male">{sex}</span></td><td>{year}</td><td>\n</td><td>{sire}</td>'
    '<td>{mother}</td><td>{bms}</td><td>{owner}</td><td class="producer_breeder"></td><td>\n</td>'
    '<td class="Txt_R">0万円</th><td class="Txt_L"></th></tr>'
)

# 詳細ページ: 性別・生年月日・父は見出し下の1行、基本情報は dl/dt/dd。
# 母父は母欄の中に <p>母父: …</p> として入れ子。未掲載は「-」
DETAIL = """<html><head><meta charset="utf-8"></head><body>
<div class="HeaderSearchModal"><label>母父名</label><span>性別</span></div>
<div class="HorseHeader_Area"><div class="HorseHeader_Inner">
<div class="HorseHeader_NameWrap"><h1>テスト</h1></div>
<p><span class="{sex_class}">{sex}</span><span class="Keiro">栗毛</span><span class="Data">{birth}生 父{sire_name}</span></p>
</div></div>
<div class="CatalogProfTable01"><ul>
<li><dl><dt class="Sire">
父
</dt><dd class="Sire"><a href="https://own.netkeiba.com/db/horse.html?id={sire}" title="{sire_name}">{sire_name}</a></dd></dl></li>
<li><dl><dt class="Dam">
母
</dt><dd class="Dam">{mother_html}
<p>母父:
<a href="https://own.netkeiba.com/db/horse.html?id=2000100000" title="{bms}">{bms}</a>
</p></dd></dl></li>
<li><dl><dt>馬主</dt><dd><div class="ClothesImgWrap"><img alt="{owner}"></div>
{owner}
</dd></dl></li>
<li><dl><dt>調教師</dt><dd>-</dd></dl></li>
<li><dl><dt>生産者</dt><dd>
{breeder}
</dd></dl></li>
</ul></div>
</body></html>"""

# 以前の想定（th/td の表、閉じタグ不整合）も引き続き読めることを確認する
LEGACY_DETAIL = """<html><head><meta charset="EUC-JP"></head><body>
<table class="db_prof_table">
<tr><th>生年月日</td><td>2025年3月12日</th></tr>
<tr><th>父<td><a href="/db/horse.html?id=2019105283">ドウデュース</a>
<tr><th>母</th><td><a href="https://db.netkeiba.com/horse/2015199999/">テストマザー</a></td></tr>
<tr><th>母父</th><td>テストグランサイア</tr>
<tr><th>生産者</th><td><a href="/db/breeder.html?id=x">テストファーム</a></td></tr>
<tr><th>馬主</th><td>テストオーナー
</table>
</body></html>"""


def list_html(rows, total, pager=""):
    defaults = dict(sex="", year="", sire="ドウデュース", mother="", bms="", owner="")
    body = "\n".join(LIST_ROW.format(**{**defaults, **r}) for r in rows)
    return LIST_HEAD.format(rows=body, total=total, pager=pager)


def detail_html(
    birth="2025年3月12日",
    sex="牡",
    sire=so.SIRE_NETKEIBA_ID,
    sire_name="ドウデュース",
    mother_id="2015199999",
    mother_name="テストマザー",
    bms="テストグランサイア",
    breeder="テストファーム",
    owner="テストオーナー",
):
    if mother_id:
        mother_html = f'<a href="https://own.netkeiba.com/db/horse.html?id={mother_id}" title="{mother_name}">{mother_name}</a>'
    else:
        mother_html = mother_name
    return DETAIL.format(
        birth=birth,
        sex=sex or "",
        sex_class="FeMale" if sex == "牝" else "Male",
        sire=sire,
        sire_name=sire_name,
        mother_html=mother_html,
        bms=bms,
        breeder=breeder or "-",
        owner=owner or "-",
    )


class OfflineSite:
    """保存済みHTML（EUC-JP）ディレクトリを作る。"""

    def __init__(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self._tmp.name)

    def put(self, key, html, encoding="utf-8"):
        (self.dir / key).write_bytes(html.encode(encoding))

    def fetcher(self):
        return so.Fetcher(offline_dir=self.dir)

    def close(self):
        self._tmp.cleanup()


class ParseTest(unittest.TestCase):
    def test_detail_real_structure(self):
        detail = so.parse_detail_page(detail_html(sex="牝"))
        self.assertEqual(detail.sex, "牝")
        self.assertEqual(detail.sire_id, so.SIRE_NETKEIBA_ID)
        self.assertEqual(detail.mother_id, "2015199999")
        self.assertEqual(detail.mother_name, "テストマザー")
        self.assertEqual(detail.birth_date, "2025-03-12")
        self.assertEqual(detail.maternal_grandsire, "テストグランサイア")
        self.assertEqual(detail.breeder, "テストファーム")
        self.assertEqual(detail.owner, "テストオーナー")

    def test_detail_placeholder_is_blank(self):
        detail = so.parse_detail_page(detail_html(breeder="", owner=""))
        self.assertEqual((detail.breeder, detail.owner), ("", ""))

    def test_detail_sire_mismatch_between_header_and_table_fails(self):
        html = detail_html().replace("父ドウデュース", "父ベツノウマ")
        with self.assertRaises(so.ScrapeError):
            so.parse_detail_page(html)

    def test_legacy_table_with_broken_tags(self):
        detail = so.parse_detail_page(so.decode_html(LEGACY_DETAIL.encode("euc_jis_2004")))
        self.assertEqual(detail.sire_id, so.SIRE_NETKEIBA_ID)
        self.assertEqual(detail.mother_id, "2015199999")
        self.assertEqual(detail.birth_date, "2025-03-12")
        self.assertEqual(detail.maternal_grandsire, "テストグランサイア")
        self.assertEqual(detail.owner, "テストオーナー")

    def test_alphanumeric_id_is_kept_as_text(self):
        page = so.parse_list_page(
            list_html([dict(id="000a02c86e", name="テストAの2025", sex="牡", year="2025", mother="テストマザー", bms="X", owner="-")], 1),
            so.list_url(),
        )
        self.assertEqual(page.entries[0].netkeiba_id, "000a02c86e")
        self.assertEqual(page.entries[0].sire_name, "ドウデュース")
        self.assertEqual(page.entries[0].owner, "")
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
        # 2頭目は旧来のEUC-JPページでも読めることを確認
        self.site.put(
            "horse_2025190001.html",
            detail_html(birth="2025年4月1日", sex="牝", mother_id="2016100001", mother_name="同名マザー"),
            encoding="euc_jis_2004",
        )
        # 同名の母でもIDが異なる（詳細ページのリンクで区別される）。性別・生年月日は未掲載で空欄のまま
        self.site.put(
            "horse_2026190002.html",
            detail_html(birth="", sex="", mother_id="2017100002", mother_name="同名マザー", bms="", breeder="", owner="")
            .replace("<span class=\"Data\">生 父ドウデュース", "<span class=\"Data\">父ドウデュース"),
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

    def test_list_non_dodeuce_sire_fails(self):
        self.two_pages()
        page = list_html([dict(id="000a02c86e", name="テストAの2025", year="2025", sire="ベツノチチ")], 1)
        self.site.put("list_page1.html", page)
        with self.assertRaisesRegex(so.ScrapeError, "一覧の父"):
            so.collect(self.site.fetcher())

    def test_non_dodeuce_sire_fails(self):
        self.two_pages()
        self.site.put("horse_2025190001.html", detail_html(birth="2025年4月1日", sire="2010100000", sire_name="ベツノチチ"))
        with self.assertRaisesRegex(so.ScrapeError, "ドウデュースではありません"):
            so.collect(self.site.fetcher())

    def test_birth_year_mismatch_fails(self):
        self.two_pages()
        self.site.put("horse_000a02c86e.html", detail_html(birth="2024年3月12日"))
        with self.assertRaisesRegex(so.ScrapeError, "生年"):
            so.collect(self.site.fetcher())

    def test_mother_without_link_warns(self):
        self.two_pages()
        self.site.put("horse_2025190001.html", detail_html(birth="2025年4月1日", mother_id="", mother_name="同名マザー"))
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
