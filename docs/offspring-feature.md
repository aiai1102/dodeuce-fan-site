# 産駒一覧の追加・獲得賞金の取込修正

作成日: 2026-10-04 / 対象ブランチ: `claude/add-offspring-list`（ベース: main `491214d`）

この資料は、産駒一覧の追加と獲得賞金の不具合修正について、調査結果・設計・取得方法・本番への適用手順・データ補正・検証結果・未確認事項をまとめたものです。

---

## 1. 調査結果（main `491214d` 時点）

| # | 項目 | 結果 |
|---|------|------|
| 1 | Pythonのスクレイピング処理 | **リポジトリに存在しない**。`SETUP_GUIDE.md` / `IMPLEMENTATION_SUMMARY.md` に「Pythonスクレイピングツール」への言及があるだけ。繁殖牝馬の取得処理は外部ツールと思われ、今回は**作り直していない** |
| 2 | CSV生成・取込 | 生成側はリポジトリ外。取込は `src/lib/csv/processor.ts`（PapaParseで読み込み、1行ずつ `mares` → `cover_records` をupsert。エラー行はスキップし他の行は登録） |
| 3 | 繁殖牝馬のデータ構造 | `mares`（牝馬マスタ）と `cover_records`（年度別交配記録、`(season_year, mare_id)` が一意、`mare_id` は `ON DELETE CASCADE`） |
| 4 | Supabaseのmigration | `supabase/migrations/001_initial_schema.sql` のみ。**架空のサンプル牝馬3頭と交配記録3件のINSERTを含む** |
| 5 | netkeiba IDの保存・更新 | `mares.netkeiba_id` は `text UNIQUE NOT NULL`。CSV取込で `onConflict: 'netkeiba_id'` のupsert。検証は `/^[a-z0-9]{10}$/` |
| 6 | 獲得賞金の不具合 | `processor.ts` が `parseInt(row.total_prize)` で変換しており、`"8,197"` → `8`。`data/dodeuce_mares_2025.csv` 50頭中21頭が桁区切りカンマ付き |
| 7 | 繁殖牝馬一覧 | `src/pages/MaresList.tsx`。年度は `const YEARS = [2025]` で固定。PCはテーブル、スマホはカード |
| 8 | ルーティング・ナビ | `src/App.tsx`（React Router）。ヘッダーには「管理」ボタンのみ。トップのCTAは `/mares/2025` |
| 9 | 産駒一覧の追加場所 | `src/pages/` に新規ページ、`App.tsx` にルート追加、`queries.ts` にクエリ追加 |
| 10 | 定期更新・GitHub Actions | `.github/` なし。定期更新の仕組みなし |

その他:

- 実際に使われるコードは `src/` 配下。ルート直下の `lib/`・`components/` は旧Next.js版の残骸で、現行Viteの画面からは参照されていない（今回変更していない）。
- AGENTS.md / CLAUDE.md は存在しない。
- `data/dodeuce_mares_2023.csv`・`2024.csv` は2025年と同じ50頭の年度違いファイルで、**実際のドウデュース交配実績として扱わない**（取り込まないこと）。
- 変更前から `npx tsc -p tsconfig.app.json --noEmit` で `src/components/ui/calendar.tsx(42,9)`（react-day-pickerのバージョン不整合）の型エラーが1件ある。`pnpm build`（vite build）は型検査をしないため成功する。

---

## 2. 変更内容

