-- 002_add_offspring.sql の動作確認用SQL
--
-- 【重要】本番DBでは実行しないこと。ローカルSupabase（supabase start）や検証用プロジェクトで、
-- 001 → 002 を適用した直後の空のDBに対して実行する。
-- 全体を BEGIN ... ROLLBACK で囲んでいるため、テストデータは残らない。
-- 失敗時は ASSERT のメッセージで停止する。

BEGIN;

-- テスト用データ（実在の馬ではない架空のIDを使う。ただし 000a01d5a9 / 2018104922 は
-- 既存サンプル・既存CSVのIDと同じ値で、同名別IDの誤紐付けが起きないことを確認する）
INSERT INTO mares (netkeiba_id, name) VALUES
  ('2018104922', 'アールドヴィーヴル'),   -- 既存2025年CSVのID
  ('000a01d5a9', 'アールドヴィーヴル');   -- 001のサンプル（実際には別馬のID）

-- 1. 母IDで紐付き、同名の別IDの母には紐付かない / 英数字IDを整数化しない
SELECT * FROM import_offspring('[
  {"netkeiba_id":"000a02c86e","name":"テスト産駒Aの2025","birth_year":"2025","birth_date":"2025-03-01","sex":"牡",
   "mother_netkeiba_id":"2018104922","mother_name":"アールドヴィーヴル","maternal_grandsire":"テスト母父",
   "breeder":"テスト牧場","owner":"テスト馬主","netkeiba_url":"https://db.netkeiba.com/horse/000a02c86e/"},
  {"netkeiba_id":"2025190001","name":"テスト産駒B","birth_year":"2025","sex":"牝",
   "mother_netkeiba_id":"2015199999","mother_name":"未登録の母"}
]'::jsonb);

DO $$
DECLARE v_mother uuid; v_expected uuid;
BEGIN
  SELECT id INTO v_expected FROM mares WHERE netkeiba_id = '2018104922';
  SELECT mother_id INTO v_mother FROM offspring WHERE netkeiba_id = '000a02c86e';
  ASSERT v_mother = v_expected, '母IDで正しいmaresに紐付いていない（同名別IDに紐付いた可能性）';
  ASSERT (SELECT netkeiba_id FROM offspring WHERE name = 'テスト産駒Aの2025') = '000a02c86e', '英数字IDが保持されていない';
  -- 2. 母が未登録でも母名・母IDを保持して保存できる
  ASSERT (SELECT mother_id IS NULL AND mother_netkeiba_id = '2015199999' AND mother_name = '未登録の母'
          FROM offspring WHERE netkeiba_id = '2025190001'), '未登録の母の産駒が正しく保存されていない';
END $$;

-- 3. 母が後から登録されると自動で紐付く
INSERT INTO mares (netkeiba_id, name) VALUES ('2015199999', '未登録の母');
DO $$
BEGIN
  ASSERT (SELECT o.mother_id = m.id FROM offspring o JOIN mares m ON m.netkeiba_id = '2015199999'
          WHERE o.netkeiba_id = '2025190001'), '後から登録した母に紐付いていない';
END $$;

-- 4. 改名しても同一産駒として更新される / 5. 空欄は既存値を消さない
SELECT * FROM import_offspring('[
  {"netkeiba_id":"000a02c86e","name":"テストセイシキメイ","birth_year":"","birth_date":"","sex":"",
   "mother_netkeiba_id":"2018104922","mother_name":"アールドヴィーヴル","maternal_grandsire":"",
   "breeder":"","owner":"新しい馬主"}
]'::jsonb);
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM offspring WHERE netkeiba_id = '000a02c86e') = 1, '改名で重複登録された';
  ASSERT (SELECT name FROM offspring WHERE netkeiba_id = '000a02c86e') = 'テストセイシキメイ', '馬名が更新されていない';
  ASSERT (SELECT birth_date = '2025-03-01' AND birth_year = 2025 AND sex = '牡'
            AND maternal_grandsire = 'テスト母父' AND breeder = 'テスト牧場'
          FROM offspring WHERE netkeiba_id = '000a02c86e'), '空欄の項目で既存値が消えた';
  ASSERT (SELECT owner FROM offspring WHERE netkeiba_id = '000a02c86e') = '新しい馬主', '値のある項目が更新されていない';
END $$;

-- 6. 1件でも不正な行があれば全件ロールバックされる
DO $$
BEGIN
  BEGIN
    PERFORM import_offspring('[
      {"netkeiba_id":"2025190002","name":"ロールバック確認"},
      {"netkeiba_id":"INVALID","name":"不正ID"}
    ]'::jsonb);
    RAISE EXCEPTION '不正な行が受け入れられた';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
  ASSERT NOT EXISTS (SELECT 1 FROM offspring WHERE netkeiba_id = '2025190002'), '不正行を含む取込が部分的に反映された';
END $$;

-- 7. 母のマスタ削除で産駒は削除されない（紐付けのみ解除、母ID・母名は保持）
DELETE FROM mares WHERE netkeiba_id = '2015199999';
DO $$
BEGIN
  ASSERT (SELECT mother_id IS NULL AND mother_netkeiba_id = '2015199999' AND mother_name = '未登録の母'
          FROM offspring WHERE netkeiba_id = '2025190001'), '母削除時の産駒の状態が不正';
END $$;
-- 再登録すると再び紐付く
INSERT INTO mares (netkeiba_id, name) VALUES ('2015199999', '未登録の母');
DO $$
BEGIN
  ASSERT (SELECT mother_id IS NOT NULL FROM offspring WHERE netkeiba_id = '2025190001'), '再登録で再紐付けされない';
END $$;

-- 8. 匿名ユーザー（anon）は読取のみ。書込・取込関数は拒否される
SET LOCAL ROLE anon;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM offspring;
  ASSERT n = 2, 'anonで産駒を読み取れない';

  BEGIN
    INSERT INTO offspring (netkeiba_id, name) VALUES ('2025190003', '匿名書込');
    RAISE EXCEPTION 'anonのINSERTが許可された';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM import_offspring('[{"netkeiba_id":"2025190004","name":"匿名取込"}]'::jsonb);
    RAISE EXCEPTION 'anonのimport_offspring実行が許可された';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  UPDATE offspring SET owner = '匿名更新';
  DELETE FROM offspring;
END $$;
RESET ROLE;
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM offspring) = 2, 'anonのDELETEが反映された';
  ASSERT NOT EXISTS (SELECT 1 FROM offspring WHERE owner = '匿名更新'), 'anonのUPDATEが反映された';
END $$;

-- 9. 既存テーブルの獲得賞金列が残っている
DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'mares' AND column_name = 'total_prize'), 'mares.total_prizeが存在しない';
END $$;

SELECT 'offspring migration checks passed' AS result;

ROLLBACK;
