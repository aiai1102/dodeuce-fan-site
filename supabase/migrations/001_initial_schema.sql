-- ドウデュース応援サイト Phase1 データベーススキーマ
-- 作成日: 2025-12-22

-- ============================================
-- 1. maresテーブル（牝馬マスタ）
-- ============================================

CREATE TABLE IF NOT EXISTS mares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  netkeiba_id text UNIQUE NOT NULL,
  name text NOT NULL,
  birth_year int,
  sire_name text,
  netkeiba_url text,
  total_prize int,
  best_win_class text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_mares_netkeiba_id ON mares(netkeiba_id);
CREATE INDEX IF NOT EXISTS idx_mares_name ON mares(name);

-- コメント追加
COMMENT ON TABLE mares IS '牝馬マスタ: 交配牝馬の基本情報を管理';
COMMENT ON COLUMN mares.id IS '牝馬ID（UUID、自動生成）';
COMMENT ON COLUMN mares.netkeiba_id IS 'netkeibaの牝馬ID（10文字英数字、一意）';
COMMENT ON COLUMN mares.name IS '牝馬名';
COMMENT ON COLUMN mares.birth_year IS '牝馬の生年';
COMMENT ON COLUMN mares.sire_name IS '牝馬の父馬名';
COMMENT ON COLUMN mares.netkeiba_url IS 'netkeibaの牝馬詳細ページURL';
COMMENT ON COLUMN mares.total_prize IS '獲得賞金（万円単位）';
COMMENT ON COLUMN mares.best_win_class IS '最高勝鞍クラス（G1、重賞、3勝クラスなど）';
COMMENT ON COLUMN mares.created_at IS 'レコード作成日時';

-- ============================================
-- 2. cover_recordsテーブル（交配記録）
-- ============================================

CREATE TABLE IF NOT EXISTS cover_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stallion_name text NOT NULL DEFAULT 'ドウデュース',
  mare_id uuid NOT NULL REFERENCES mares(id) ON DELETE CASCADE,
  season_year int NOT NULL,
  cover_date date,
  expected_foaling_date date,
  offsprings_started int,
  representative_offspring_name text,
  representative_offspring_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(season_year, mare_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_cover_records_mare_id ON cover_records(mare_id);
CREATE INDEX IF NOT EXISTS idx_cover_records_season_year ON cover_records(season_year);
CREATE INDEX IF NOT EXISTS idx_cover_records_cover_date ON cover_records(cover_date);

-- コメント追加
COMMENT ON TABLE cover_records IS '交配記録: 種牡馬と牝馬の交配情報を管理';
COMMENT ON COLUMN cover_records.id IS '交配記録ID（UUID、自動生成）';
COMMENT ON COLUMN cover_records.stallion_name IS '種牡馬名（Phase1では"ドウデュース"固定）';
COMMENT ON COLUMN cover_records.mare_id IS '牝馬ID（外部キー: mares.id）';
COMMENT ON COLUMN cover_records.season_year IS '交配年度';
COMMENT ON COLUMN cover_records.cover_date IS '種付け日';
COMMENT ON COLUMN cover_records.expected_foaling_date IS '生産予定日（種付け日 + 11ヶ月）';
COMMENT ON COLUMN cover_records.offsprings_started IS '既出走産駒頭数';
COMMENT ON COLUMN cover_records.representative_offspring_name IS '代表産駒名';
COMMENT ON COLUMN cover_records.representative_offspring_url IS '代表産駒のnetkeibaページURL';
COMMENT ON COLUMN cover_records.created_at IS 'レコード作成日時';

-- ============================================
-- 3. Row Level Security (RLS) 設定
-- ============================================

-- maresテーブルのRLS有効化
ALTER TABLE mares ENABLE ROW LEVEL SECURITY;

-- 一般ユーザー（anon, authenticated）: 読み取りのみ許可
CREATE POLICY "mares_select_policy"
ON mares FOR SELECT
TO anon, authenticated
USING (true);

-- 管理者（authenticated）: 全操作許可
CREATE POLICY "mares_all_policy"
ON mares FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- cover_recordsテーブルのRLS有効化
ALTER TABLE cover_records ENABLE ROW LEVEL SECURITY;

-- 一般ユーザー（anon, authenticated）: 読み取りのみ許可
CREATE POLICY "cover_records_select_policy"
ON cover_records FOR SELECT
TO anon, authenticated
USING (true);

-- 管理者（authenticated）: 全操作許可
CREATE POLICY "cover_records_all_policy"
ON cover_records FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. サンプルデータ（開発・テスト用）
-- ============================================

-- サンプル牝馬データ
INSERT INTO mares (netkeiba_id, name, birth_year, sire_name, netkeiba_url, total_prize, best_win_class)
VALUES
  ('000a01d5a9', 'アールドヴィーヴル', 2018, 'キングカメハメハ', 'https://db.netkeiba.com/horse/000a01d5a9', 8197, '3勝クラス'),
  ('000b02e6b0', 'サンプル牝馬A', 2019, 'ディープインパクト', 'https://db.netkeiba.com/horse/000b02e6b0', 15000, 'G1'),
  ('000c03f7c1', 'サンプル牝馬B', 2017, 'ロードカナロア', 'https://db.netkeiba.com/horse/000c03f7c1', 5000, '2勝クラス')
ON CONFLICT (netkeiba_id) DO NOTHING;

-- サンプル交配記録データ
INSERT INTO cover_records (stallion_name, mare_id, season_year, cover_date, expected_foaling_date, offsprings_started, representative_offspring_name, representative_offspring_url)
SELECT
  'ドウデュース',
  id,
  2025,
  '2025-03-12'::date,
  '2026-02-12'::date,
  1,
  'ステラヴェローチェ',
  'https://db.netkeiba.com/horse/2022105678'
FROM mares
WHERE netkeiba_id = '000a01d5a9'
ON CONFLICT (season_year, mare_id) DO NOTHING;

INSERT INTO cover_records (stallion_name, mare_id, season_year, cover_date, expected_foaling_date, offsprings_started, representative_offspring_name, representative_offspring_url)
SELECT
  'ドウデュース',
  id,
  2025,
  '2025-03-15'::date,
  '2026-02-15'::date,
  0,
  NULL,
  NULL
FROM mares
WHERE netkeiba_id = '000b02e6b0'
ON CONFLICT (season_year, mare_id) DO NOTHING;

INSERT INTO cover_records (stallion_name, mare_id, season_year, cover_date, expected_foaling_date, offsprings_started, representative_offspring_name, representative_offspring_url)
SELECT
  'ドウデュース',
  id,
  2024,
  '2024-03-10'::date,
  '2025-02-10'::date,
  2,
  'サンプル産駒',
  'https://db.netkeiba.com/horse/2023106789'
FROM mares
WHERE netkeiba_id = '000c03f7c1'
ON CONFLICT (season_year, mare_id) DO NOTHING;