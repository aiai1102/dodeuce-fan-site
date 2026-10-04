-- ドウデュース応援サイト 産駒テーブル追加
-- 作成日: 2026-10-04
--
-- 既存DBには 001_initial_schema.sql を再実行しないこと（サンプルデータが再挿入されるため）。
-- 本ファイルは既存の mares / cover_records を変更せず、offspring テーブルと関連関数のみを追加する。
-- サンプルデータは含めない。

-- ============================================
-- 1. offspringテーブル（ドウデュース産駒）
-- ============================================

CREATE TABLE IF NOT EXISTS offspring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  netkeiba_id text UNIQUE NOT NULL CHECK (netkeiba_id ~ '^[0-9a-z]{10}$'),
  name text NOT NULL CHECK (btrim(name) <> ''),
  birth_year int CHECK (birth_year BETWEEN 1900 AND 2100),
  birth_date date,
  sex text CHECK (sex IN ('牡', '牝', 'セ')),
  -- 母との紐付けは馬名ではなく mother_netkeiba_id → mares.netkeiba_id で解決する（トリガーで自動設定）
  mother_id uuid REFERENCES mares(id) ON DELETE SET NULL,
  mother_netkeiba_id text CHECK (mother_netkeiba_id ~ '^[0-9a-z]{10}$'),
  mother_name text,
  maternal_grandsire text,
  breeder text,
  owner text,
  netkeiba_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (birth_date IS NULL OR birth_year IS NULL OR EXTRACT(YEAR FROM birth_date)::int = birth_year)
);

CREATE INDEX IF NOT EXISTS idx_offspring_mother_id ON offspring(mother_id);
CREATE INDEX IF NOT EXISTS idx_offspring_mother_netkeiba_id ON offspring(mother_netkeiba_id);
CREATE INDEX IF NOT EXISTS idx_offspring_birth_year ON offspring(birth_year);

COMMENT ON TABLE offspring IS 'ドウデュース産駒: netkeibaの産駒一覧・馬詳細ページから取得した産駒情報';
COMMENT ON COLUMN offspring.id IS '産駒ID（UUID、自動生成）';
COMMENT ON COLUMN offspring.netkeiba_id IS 'netkeibaの産駒ID（10文字英数字、一意。000a02c86eのような英字を含むため整数化しない）';
COMMENT ON COLUMN offspring.name IS '馬名（「○○の2026」のような仮名から正式馬名に変わる場合がある）';
COMMENT ON COLUMN offspring.birth_year IS '生年';
COMMENT ON COLUMN offspring.birth_date IS '生年月日（netkeibaに掲載がある場合のみ）';
COMMENT ON COLUMN offspring.sex IS '性別（牡/牝/セ）';
COMMENT ON COLUMN offspring.mother_id IS '母（外部キー: mares.id）。mother_netkeiba_idから自動設定。母マスタ削除時はNULLになり産駒は残る';
COMMENT ON COLUMN offspring.mother_netkeiba_id IS '母のnetkeiba ID（産駒詳細ページの「母」リンクから取得）';
COMMENT ON COLUMN offspring.mother_name IS '母名（取得時点の表記。maresへの登録有無に関係なく保持）';
COMMENT ON COLUMN offspring.maternal_grandsire IS '母父（母馬の父）。繁殖牝馬自身の母父とは別の項目';
COMMENT ON COLUMN offspring.breeder IS '生産者';
COMMENT ON COLUMN offspring.owner IS '馬主';
COMMENT ON COLUMN offspring.netkeiba_url IS 'netkeibaの産駒詳細ページURL';
COMMENT ON COLUMN offspring.created_at IS 'レコード作成日時';
COMMENT ON COLUMN offspring.updated_at IS 'レコード更新日時';

-- ============================================
-- 2. 母の自動紐付け
-- ============================================