| 区分 | ファイル | 内容 |
|------|---------|------|
| 賞金修正 | `src/lib/csv/number.ts`（新規）, `src/lib/csv/processor.ts` | 整数を厳密に変換（カンマ区切り可、不正値はエラーで行ごと登録しない） |
| DB | `supabase/migrations/002_add_offspring.sql`（新規） | `offspring` テーブル、母の自動紐付けトリガー、取込関数 `import_offspring`、RLS |
| DB検証 | `supabase/tests/002_offspring_test.sql`（新規） | 紐付け・改名・空欄保持・ロールバック・母削除・匿名拒否の検証SQL（ROLLBACKで終わる） |
| 取得 | `scripts/offspring/`（新規） | 産駒CSVを生成するPython（繁殖牝馬取得とは独立）とテスト |
| 画面 | `src/pages/OffspringList.tsx`（新規） | 産駒一覧 `/offspring`（生年絞り込み・母での絞り込み） |
| 画面 | `src/pages/AdminOffspringImport.tsx`（新規） | 産駒CSV取込 `/admin/offspring-import`（確認→取込） |
| 画面 | `src/pages/MaresList.tsx` | 年度をDBから表示、`/mares` で最新年度へ、母→ドウデュース産駒リンク、既出走産駒の注記 |
| 画面 | `Header.tsx`, `Index.tsx`, `App.tsx`, `AdminImport.tsx`, `AdminMares.tsx` | ナビ・トップ導線・ルート・管理ナビ・削除ダイアログの文言 |
| その他 | `src/lib/types.ts`, `src/lib/supabase/queries.ts`, `src/lib/csv/offspringValidation.ts`, `public/sitemap.xml` | 型・クエリ・産駒CSV検証・サイトマップ |

既存の `mares` / `cover_records` の名前・構造、獲得賞金の列・表示・ソートは変更していません。

---

## 3. DB設計（`002_add_offspring.sql`）

### offspring テーブル

| 列 | 型 | 説明 |
|----|----|------|
| id | uuid PK | 自動生成 |
| netkeiba_id | text UNIQUE NOT NULL | 産駒ID。`000a02c86e` のような英字を含むため整数化しない（`^[0-9a-z]{10}$`） |
| name | text NOT NULL | 馬名（「○○の2026」→正式馬名に変わる） |
| birth_year | int | 生年 |
| birth_date | date | 生年月日（掲載がある場合のみ。birth_yearと矛盾する値はCHECKで拒否） |
| sex | text | 牡 / 牝 / セ |
| mother_id | uuid FK → mares.id `ON DELETE SET NULL` | トリガーで自動設定（手入力しない） |
| mother_netkeiba_id | text | 産駒詳細ページの「母」リンクから取得した母のID |
| mother_name | text | 母名（maresに未登録でも保持） |
| maternal_grandsire | text | **母父＝産駒の母の父**。繁殖牝馬自身の母父とは別の項目 |
| breeder / owner | text | 生産者 / 馬主 |
| netkeiba_url | text | 産駒のnetkeibaページ |
| created_at / updated_at | timestamptz | 作成・更新日時 |

### 母との紐付け

- `offspring.mother_netkeiba_id → mares.netkeiba_id` で解決します。**馬名では紐付けません**（同名の別馬に誤って紐付かない）。
- `trg_offspring_resolve_mother`: offspringの挿入・更新時に `mother_id` を再計算。
- `trg_mares_link_offspring`: maresに母が**後から登録**された（またはnetkeiba_idが修正された）とき、該当する産駒を自動で紐付け直す。
- 母を `mares` から削除しても、産駒は削除されず `mother_id` が NULL になるだけ（`mother_netkeiba_id`・`mother_name` は残る）。再登録すれば自動で再紐付けされる。
- 手動で紐付けを再計算したい場合（読取確認のうえ実行）:

  ```sql
  UPDATE offspring o SET mother_id = m.id
  FROM mares m
  WHERE o.mother_netkeiba_id = m.netkeiba_id AND o.mother_id IS DISTINCT FROM m.id;
  ```

- 出生年だけを根拠に特定の `cover_records`（交配記録）へ紐付けることはしていません。

### 取込関数 `import_offspring(rows jsonb)`

- 同じ `netkeiba_id` は UPDATE（改名しても重複登録しない）。
- **空欄の項目は既存値を消さない**（`COALESCE(新しい値, 既存値)`）。値がある項目は新しい値で更新する。
- 全行を1トランザクションで処理し、1件でもエラーなら**全件ロールバック**。
- `SECURITY INVOKER` のためRLSがそのまま適用される。`anon` からの実行権限は REVOKE。

### RLS

既存テーブルと同じ方針です。`anon, authenticated` は SELECT のみ、`authenticated` は全操作。**匿名ユーザーには書込権限を与えていません。**
（既存方針として「ログインできるユーザー＝管理者」です。Supabaseの新規登録（Sign up）が無効になっていることを本番設定で確認してください。）

