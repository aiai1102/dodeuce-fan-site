-- ドウデュース応援サイト ニュース機能
-- 作成日: 2026-01-26

-- ============================================
-- 1. newsテーブル（ニュース）
-- ============================================

CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  quote text,
  source_name text NOT NULL,
  published_at date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);

-- コメント追加
COMMENT ON TABLE news IS 'ニュース: ドウデュース産駒に関するニュースリンクを管理';
COMMENT ON COLUMN news.id IS 'ニュースID（UUID、自動生成）';
COMMENT ON COLUMN news.title IS 'ニュースタイトル（記事の見出し）';
COMMENT ON COLUMN news.url IS '元記事のURL';
COMMENT ON COLUMN news.quote IS '引用文（50文字程度の短い引用）';
COMMENT ON COLUMN news.source_name IS '出典元名（netkeiba.com、競馬ブック等）';
COMMENT ON COLUMN news.published_at IS '記事公開日';
COMMENT ON COLUMN news.created_at IS 'レコード作成日時';

-- ============================================
-- 2. Row Level Security (RLS) 設定
-- ============================================

-- newsテーブルのRLS有効化
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- 一般ユーザー（anon, authenticated）: 読み取りのみ許可
CREATE POLICY "news_select_policy"
ON news FOR SELECT
TO anon, authenticated
USING (true);

-- 管理者（authenticated）: 全操作許可
CREATE POLICY "news_all_policy"
ON news FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
