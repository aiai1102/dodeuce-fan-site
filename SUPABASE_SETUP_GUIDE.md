# Supabaseセットアップガイド（詳細版）

このガイドでは、ドウデュース応援サイトのSupabaseバックエンドを完全にセットアップする手順を説明します。

## 📋 目次

1. [Supabaseプロジェクトの作成](#1-supabaseプロジェクトの作成)
2. [環境変数の設定](#2-環境変数の設定)
3. [データベーステーブルの作成](#3-データベーステーブルの作成)
4. [管理者アカウントの作成](#4-管理者アカウントの作成)
5. [動作確認](#5-動作確認)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. Supabaseプロジェクトの作成

### ステップ 1.1: Supabaseにアクセス

1. ブラウザで [https://supabase.com/](https://supabase.com/) を開く
2. 右上の「Start your project」または「Sign In」をクリック
3. GitHubアカウントでログイン（推奨）またはメールアドレスで登録

### ステップ 1.2: 新規プロジェクトの作成

1. ダッシュボードで「New Project」ボタンをクリック
2. 以下の情報を入力：

   **Organization（組織）:**
   - 既存の組織を選択、または「New organization」で新規作成
   - Organization名: 任意（例: `my-projects`）

   **Project Settings（プロジェクト設定）:**
   - **Name（プロジェクト名）:** `doduece-support-site`（任意の名前でOK）
   - **Database Password（データベースパスワード）:** 
     - 自動生成されたパスワードを使用（推奨）
     - または独自の強力なパスワードを入力
     - ⚠️ **重要:** このパスワードは後で確認できないため、必ずメモしてください
   - **Region（リージョン）:** 
     - 日本からのアクセスの場合: `Northeast Asia (Tokyo)`
     - その他の地域: 最寄りのリージョンを選択
   - **Pricing Plan（料金プラン）:** 
     - 開発・テスト用: `Free`（無料プラン）
     - 本番環境: 必要に応じて有料プランを選択

3. 「Create new project」ボタンをクリック

### ステップ 1.3: プロジェクトの初期化を待つ

- プロジェクトの作成には **2〜3分** かかります
- 画面に「Setting up project...」と表示されます
- 完了すると自動的にプロジェクトダッシュボードに遷移します

---

## 2. 環境変数の設定

### ステップ 2.1: API認証情報の取得

1. Supabaseプロジェクトダッシュボードで、左メニューから「Settings」（⚙️アイコン）をクリック
2. 「API」セクションを選択
3. 以下の情報をコピー：

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **API Keys:**
   - `anon public` キー（公開用キー）をコピー
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### ステップ 2.2: .env.localファイルの作成

1. プロジェクトのルートディレクトリ（`/workspace/shadcn-ui/`）に移動
2. `.env.local`ファイルを作成
3. 以下の内容を貼り付け、`your_xxx`の部分を実際の値に置き換える：

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. ファイルを保存

⚠️ **セキュリティ注意:**
- `.env.local`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
- `anon public`キーは公開されても問題ありませんが、`service_role`キーは絶対に公開しないでください

---

## 3. データベーステーブルの作成

### ステップ 3.1: SQL Editorを開く

1. Supabaseダッシュボードで、左メニューから「SQL Editor」をクリック
2. 「New query」ボタンをクリック

### ステップ 3.2: マイグレーションSQLの実行

1. `/workspace/shadcn-ui/supabase/migrations/001_initial_schema.sql`ファイルを開く
2. **ファイルの全内容**をコピー
3. SQL Editorにペースト
4. 右下の「Run」ボタンをクリック

### ステップ 3.3: 実行結果の確認

実行が成功すると、以下のメッセージが表示されます：
```
Success. No rows returned
```

エラーが表示された場合は、[トラブルシューティング](#6-トラブルシューティング)を参照してください。

### ステップ 3.4: テーブルの確認

1. 左メニューから「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認：
   - `mares`（牝馬マスタ）
   - `cover_records`（交配記録）

3. 各テーブルをクリックして、サンプルデータが挿入されていることを確認：
   - `mares`: 3件のサンプル牝馬データ
   - `cover_records`: 3件のサンプル交配記録

---

## 4. 管理者アカウントの作成

### ステップ 4.1: Authentication設定を開く

1. Supabaseダッシュボードで、左メニューから「Authentication」をクリック
2. 「Users」タブを選択

### ステップ 4.2: 新規ユーザーの作成

1. 右上の「Add user」ボタンをクリック
2. ドロップダウンから「Create new user」を選択

### ステップ 4.3: ユーザー情報の入力

以下の情報を入力：

**Email:**
```
admin@example.com
```
（任意のメールアドレスでOK。実際に存在しなくても構いません）

**Password:**
```
your_secure_password_123
```
（8文字以上の安全なパスワードを設定してください）

**オプション設定:**
- ✅ **Auto Confirm User** にチェックを入れる
  （メール確認をスキップして即座にログイン可能にする）

### ステップ 4.4: ユーザーの作成

1. 「Create user」ボタンをクリック
2. ユーザー一覧に新しいユーザーが表示されることを確認

⚠️ **重要:** 
- このメールアドレスとパスワードは、サイトの管理画面にログインする際に使用します
- 必ずメモしておいてください

---

## 5. 動作確認

### ステップ 5.1: 開発サーバーの起動

ターミナルで以下のコマンドを実行：

```bash
cd /workspace/shadcn-ui
pnpm run dev
```

### ステップ 5.2: トップページの確認

1. ブラウザで `http://localhost:5173` を開く
2. トップページが正しく表示されることを確認

### ステップ 5.3: 交配牝馬一覧の確認

1. 「交配牝馬一覧を見る（2025年）」ボタンをクリック
2. サンプルデータが表示されることを確認：
   - アールドヴィーヴル
   - サンプル牝馬A
   - サンプル牝馬B

### ステップ 5.4: 管理画面のログイン確認

1. 右上の「管理」ボタンをクリック
2. ステップ4で作成したメールアドレスとパスワードを入力
3. 「ログイン」ボタンをクリック
4. CSVアップロード画面にリダイレクトされることを確認

### ステップ 5.5: 管理用一覧の確認

1. 「管理用一覧」タブをクリック
2. 登録済みの牝馬（3件）が表示されることを確認

---

## 6. トラブルシューティング

### 問題1: 「Supabase環境変数が設定されていません」エラー

**原因:** `.env.local`ファイルが正しく読み込まれていない

**解決方法:**
1. `.env.local`ファイルがプロジェクトルート（`/workspace/shadcn-ui/`）に存在するか確認
2. ファイル名が正確に`.env.local`であることを確認（`.env`ではない）
3. 環境変数名が`VITE_`プレフィックスで始まっているか確認
4. 開発サーバーを再起動：
   ```bash
   # Ctrl+C で停止
   pnpm run dev
   ```

### 問題2: SQL実行時に「permission denied」エラー

**原因:** RLSポリシーの設定エラー

**解決方法:**
1. SQL Editorで以下のコマンドを実行してRLSを一時的に無効化：
   ```sql
   ALTER TABLE mares DISABLE ROW LEVEL SECURITY;
   ALTER TABLE cover_records DISABLE ROW LEVEL SECURITY;
   ```
2. 再度マイグレーションSQLを実行
3. RLSを再度有効化：
   ```sql
   ALTER TABLE mares ENABLE ROW LEVEL SECURITY;
   ALTER TABLE cover_records ENABLE ROW LEVEL SECURITY;
   ```

### 問題3: ログインできない

**原因1:** メールアドレスまたはパスワードが間違っている

**解決方法:**
1. Supabase Dashboard > Authentication > Users でユーザーが存在するか確認
2. パスワードをリセット：
   - ユーザーの右側の「...」メニューをクリック
   - 「Reset password」を選択
   - 新しいパスワードを設定

**原因2:** ユーザーが確認されていない

**解決方法:**
1. Supabase Dashboard > Authentication > Users でユーザーを選択
2. 「Email Confirmed」が`true`になっているか確認
3. `false`の場合、ユーザーを削除して再作成（今度は「Auto Confirm User」にチェック）

### 問題4: データが表示されない

**原因:** サンプルデータが挿入されていない

**解決方法:**
1. SQL Editorで以下のクエリを実行してデータを確認：
   ```sql
   SELECT * FROM mares;
   SELECT * FROM cover_records;
   ```
2. データが0件の場合、マイグレーションSQLの最後の部分（INSERT文）のみを再実行

### 問題5: 「Failed to fetch」エラー

**原因:** Supabase URLまたはAPIキーが間違っている

**解決方法:**
1. Supabase Dashboard > Settings > API で正しい値を再確認
2. `.env.local`ファイルの値を更新
3. 開発サーバーを再起動

---

## 7. 次のステップ

セットアップが完了したら：

### 7.1 CSVアップロードのテスト

サンプルCSVファイルを作成してアップロードをテストします：

**test_mares.csv:**
```csv
season_year,netkeiba_id,mare_name,mare_birth_year,mare_sire_name,cover_date,expected_foaling_date,total_prize,best_win_class,offsprings_started,representative_offspring_name,representative_offspring_url,mare_netkeiba_url
2025,000d04g8d2,テスト牝馬,2020,オルフェーヴル,2025-03-20,2026-02-20,3000,1勝クラス,0,,,https://db.netkeiba.com/horse/000d04g8d2
```

1. 管理画面にログイン
2. CSVアップロードページでファイルを選択
3. アップロードボタンをクリック
4. 成功メッセージを確認

### 7.2 本番環境へのデプロイ

Vercelへのデプロイ手順：

1. GitHubリポジトリにコードをプッシュ
2. [Vercel](https://vercel.com/)にログイン
3. 「New Project」をクリック
4. GitHubリポジトリを選択
5. 環境変数を設定：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. 「Deploy」をクリック

---

## 📞 サポート

問題が解決しない場合：

1. [Supabaseドキュメント](https://supabase.com/docs)を参照
2. [Supabase Discord](https://discord.supabase.com/)でコミュニティに質問
3. GitHubのIssuesで報告

---

**セットアップ完了おめでとうございます！🎉**

これでドウデュース応援サイトが完全に動作するようになりました。