### 将来の拡張

戦績・勝数・賞金・主な勝鞍・厩舎は、必要になった時点で `offspring` に列を追加する（または `offspring_id` を外部キーに持つ別テーブルを追加する）想定です。今回は空の列や画面は作っていません。

---

## 4. 産駒の取得（`scripts/offspring/scrape_offspring.py`）

### 流れ

1. 産駒一覧 `https://own.netkeiba.com/db/progeny_list.html?id=2019105283` の `Search_ResultTable` から産駒ID・馬名・（あれば）性別・生年・母名・母父を取得。ページ内の `page=` リンクをたどって**複数ページ**に対応。ページに総件数（「全○件」等）があれば取得件数と照合し、不一致なら失敗。
2. 一覧の**重複ID**は除外して警告。
3. 各産駒の詳細ページ `horse.html?id=…` の基本情報から、父・**母（リンクから母のnetkeiba ID）**・母父・生年月日・性別・生産者・馬主を取得。
4. **父がドウデュース**（ID `2019105283`）であることを確認。違う場合・確認できない場合は失敗。
5. 一覧の生年と生年月日が矛盾する場合は失敗。一覧と詳細で値が異なる場合は詳細を採用して警告。
6. **未掲載の項目は空欄のまま**（推測で補完しない）。母のリンクがない場合は母IDを空欄にして警告。
7. 全件成功した場合のみ、一時ファイルに書いてから出力CSVを置き換える。**途中で失敗した場合は既存CSVを上書きしない**（終了コード1）。

その他:

- リクエスト間隔は既定3秒（`--interval`、1秒未満は不可）。429/5xxは間隔を空けて最大3回リトライ、その他のHTTPエラー（404等）は即失敗。
- 公開HTMLには th/td の閉じタグの不整合があるため、ブラウザと同じ規則で補正する `html5lib` で解析します（テストで `html.parser` では父・生年月日が取れないことを確認済み）。
- 文字コードはmetaのcharset（EUC-JP想定）で厳密にデコードし、読めない場合は失敗（文字化けした馬名を保存しない）。

### 使い方

```bash
pip install -r scripts/offspring/requirements.txt

# 取得してCSVを生成（data/dodeuce_offspring.csv）
python scripts/offspring/scrape_offspring.py --output data/dodeuce_offspring.csv --save-html-dir tmp/netkeiba_html

# CSVを書かずに結果だけ確認
python scripts/offspring/scrape_offspring.py --dry-run

# 保存済みHTMLだけで再解析（通信しない。解析の検証用）
python scripts/offspring/scrape_offspring.py --from-html-dir tmp/netkeiba_html --output /tmp/check.csv

# テスト（架空のHTMLを使用）
python -m unittest discover -s scripts/offspring/tests -v
```

### 出力CSV

```
netkeiba_id,name,sex,birth_year,birth_date,mother_netkeiba_id,mother_name,maternal_grandsire,breeder,owner,netkeiba_url
```

生成したCSVは管理画面 `/admin/offspring-import` で内容を確認してから取り込みます（既存運用に合わせ、DBには直接書き込みません）。

### 【重要】実HTMLでの検証は未実施

作業環境のネットワーク制限で `own.netkeiba.com` / `db.netkeiba.com` / `do-deuce-fan.com` に接続できなかったため、**実際の公開HTMLでの動作確認はできていません**。最新の産駒頭数も確認できていません。
解析処理は、前回調査で分かった構造（`Search_ResultTable`、英数字ID、母欄リンクなし、詳細ページ基本情報の「母」リンク、th/tdの閉じタグ不整合）を再現した**架空のHTML**でテストしています。初回は次の手順で確認してください。

1. `--save-html-dir` 付きで実行し、エラーや警告の内容を確認する。
2. 出力CSVの頭数を公開ページの産駒数と照合する。英数字IDが保持されているか、母IDが全頭入っているかを確認する。
3. 数頭について、詳細ページの母・母父・生年月日・生産者・馬主とCSVを目視で照合する。
4. 一覧・詳細の見出し文字列が想定（`馬名` `性` `生年` `母` `母父` / `父` `母` `母父` `生年月日` `性別` `生産者` `馬主`）と異なり項目が空になる場合は、保存したHTMLを `--from-html-dir` で再解析しながら `LIST_HEADER_MAP` 等を調整する。