-- offspring挿入・更新時に mother_netkeiba_id から mother_id を解決する
CREATE OR REPLACE FUNCTION offspring_resolve_mother()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.mother_netkeiba_id IS NULL THEN
    NEW.mother_id := NULL;
  ELSE
    NEW.mother_id := (SELECT m.id FROM mares m WHERE m.netkeiba_id = NEW.mother_netkeiba_id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_offspring_resolve_mother ON offspring;
CREATE TRIGGER trg_offspring_resolve_mother
BEFORE INSERT OR UPDATE ON offspring
FOR EACH ROW EXECUTE FUNCTION offspring_resolve_mother();

-- 母がmaresに後から登録された（またはnetkeiba_idが修正された）場合に産駒を紐付け直す
CREATE OR REPLACE FUNCTION mares_link_offspring()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.netkeiba_id IS DISTINCT FROM OLD.netkeiba_id THEN
    UPDATE offspring SET mother_id = NULL
    WHERE mother_id = NEW.id;
  END IF;

  UPDATE offspring SET mother_id = NEW.id
  WHERE mother_netkeiba_id = NEW.netkeiba_id
    AND mother_id IS DISTINCT FROM NEW.id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_mares_link_offspring ON mares;
CREATE TRIGGER trg_mares_link_offspring
AFTER INSERT OR UPDATE OF netkeiba_id ON mares
FOR EACH ROW EXECUTE FUNCTION mares_link_offspring();

-- ============================================
-- 3. CSV取込用関数（全件を1トランザクションで処理）
-- ============================================

-- 同じnetkeiba_idは更新（改名しても重複登録しない）。
-- 空欄の項目は既存の値を消さない（COALESCE）。値がある項目は新しい値で更新する。
-- 1件でもエラーがあれば全件ロールバックされる。
CREATE OR REPLACE FUNCTION import_offspring(rows jsonb)
RETURNS TABLE (inserted_count int, updated_count int)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  r jsonb;
  was_inserted boolean;
  ins int := 0;
  upd int := 0;
BEGIN
  IF rows IS NULL OR jsonb_typeof(rows) <> 'array' THEN
    RAISE EXCEPTION 'rowsはJSON配列である必要があります';
  END IF;

  FOR r IN SELECT value FROM jsonb_array_elements(rows) LOOP
    INSERT INTO offspring AS o (
      netkeiba_id, name, birth_year, birth_date, sex,
      mother_netkeiba_id, mother_name, maternal_grandsire, breeder, owner, netkeiba_url
    )
    VALUES (
      NULLIF(btrim(r->>'netkeiba_id'), ''),
      NULLIF(btrim(r->>'name'), ''),
      NULLIF(btrim(r->>'birth_year'), '')::int,
      NULLIF(btrim(r->>'birth_date'), '')::date,
      NULLIF(btrim(r->>'sex'), ''),
      NULLIF(btrim(r->>'mother_netkeiba_id'), ''),
      NULLIF(btrim(r->>'mother_name'), ''),
      NULLIF(btrim(r->>'maternal_grandsire'), ''),
      NULLIF(btrim(r->>'breeder'), ''),
      NULLIF(btrim(r->>'owner'), ''),
      NULLIF(btrim(r->>'netkeiba_url'), '')
    )
    ON CONFLICT (netkeiba_id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, o.name),
      birth_year = COALESCE(EXCLUDED.birth_year, o.birth_year),
      birth_date = COALESCE(EXCLUDED.birth_date, o.birth_date),
      sex = COALESCE(EXCLUDED.sex, o.sex),
      mother_netkeiba_id = COALESCE(EXCLUDED.mother_netkeiba_id, o.mother_netkeiba_id),
      mother_name = COALESCE(EXCLUDED.mother_name, o.mother_name),
      maternal_grandsire = COALESCE(EXCLUDED.maternal_grandsire, o.maternal_grandsire),
      breeder = COALESCE(EXCLUDED.breeder, o.breeder),
      owner = COALESCE(EXCLUDED.owner, o.owner),
      netkeiba_url = COALESCE(EXCLUDED.netkeiba_url, o.netkeiba_url)
    RETURNING (xmax = 0) INTO was_inserted;

    IF was_inserted THEN
      ins := ins + 1;
    ELSE
      upd := upd + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT ins, upd;
END;
$$;

-- 匿名ユーザーには取込関数を実行させない（RLSでも書込は拒否されるが二重に防ぐ）
REVOKE ALL ON FUNCTION import_offspring(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION import_offspring(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION import_offspring(jsonb) TO authenticated;

-- ============================================
-- 4. Row Level Security (RLS) 設定（既存テーブルと同じ方針）
-- ============================================

ALTER TABLE offspring ENABLE ROW LEVEL SECURITY;

-- 一般ユーザー（anon, authenticated）: 読み取りのみ許可
DROP POLICY IF EXISTS "offspring_select_policy" ON offspring;
CREATE POLICY "offspring_select_policy"
ON offspring FOR SELECT
TO anon, authenticated
USING (true);

-- 管理者（authenticated）: 全操作許可
DROP POLICY IF EXISTS "offspring_all_policy" ON offspring;
CREATE POLICY "offspring_all_policy"
ON offspring FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
