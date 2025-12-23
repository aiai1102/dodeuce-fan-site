# ドウデュース応援サイト Phase1

種牡馬ドウデュースの交配牝馬一覧を表示するWeb応援サイトです。

## 技術スタック

- **フロントエンド**: Vite + React 18 + TypeScript + React Router + Tailwind CSS + Shadcn-ui
- **バックエンド**: Supabase (PostgreSQL + Auth)
- **デプロイ**: Vercel

## 機能

### 一般ユーザー向け
- **トップページ**: ドウデュース紹介、将来機能の告知
- **交配牝馬一覧**: 年別表示（2023/2024/2025）、フィルタ・ソート機能
- **レスポンシブ対応**: PC（テーブル形式）、スマホ（カード形式）

### 管理者向け
- **管理者ログイン**: Supabase Auth（メール+パスワード）
- **CSVアップロード**: 交配牝馬データの一括登録・更新
- **管理用一覧**: 登録済牝馬の検索・削除

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabaseデータベースのセットアップ

Supabaseプロジェクトを作成後、`supabase/migrations/001_initial_schema.sql`のSQLを実行してテーブルを作成してください。

#### Supabase Studioでの実行手順：
1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. `001_initial_schema.sql`の内容をコピー&ペースト
5. 「Run」ボタンをクリックして実行

### 4. 管理者アカウントの作成

Supabase Studioで管理者アカウントを作成してください：

1. 左メニューから「Authentication」→「Users」を選択
2. 「Add user」→「Create new user」を選択
3. メールアドレスとパスワードを入力
4. 「Create user」をクリック

### 5. 開発サーバーの起動

```bash
pnpm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## ディレクトリ構成

```
/workspace/shadcn-ui/
├── src/
│   ├── App.tsx                   # ルートコンポーネント（React Router設定）
│   ├── main.tsx                  # エントリーポイント
│   ├── pages/                    # ページコンポーネント
│   │   ├── Index.tsx             # トップページ
│   │   ├── MaresList.tsx         # 交配牝馬一覧
│   │   ├── AdminLogin.tsx        # 管理者ログイン
│   │   ├── AdminImport.tsx       # CSVアップロード
│   │   └── AdminMares.tsx        # 管理用一覧
│   ├── components/               # コンポーネント
│   │   ├── layout/               # レイアウト
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/                   # Shadcn-ui コンポーネント
│   └── lib/                      # ライブラリ・ユーティリティ
│       ├── types.ts              # TypeScript型定義
│       ├── supabase/             # Supabase関連
│       │   ├── client.ts
│       │   └── queries.ts
│       ├── csv/                  # CSV処理
│       │   └── processor.ts
│       └── utils/                # ユーティリティ関数
│           └── format.ts
├── supabase/                     # Supabaseマイグレーション
│   └── migrations/
│       └── 001_initial_schema.sql
├── index.html                    # HTMLエントリーポイント
└── vite.config.ts                # Vite設定
```

## データベーススキーマ

### mares（牝馬マスタ）
- `id`: UUID（主キー）
- `netkeiba_id`: netkeibaの牝馬ID（ユニーク）
- `name`: 牝馬名
- `birth_year`: 生年
- `sire_name`: 父馬名
- `netkeiba_url`: netkeibaURL
- `total_prize`: 獲得賞金（万円）
- `best_win_class`: 最高勝鞍クラス
- `created_at`: 作成日時

### cover_records（交配記録）
- `id`: UUID（主キー）
- `stallion_name`: 種牡馬名（"ドウデュース"固定）
- `mare_id`: 牝馬ID（外部キー）
- `season_year`: 交配年
- `cover_date`: 種付け日
- `expected_foaling_date`: 生産予定日
- `offsprings_started`: 既出走産駒頭数
- `representative_offspring_name`: 代表産駒名
- `representative_offspring_url`: 代表産駒URL
- `created_at`: 作成日時

## CSVフォーマット

CSVアップロード用のフォーマット：

```csv
season_year,netkeiba_id,mare_name,mare_birth_year,mare_sire_name,cover_date,expected_foaling_date,total_prize,best_win_class,offsprings_started,representative_offspring_name,representative_offspring_url,mare_netkeiba_url
2025,000a01d5a9,アールドヴィーヴル,2018,キングカメハメハ,2025-03-12,2026-02-12,8197,3勝クラス,1,ステラヴェローチェ,https://db.netkeiba.com/horse/xxxx,https://db.netkeiba.com/horse/000a01d5a9
```

### 必須項目
- `season_year`: 交配年（数値）
- `netkeiba_id`: netkeibaの牝馬ID（10文字の英数字）
- `mare_name`: 牝馬名

### オプション項目
- その他の項目は空欄でも可

## デプロイ

### Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. Vercelダッシュボードで「New Project」
3. GitHubリポジトリを選択
4. 環境変数を設定：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. 「Deploy」をクリック

## 開発コマンド

```bash
# 開発サーバー起動
pnpm run dev

# ビルド
pnpm run build

# 本番環境プレビュー
pnpm run preview

# リント
pnpm run lint
```

## ルート構成

- `/` - トップページ
- `/mares/:year` - 交配牝馬一覧（2023/2024/2025）
- `/admin/login` - 管理者ログイン
- `/admin/import` - CSVアップロード
- `/admin/mares` - 管理用一覧

## Phase2以降の予定

- **Phase2**: 牝馬詳細ページ、産駒データベース
- **Phase3**: 写真投稿機能、応援掲示板
- **Phase4**: iOSアプリ、プッシュ通知

## ライセンス

このプロジェクトは個人の応援サイトです。

## お問い合わせ

バグ報告や機能要望は、GitHubのIssuesまでお願いします。"" 
"<!-- Deployment test -->" 