---

## 5. 本番への適用手順（この順で実施）

> 本PRでは本番DBの変更・本番公開は行っていません。以下は担当者が実施する手順です。

1. **バックアップ**: Supabaseダッシュボードでバックアップを確認（またはSQL Editorから `mares` / `cover_records` をCSVエクスポート）。
2. **事前確認（読取のみ）**: 「7. 既存サンプルの確認」「6. 獲得賞金の補正」の確認SQLを実行し、結果を記録する。
3. **migration適用**: SQL Editorで `supabase/migrations/002_add_offspring.sql` を実行する。
   - **`001_initial_schema.sql` は再実行しないこと**（サンプルデータが再挿入されるため）。
   - 002は既存テーブルのデータを変更しません（`mares` にトリガーを追加するのみ）。再実行しても安全です。
4. **適用確認（読取のみ）**:
   ```sql
   SELECT count(*) FROM offspring;                       -- 0
   SELECT polname, polroles::regrole[] FROM pg_policy WHERE polrelid = 'offspring'::regclass;
   SELECT has_function_privilege('anon', 'import_offspring(jsonb)', 'EXECUTE');  -- false
   ```
   検証用プロジェクトやローカルSupabaseがあれば `supabase/tests/002_offspring_test.sql` も実行する（本番では実行しない）。
5. **フロントのデプロイ**: mainへのマージ後、Vercelでデプロイ。
   - 002適用前にデプロイしても、繁殖牝馬一覧は表示されます（産駒列が非表示になるだけ）。産駒一覧はエラー表示になるため、3→5の順を推奨します。
6. **獲得賞金の補正**（「6.」参照）。
7. **産駒CSVの生成と取込**: 「4.」の手順でCSVを生成・確認し、`/admin/offspring-import` で「内容を確認」→母マスタの警告を確認→取込。
8. **公開画面の確認**: `/offspring`、`/mares/2025` の「ドウデュース産駒」列、スマホ表示。

---

## 6. 獲得賞金の不具合と既存データの補正

### 修正内容

- `src/lib/csv/number.ts` の `parsePrize` / `parseNonNegativeInt` で変換します。
  - `"8,197"` → 8197（3桁区切りのカンマのみ許可）、`"0"` → 0、空欄 → NULL（未掲載）
  - `"8,19"`、`"8.5"`、`"-1"`、`"8197万円"`、`"12abc"`、int範囲外などは**エラー**。その行は登録しません（途中で切り捨てない）。
- 同じ厳密変換を `season_year`・`mare_birth_year`・`offsprings_started` にも適用しました。
- 単位は従来どおり**万円単位の整数**。DB列 `mares.total_prize`、一覧の表示・ソートはそのままです。

### 既存DBの誤った値はコード修正だけでは直らない

本番DBには、旧コードで取り込んだ誤った値（例: アールドヴィーヴル 8 万円）が残っている可能性があります。

**確認（読取のみ）**: 2025年CSVでカンマ付きだった21頭について、DBの値を確認します。

