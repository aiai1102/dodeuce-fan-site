# ドウデュース応援サイト セットアップガイド

このガイドでは、ドウデュース応援サイトをゼロから立ち上げる手順を説明します。

## 前提条件

- Node.js 18以上がインストールされていること
- pnpmがインストールされていること（`npm install -g pnpm`）
- Supabaseアカウントを持っていること

## ステップ1: プロジェクトのクローン

```bash
git clone <repository-url>
cd shadcn-ui
```

## ステップ2: 依存関係のインストール

```bash
pnpm install
```

## ステップ3: Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてログイン
2. 「New Project」をクリック
3. プロジェクト名を入力（例: `doduece-support-site`）
4. データベースパスワードを設定（安全なパスワードを使用）
5. リージョンを選択（日本の場合は`Northeast Asia (Tokyo)`推奨）
6. 「Create new project」をクリック

プロジェクトの作成には数分かかります。

## ステップ4: 環境変数の設定

1. Supabaseプロジェクトダッシュボードで「Settings」→「API」を開く
2. 以下の情報をコピー：
   - `Project URL`
   - `anon public` key

3. プロジェクトルートに`.env.local`ファイルを作成：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ステップ5: データベーステーブルの作成

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase/migrations/001_initial_schema.sql`の内容をコピー
3. SQL Editorにペーストして「Run」をクリック

実行後、以下のテーブルが作成されます：
- `mares`（牝馬マスタ）
- `cover_records`（交配記録）

サンプルデータも自動的に挿入されます。

## ステップ6: 管理者アカウントの作成

1. Supabaseダッシュボードで「Authentication」→「Users」を開く
2. 「Add user」→「Create new user」をクリック
3. 管理者用のメールアドレスとパスワードを入力：
   - Email: `admin@example.com`（任意のメールアドレス）
   - Password: 安全なパスワード（8文字以上推奨）
4. 「Auto Confirm User」にチェックを入れる
5. 「Create user」をクリック

## ステップ7: 開発サーバーの起動

```bash
pnpm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## ステップ8: 動作確認

### 一般ユーザー機能の確認

1. トップページ（`http://localhost:3000`）にアクセス
2. 「交配牝馬一覧を見る」ボタンをクリック
3. 2025年の交配牝馬一覧が表示されることを確認
4. 年タブ（2023/2024/2025）で切り替えができることを確認
5. フィルタ・ソート機能を試す

### 管理者機能の確認

1. 右上の「管理」ボタンをクリック
2. ステップ6で作成したメールアドレスとパスワードでログイン
3. CSVアップロードページが表示されることを確認
4. 「管理用一覧」タブをクリックして登録済牝馬が表示されることを確認

## ステップ9: CSVアップロードのテスト

1. サンプルCSVファイルを作成（`test_mares.csv`）：

```csv
season_year,netkeiba_id,mare_name,mare_birth_year,mare_sire_name,cover_date,expected_foaling_date,total_prize,best_win_class,offsprings_started,representative_offspring_name,representative_offspring_url,mare_netkeiba_url
2025,000d04g8d2,テスト牝馬,2020,オルフェーヴル,2025-03-20,2026-02-20,3000,1勝クラス,0,,,https://db.netkeiba.com/horse/000d04g8d2
```

2. 管理画面の「CSVアップロード」でファイルを選択
3. 「アップロード」ボタンをクリック
4. 成功メッセージが表示されることを確認
5. 「管理用一覧」で新しい牝馬が追加されていることを確認

## トラブルシューティング

### エラー: "Invalid API key"

- `.env.local`ファイルの環境変数が正しく設定されているか確認
- Supabaseの`anon public` keyをコピーし直す
- 開発サーバーを再起動（`Ctrl+C`で停止後、`pnpm run dev`で再起動）

### エラー: "Failed to fetch"

- Supabaseプロジェクトが正常に起動しているか確認
- ネットワーク接続を確認
- Supabaseダッシュボードで「Project Settings」→「API」→「Project URL」が正しいか確認

### ログインできない

- 管理者アカウントが正しく作成されているか確認
- Supabaseダッシュボードで「Authentication」→「Users」を開いて確認
- 「Auto Confirm User」にチェックが入っているか確認
- メールアドレスとパスワードを再確認

### データが表示されない

- SQL Editorで`001_initial_schema.sql`が正常に実行されたか確認
- Supabaseダッシュボードで「Table Editor」を開いて`mares`と`cover_records`テーブルが存在するか確認
- サンプルデータが挿入されているか確認（`SELECT * FROM mares;`を実行）

## 次のステップ

セットアップが完了したら：

1. **Pythonスクレイピングツール**を使用してnetkeibaからデータを取得
2. 取得したCSVを管理画面からアップロード
3. 実際の交配牝馬データを閲覧

## Vercelへのデプロイ

本番環境へのデプロイ手順は`README.md`の「デプロイ」セクションを参照してください。

## サポート

問題が解決しない場合は、以下を確認してください：

- [Supabaseドキュメント](https://supabase.com/docs)
- [Next.jsドキュメント](https://nextjs.org/docs)
- GitHubのIssuesで質問

---

セットアップが完了したら、ドウデュースの交配牝馬情報を楽しんでください！