```sql
SELECT v.netkeiba_id, v.name, m.total_prize AS db_value, v.correct, v.wrong_by_parseint,
       CASE WHEN m.total_prize = v.correct THEN 'OK'
            WHEN m.total_prize = v.wrong_by_parseint THEN '要補正'
            WHEN m.id IS NULL THEN '未登録'
            ELSE '要確認' END AS status
FROM (VALUES
  ('2018104922', 'アールドヴィーヴル', 8197, 8),
  ('2016101779', 'アイリスフィール', 2009, 2),
  ('2017106203', 'アカイイト', 23002, 23),
  ('2014105806', 'アズレージョ', 1450, 1),
  ('2012104128', 'アルティマブラッド', 11779, 11),
  ('2018106580', 'アルナージ', 1741, 1),
  ('2020103692', 'アルナージェイン', 2250, 2),
  ('2016104349', 'アンドラステ', 16534, 16),
  ('2015105970', 'アンリミット', 7778, 7),
  ('2010100975', 'ウキヨノカゼ', 18320, 18),
  ('2015104671', 'ウラヌスチャーム', 15138, 15),
  ('2016104649', 'エアジーン', 6571, 6),
  ('2015102382', 'オールフォーラヴ', 8140, 8),
  ('2014110121', 'カスタディーヴァ', 1140, 1),
  ('2018104239', 'クープドクール', 2768, 2),
  ('2019102742', 'クレア', 2724, 2),
  ('2019102327', 'ケデシュ', 3419, 3),
  ('2019105476', 'コラリン', 3484, 3),
  ('2019101156', 'ゴッドクインビー', 1590, 1),
  ('2018105179', 'サトノレイナス', 11338, 11),
  ('2014105928', 'サロニカ', 3826, 3)
) AS v(netkeiba_id, name, correct, wrong_by_parseint)
LEFT JOIN mares m ON m.netkeiba_id = v.netkeiba_id
ORDER BY status, v.netkeiba_id;
```

### 補正方法A（推奨）: 内容を確認したCSVの再取込

1. 本PRのコードがデプロイされたことを確認する。
2. `data/dodeuce_mares_2025.csv` の内容が現在の公開情報として正しいことを確認する（**2023/2024年のCSVは取り込まない**）。
3. `/admin/import` で再取込する。結果が「全50件中 成功: 50件」であることを確認。
4. 上の確認SQLで全件 `OK` になることを確認する。

**再取込は賞金以外の項目も更新します。** 1行ごとに次の項目がCSVの値で上書きされます（空欄の場合はNULLで上書き）。

- `mares`: `name`, `birth_year`, `sire_name`, `netkeiba_url`, `total_prize`, `best_win_class`
- `cover_records`（`season_year=2025` と母の組）: `cover_date`, `expected_foaling_date`, `offsprings_started`, `representative_offspring_name`, `representative_offspring_url`

DB上で手修正した値がある場合は、再取込で失われるため事前に差分を確認してください。

### 補正方法B: 賞金のみを更新するSQL（他の項目を変えたくない場合）

確認SQLで `要補正` だった行だけを更新します。実行前に必ず確認SQLの結果を見てください。

```sql
-- 実行前に BEGIN; で始め、件数を確認してから COMMIT; すること
UPDATE mares m SET total_prize = v.correct
FROM (VALUES
  ('2018104922', 8197, 8)  -- ↑の確認SQLのVALUESから (netkeiba_id, correct, wrong_by_parseint) を全行コピー
) AS v(netkeiba_id, correct, wrong_by_parseint)
WHERE m.netkeiba_id = v.netkeiba_id AND m.total_prize = v.wrong_by_parseint;
```

---

## 7. 既存サンプルデータの確認

`001_initial_schema.sql` には架空のサンプル（`000a01d5a9` アールドヴィーヴル、`000b02e6b0` サンプル牝馬A、`000c03f7c1` サンプル牝馬B）と交配記録が含まれます。
特に **`000a01d5a9` は実際には母馬ヴォーセルのID** です（既存2025年CSVのアールドヴィーヴルは `2018104922`）。サンプルが本番に残っていると:

- 交配牝馬一覧（2025年）にアールドヴィーヴルが2行表示される（サンプル牝馬Aも表示される）。年度タブにサンプル由来の2024年が表示される。
- 母IDが `000a01d5a9` の産駒（ヴォーセルの仔）が、サンプルの「アールドヴィーヴル」に紐付く。→ 一覧の「ドウデュース産駒」リンクや管理画面の取込確認で、母名の不一致として警告表示されます（本作業の検証で再現・確認済み）。

**確認（読取のみ）**:

```sql
-- サンプル牝馬
SELECT id, netkeiba_id, name, created_at FROM mares
WHERE netkeiba_id IN ('000a01d5a9', '000b02e6b0', '000c03f7c1');

-- サンプルに紐付く交配記録
SELECT c.id, c.season_year, c.cover_date, m.netkeiba_id, m.name
FROM cover_records c JOIN mares m ON m.id = c.mare_id
WHERE m.netkeiba_id IN ('000a01d5a9', '000b02e6b0', '000c03f7c1');

-- 同名で複数IDがある牝馬
SELECT name, array_agg(netkeiba_id) FROM mares GROUP BY name HAVING count(*) > 1;

-- 登録済みの年度と件数（2023/2024年のCSVを取り込んでいないか）
SELECT season_year, count(*) FROM cover_records GROUP BY season_year ORDER BY 1;

-- （002適用・産駒取込後）産駒の母名とマスタの馬名が異なるもの
SELECT o.netkeiba_id, o.name, o.mother_name, m.netkeiba_id AS mare_id, m.name AS mare_name
FROM offspring o JOIN mares m ON m.id = o.mother_id
WHERE o.mother_name IS DISTINCT FROM m.name;
```

サンプルや関連する交配記録の削除は、本PRでは行っていません。削除する場合は、上記の結果を確認したうえで担当者の判断で実施してください（`mares` を削除すると `cover_records` は CASCADE で削除され、`offspring` は残り紐付けのみ解除されます）。2023/2024年の交配記録が登録されていた場合も同様に、確認のうえ判断してください。

---

## 8. 繁殖牝馬一覧と年度追加

- 年度タブは `cover_records` に登録済みの `season_year` をDBから取得して新しい順に表示します（取得失敗時は2025年のみ）。
- `/mares` は登録済みの最新年度へ移動します。トップのCTA・サイトマップの `/mares/2025` は既存のまま残しています。
- 年度追加の運用: 交配牝馬が公開された後、その年度のCSVを `/admin/import` で取り込むだけで年度タブが増えます。**未公開の2026年交配牝馬は取得していません。**
- 「既出走産駒」「代表産駒」は母の産駒全体（父を問わない）の情報であり、ドウデュース産駒専用ではない旨を一覧に注記しました。ドウデュース産駒は別列「ドウデュース産駒」（産駒テーブルから母IDで集計）として表示し、産駒一覧の母絞り込み（`/offspring?mother=<母のnetkeiba ID>`）へリンクします。

---

## 9. 産駒一覧画面

- `/offspring`。表示項目: 産駒名・性別・生年・生年月日・母・母父・生産者・馬主。PCはテーブル、スマホはカード（既存の繁殖牝馬一覧と同じ構成・配色）。
- 生年の絞り込みボタンは登録データから自動生成（2026年、2027年…と増えても対応）。URLは `/offspring?year=2026`。
- 母名をクリックすると同じ母のドウデュース産駒に絞り込み（`?mother=`、母IDで絞るため同名の別馬は混ざらない）。アイコンはnetkeibaの母のページ。
- 読み込み中・取得失敗・掲載0件を表示。掲載0件は「掲載していない」と表示し、**未誕生とは断定しません**。
- 導線: ヘッダー（交配牝馬・産駒一覧）、トップのボタン、繁殖牝馬一覧の「ドウデュース産駒」列。

---

## 10. 公開一覧から賞金表示を外す場合の影響範囲（提案。今回は未実施）

| 対象 | 影響 |
|------|------|
| `src/pages/MaresList.tsx` | PCテーブルの「獲得賞金」列、スマホカードの「獲得賞金」行、並び替えの「獲得賞金（高い順/低い順）」を削除。`SortField` から `total_prize` を外すか残すか判断 |
| `src/lib/types.ts` | `SortField`、未使用の `MareFilters.minPrize/maxPrize` |
| `src/lib/supabase/queries.ts` | `getMaresByYear` のselectから `total_prize` を外せば公開APIの応答からも消える |
| RLS / API | 画面から消してもanonキーで `mares.total_prize` は読めるため、非公開にしたい場合は列単位の権限（`REVOKE SELECT (total_prize) ON mares FROM anon` 後に必要な列だけGRANT）やビューの導入が必要。`select('*')` を使う `getAllMares` 等に影響 |
| 管理画面 | `/admin/mares` の表示は管理用として残せる |
| CSV・DB列 | 取込と列は残しておけば、将来の再表示や分析に使える（削除は不可逆なので推奨しない） |
| 文言 | トップ「サイトの機能」の「検索・ソート機能」の説明は影響なし |

---

## 11. 検証結果

| 項目 | 方法 | 結果 |
|------|------|------|
| 賞金: カンマ・0・欠損・不正値 | `parsePrize` に16ケース（`8,197` `0` 空欄 `8,19` `8.5` `-1` `8197万円` `12abc` 範囲外など） | 合格 |
| 賞金: 既存2025年CSV | 50行すべて検証通過、カンマ付き21行が正しい値（例: 8,197→8197。旧parseIntでは8） | 合格 |
| 不正な賞金の行を登録しない | 不正値の行がエラーになることを確認 | 合格 |
| 産駒ID・母IDの取得（解析） | Pythonテスト13件（英数字ID、母欄リンクなし、詳細の母リンク、閉じタグ不整合、EUC-JP、複数ページ、重複ID、件数不一致、父の確認、生年矛盾、404は即失敗・503はリトライ、失敗時に既存CSVを上書きしない） | 合格（**架空HTML**） |
| 実際の公開HTMLでの取得 | ネットワーク制限で未実施 | **未確認** |
| 改名しても同一産駒として更新 | DB検証SQL / 画面から再取込（新規0・更新1） | 合格 |
| 空欄で既存値を消さない | 同上 | 合格 |
| 同名の別IDの母と誤って紐付かない | 001サンプル（同名・別ID）が存在する状態で実IDの母に紐付くことを確認。管理画面で同名別ID・母名不一致の警告表示 | 合格 |
| 母の未登録・後登録・削除・再登録 | DB検証SQL / 管理画面から母削除（産駒は残り紐付けのみ解除） | 合格 |
| 不正行を含む産駒CSV | 画面で取込ボタン無効 / DB関数で全件ロールバック | 合格 |
| 匿名書込の拒否 | anonロールでINSERT・取込関数実行が拒否、UPDATE・DELETEは0件 | 合格 |
| migration | 001→002適用、002の再実行、既存データ件数が変わらないこと | 合格 |
| 生年絞り込み・母リンク | ブラウザ（Playwright）で確認 | 合格 |
| PC・スマホ表示 | 1280px / 390px。スマホはカード表示、横スクロールなし | 合格 |
| 既存の繁殖牝馬一覧・CSV取込 | 2025年CSVを画面から取込（50件成功、賞金8,197万円表示、賞金ソートが数値順） | 合格 |
| 産駒テーブル未作成時の繁殖牝馬一覧 | 産駒APIがエラーでも一覧は表示（産駒列のみ非表示） | 合格 |
| 読み込み中・取得失敗・0件表示 | ブラウザで確認 | 合格 |
| Lint | `pnpm lint` | エラー0 |
| 型検査 | `npx tsc -p tsconfig.app.json --noEmit` | 既存の `calendar.tsx(42,9)` 1件のみ。**新規エラーなし** |
| 本番ビルド | `pnpm build` | 成功（500kB超のチャンク警告は変更前から） |

DB・画面の検証方法: PostgreSQL互換のPGlite（WASM）に001→002を適用し、Supabaseの `anon` / `authenticated` ロールと既定権限を再現。画面検証はVite開発サーバーで、SupabaseのREST呼び出しをPlaywrightで横取りしてPGliteに流しました（本物のSupabase/PostgRESTではありません）。

---

## 12. 未確認事項・注意点

1. **実際の公開HTMLでの取得**（ネットワーク制限のため）。最新の産駒頭数、一覧・詳細ページの見出し文字列、ページ送りの形式、総件数表示の有無、文字コード、性別が詳細ページにあるか、を初回実行時に確認してください（「4.」の手順）。
2. **本番DBの状態**（サンプル残存、誤った賞金、2023/2024年データの有無）。「6.」「7.」の確認SQLで確認してください。
3. **本物のSupabase上での動作**（PostgREST経由のRPC、RLS、既定権限）。検証用プロジェクトがあれば `002_offspring_test.sql` の実行を推奨します。
4. netkeibaの利用規約・アクセス頻度への配慮（既定3秒間隔、手動実行）。定期実行（GitHub Actions等）は今回追加していません。
5. 本番サイト（do-deuce-fan.com）の表示確認は未実施（同じくネットワーク制限）。
