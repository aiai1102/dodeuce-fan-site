# ドウデュース応援サイト デプロイ手順書

## 📋 目次
1. [事前準備](#事前準備)
2. [GitHub リポジトリ作成とプッシュ](#1-github-リポジトリ作成とプッシュ)
3. [Vercel での初回デプロイ](#2-vercel-での初回デプロイ)
4. [Supabase 環境変数の設定](#3-supabase-環境変数の設定)
5. [GitHub + Vercel 自動デプロイの確認](#4-github--vercel-自動デプロイの確認)
6. [独自ドメインの設定](#5-独自ドメインの設定)
7. [最終チェック](#6-最終チェック)
8. [トラブルシューティング](#トラブルシューティング)

---

## 事前準備

### 必要なもの
- ✅ GitHubアカウント
- ✅ Vercelアカウント（未作成でもOK、手順内で作成）
- ✅ Google Domainsで取得済みのドメイン: `do-deuce-fan.com`
- ✅ Supabaseプロジェクトの情報（URL と ANON KEY）
- ✅ ローカルに動作確認済みのプロジェクト（`/workspace/shadcn-ui/`）

### 重要な注意事項
⚠️ **この手順書では既存のソースコードを一切変更しません**
- コード編集は行いません
- デザイン改修は行いません
- 依存関係の追加は行いません
- 目的は「既存サイトをそのまま公開」することです

---

## 1. GitHub リポジトリ作成とプッシュ

### 1-1. GitHubで新規リポジトリを作成（画面操作）

1. **GitHubにログイン**
   - ブラウザで https://github.com を開く
   - ログインしていない場合はログインする

2. **新規リポジトリ作成**
   - 右上の「+」ボタンをクリック
   - 「New repository」を選択

3. **リポジトリ設定**
   - **Repository name**: `dodeuce-fan-site`（任意の名前でOK）
   - **Description**: `ドウデュース応援サイト - 交配牝馬一覧`（任意）
   - **Public / Private**: お好みで選択（Publicを推奨）
   - ⚠️ **重要**: 以下のチェックボックスは**すべて外す**
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   - 「Create repository」ボタンをクリック

4. **リポジトリURLをメモ**
   - 作成後に表示されるURLをメモする
   - 例: `https://github.com/あなたのユーザー名/dodeuce-fan-site.git`

### 1-2. .gitignoreファイルの確認（コマンド操作）

プロジェクトディレクトリに移動し、.gitignoreが正しく設定されているか確認します。

```bash
cd /workspace/shadcn-ui
cat .gitignore
```

**確認ポイント**: 以下が含まれていることを確認
```
node_modules
dist
.env
.env.local
.DS_Store
```

もし`.gitignore`が存在しない、または不完全な場合は、以下のコマンドで作成/上書きします：

```bash
cat > .gitignore << 'EOF'
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.production
EOF
```

### 1-3. Gitリポジトリの初期化とプッシュ（コマンド操作）

```bash
# 1. Gitリポジトリを初期化
cd /workspace/shadcn-ui
git init

# 2. すべてのファイルをステージング
git add .

# 3. 初回コミット
git commit -m "Initial commit: Dodeuce fan site"

# 4. デフォルトブランチをmainに設定
git branch -M main

# 5. リモートリポジトリを追加（URLは先ほどメモしたものに置き換える）
git remote add origin https://github.com/あなたのユーザー名/dodeuce-fan-site.git

# 6. GitHubにプッシュ
git push -u origin main
```

**実行時の注意**:
- GitHubのユーザー名とパスワード（またはPersonal Access Token）の入力を求められる場合があります
- 2段階認証を有効にしている場合は、Personal Access Tokenが必要です
  - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
  - `repo` スコープにチェックを入れて生成

**成功の確認**:
- GitHubのリポジトリページをブラウザで開く
- ファイル一覧が表示されていればOK

---

## 2. Vercel での初回デプロイ

### 2-1. Vercelアカウント作成/ログイン（画面操作）

1. **Vercelサイトにアクセス**
   - ブラウザで https://vercel.com を開く

2. **サインアップ/ログイン**
   - 「Sign Up」または「Login」をクリック
   - 「Continue with GitHub」を選択（GitHub連携を推奨）
   - GitHubアカウントでログイン
   - Vercelへのアクセス許可を承認

### 2-2. プロジェクトのインポート（画面操作）

1. **新規プロジェクト作成**
   - Vercelダッシュボードで「Add New...」ボタンをクリック
   - 「Project」を選択

2. **リポジトリの選択**
   - 「Import Git Repository」セクションで、先ほど作成した `dodeuce-fan-site` を探す
   - 見つからない場合は「Adjust GitHub App Permissions」をクリックしてリポジトリへのアクセスを許可
   - 「Import」ボタンをクリック

3. **プロジェクト設定の確認**

   **Configure Project** 画面で以下を確認・設定：

   - **Project Name**: `dodeuce-fan-site`（自動入力されるが変更可能）
   - **Framework Preset**: `Vite` を選択
     - ドロップダウンから「Vite」を探して選択
     - 自動検出されない場合は手動で選択
   
   - **Root Directory**: `.` (デフォルトのまま、変更不要)
   
   - **Build and Output Settings**:
     - **Build Command**: `pnpm run build`
       - ⚠️ デフォルトは `npm run build` になっている場合があるので、`pnpm run build` に変更
     - **Output Directory**: `dist`
       - ⚠️ 通常は自動で `dist` が設定されるが、確認すること
     - **Install Command**: `pnpm install`
       - ⚠️ デフォルトは `npm install` になっている場合があるので、`pnpm install` に変更

   - **Environment Variables**: 
     - ⚠️ **この段階では設定しない**（次のステップで設定します）
     - 「Add」ボタンは押さずに進む

4. **デプロイ開始**
   - 「Deploy」ボタンをクリック
   - ビルドログが表示され、デプロイが開始される

5. **初回デプロイの結果**
   - ⚠️ **環境変数未設定のため、Supabase接続が動作しません**
   - これは正常です。次のステップで環境変数を設定します
   - デプロイ完了後、`https://あなたのプロジェクト名.vercel.app` のようなURLが発行される
   - このURLをメモしておく

**やらなくていいこと**:
- ❌ この段階でサイトが完全に動作しなくても問題ありません
- ❌ エラーが出ていても次のステップに進んでください
- ❌ コードを修正する必要はありません

---

## 3. Supabase 環境変数の設定

### 3-1. Supabase情報の準備

デプロイ前に、以下の情報を手元に用意してください：

- **VITE_SUPABASE_URL**: `https://abfyrhetmcnpaxapwuiv.supabase.co`
- **VITE_SUPABASE_ANON_KEY**: `eyJhbGci...`（長い文字列）

これらは `/workspace/shadcn-ui/.env.local` ファイルに記載されています。

### 3-2. Vercelで環境変数を設定（画面操作）

1. **プロジェクト設定を開く**
   - Vercelダッシュボードで、デプロイしたプロジェクト（`dodeuce-fan-site`）をクリック
   - 上部メニューの「Settings」タブをクリック

2. **Environment Variables に移動**
   - 左サイドバーの「Environment Variables」をクリック

3. **環境変数を追加**

   **1つ目: VITE_SUPABASE_URL**
   - 「Add New」セクションで入力：
     - **Key**: `VITE_SUPABASE_URL`
     - **Value**: `https://abfyrhetmcnpaxapwuiv.supabase.co`
     - **Environment**: 
       - ✅ Production
       - ✅ Preview
       - ✅ Development
       - （すべてにチェックを入れる）
   - 「Save」ボタンをクリック

   **2つ目: VITE_SUPABASE_ANON_KEY**
   - 再度「Add New」で入力：
     - **Key**: `VITE_SUPABASE_ANON_KEY`
     - **Value**: `eyJhbGci...`（あなたのANON KEYをペースト）
     - **Environment**: 
       - ✅ Production
       - ✅ Preview
       - ✅ Development
       - （すべてにチェックを入れる）
   - 「Save」ボタンをクリック

4. **設定完了の確認**
   - 2つの環境変数が一覧に表示されていることを確認

### 3-3. 再デプロイの実行（画面操作）

環境変数を設定しただけでは反映されないため、再デプロイが必要です。

1. **Deploymentsタブに移動**
   - 上部メニューの「Deployments」タブをクリック

2. **最新デプロイメントを選択**
   - 一番上（最新）のデプロイメントをクリック

3. **再デプロイを実行**
   - 右上の「⋯」（3点メニュー）をクリック
   - 「Redeploy」を選択
   - 確認ダイアログで「Redeploy」ボタンをクリック

4. **デプロイ完了を待つ**
   - ビルドログを確認
   - 「Ready」と表示されれば成功

5. **サイトの動作確認**
   - デプロイ完了後、`https://あなたのプロジェクト名.vercel.app` にアクセス
   - トップページが表示されることを確認
   - 「交配牝馬一覧を見る（2025年）」ボタンをクリック
   - 年度切り替え（2023/2024/2025）が動作することを確認

**成功の確認ポイント**:
- ✅ サイトが正常に表示される
- ✅ Supabaseへの接続エラーが出ない
- ✅ 年度切り替えボタンが動作する

---

## 4. GitHub + Vercel 自動デプロイの確認

### 4-1. 自動デプロイの仕組み

Vercelは、GitHubリポジトリの `main` ブランチに変更がプッシュされると、自動的にビルド＆デプロイを実行します。

**確認すること**:
- ✅ `main` ブランチへのプッシュで自動デプロイ
- ✅ プルリクエストごとにプレビューデプロイが作成される

### 4-2. 自動デプロイのテスト（コマンド操作 + 画面操作）

実際に変更をプッシュして、自動デプロイを確認します。

**テスト用の小さな変更を加える**:

```bash
cd /workspace/shadcn-ui

# READMEファイルに1行追加（テスト用）
echo "" >> README.md
echo "<!-- Deployment test -->" >> README.md

# 変更をコミット＆プッシュ
git add README.md
git commit -m "Test: Verify auto-deployment"
git push origin main
```

**Vercelで確認**:

1. **Deploymentsタブを開く**
   - Vercelダッシュボードの「Deployments」タブをクリック

2. **新しいデプロイメントを確認**
   - 数秒〜数十秒後、新しいデプロイメントが自動的に開始される
   - ステータスが「Building」→「Ready」に変わるのを確認

3. **デプロイログを確認**
   - デプロイメントをクリックしてログを表示
   - エラーがないことを確認

**成功の確認ポイント**:
- ✅ プッシュ後、自動的にデプロイが開始される
- ✅ ビルドが成功し、「Ready」になる
- ✅ サイトが正常に表示される

### 4-3. デプロイログの見方

**ログの確認方法**:
1. Vercelダッシュボード → Deployments
2. 任意のデプロイメントをクリック
3. 「Building」セクションでビルドログを確認

**主要なログセクション**:
- **Installing dependencies**: 依存関係のインストール
- **Building**: ビルド実行（`pnpm run build`）
- **Deploying**: デプロイ実行

**失敗時のチェックポイント**:
- ❌ `pnpm: command not found` → Install Commandが間違っている
- ❌ `Build failed` → package.jsonのscriptsを確認
- ❌ `Environment variable not found` → 環境変数の設定を確認

---

## 5. 独自ドメインの設定

### 5-1. Vercelでドメインを追加（画面操作）

1. **プロジェクト設定を開く**
   - Vercelダッシュボードで `dodeuce-fan-site` プロジェクトをクリック
   - 上部メニューの「Settings」タブをクリック

2. **Domainsセクションに移動**
   - 左サイドバーの「Domains」をクリック

3. **ドメインを追加**
   - 「Add」ボタンをクリック
   - 入力欄に `do-deuce-fan.com` を入力
   - 「Add」ボタンをクリック

4. **DNS設定情報を確認**
   - Vercelが以下のような情報を表示します：
     ```
     A Record
     Name: @
     Value: 76.76.21.21
     
     CNAME Record
     Name: www
     Value: cname.vercel-dns.com
     ```
   - ⚠️ この情報をメモまたはスクリーンショットを取る
   - ⚠️ 実際の値はVercelが表示するものを使用すること

### 5-2. Google DomainsでDNS設定（画面操作）

1. **Google Domainsにログイン**
   - ブラウザで https://domains.google.com を開く
   - ログインする

2. **ドメインを選択**
   - 「マイドメイン」から `do-deuce-fan.com` をクリック

3. **DNS設定を開く**
   - 左サイドバーの「DNS」をクリック

4. **カスタムレコードを追加**

   **Aレコードの追加（ルートドメイン用）**:
   - 「カスタムレコードを管理」セクションで「新しいレコードを作成」をクリック
   - 設定：
     - **ホスト名**: `@`（または空欄）
     - **タイプ**: `A`
     - **TTL**: `3600`（デフォルト）
     - **データ**: `76.76.21.21`（Vercelが指定した値）
   - 「保存」をクリック

   **CNAMEレコードの追加（wwwサブドメイン用）**:
   - 再度「新しいレコードを作成」をクリック
   - 設定：
     - **ホスト名**: `www`
     - **タイプ**: `CNAME`
     - **TTL**: `3600`（デフォルト）
     - **データ**: `cname.vercel-dns.com`（Vercelが指定した値）
   - 「保存」をクリック

5. **既存のレコードを確認**
   - 既に `@` や `www` のレコードが存在する場合は削除または置き換える
   - Google Domainsのデフォルト設定（Google Sitesなど）がある場合は削除

### 5-3. DNS反映の確認

**反映までの時間**:
- 通常: 5分〜1時間
- 最大: 48時間（稀）

**確認方法**:

1. **Vercelで確認**
   - Vercel → Settings → Domains
   - `do-deuce-fan.com` のステータスが「Valid Configuration」になるのを待つ

2. **ブラウザで確認**
   - `https://do-deuce-fan.com` にアクセス
   - サイトが表示されればOK

3. **コマンドで確認**（オプション）
   ```bash
   # Aレコードの確認
   nslookup do-deuce-fan.com
   
   # CNAMEレコードの確認
   nslookup www.do-deuce-fan.com
   ```

**HTTPS（SSL）について**:
- ✅ VercelがLet's Encryptを使用して自動的にSSL証明書を発行
- ✅ DNS反映後、数分でHTTPSが有効になる
- ✅ 手動での設定は不要

**トラブルシューティング**:
- ❌ 「DNS_PROBE_FINISHED_NXDOMAIN」エラー → DNS設定を再確認
- ❌ 「This site can't be reached」→ DNS反映を待つ
- ❌ 「Your connection is not private」→ SSL証明書の発行を待つ（最大24時間）

---

## 6. 最終チェック

### 6-1. デプロイ完了の確認

以下のすべてが完了していることを確認してください：

- ✅ **GitHubリポジトリ**: コードがプッシュされている
- ✅ **Vercelデプロイ**: 最新のデプロイが「Ready」状態
- ✅ **環境変数**: VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY が設定されている
- ✅ **独自ドメイン**: `do-deuce-fan.com` が設定されている
- ✅ **DNS設定**: Aレコードと CNAMEレコードが正しく設定されている
- ✅ **HTTPS**: SSL証明書が有効になっている

### 6-2. サイトの動作確認

**1. 独自ドメインでアクセス**
```
https://do-deuce-fan.com
```

**2. 確認項目**:
- ✅ トップページが表示される
- ✅ 「交配牝馬一覧を見る（2025年）」ボタンが動作する
- ✅ 年度切り替えボタン（2023/2024/2025）が動作する
- ✅ Supabaseからのデータ取得が正常に動作する
- ✅ 管理画面（/admin/login）にアクセスできる
- ✅ HTTPSで接続されている（鍵マークが表示される）

**3. wwwサブドメインの確認**（オプション）
```
https://www.do-deuce-fan.com
```
- ✅ `do-deuce-fan.com` にリダイレクトされる、または同じ内容が表示される

### 6-3. 自動デプロイの最終確認

**テスト**:
1. ローカルで小さな変更を加える（例: READMEに1行追加）
2. GitHubにプッシュ
3. Vercelで自動デプロイが開始されることを確認
4. デプロイ完了後、`https://do-deuce-fan.com` で変更が反映されていることを確認

**成功の確認**:
- ✅ プッシュ後、数秒〜数十秒で自動デプロイが開始される
- ✅ ビルドが成功する
- ✅ サイトに変更が反映される

---

## トラブルシューティング

### ビルドエラー

**症状**: Vercelでビルドが失敗する

**原因と対処法**:

1. **`pnpm: command not found`**
   - **原因**: Install Commandが間違っている
   - **対処**: Vercel → Settings → General → Build & Development Settings
     - Install Command を `pnpm install` に変更
     - 「Save」をクリック
     - 再デプロイ

2. **`Build failed: npm ERR!`**
   - **原因**: Build Commandが間違っている
   - **対処**: Vercel → Settings → General → Build & Development Settings
     - Build Command を `pnpm run build` に変更
     - 「Save」をクリック
     - 再デプロイ

3. **`Module not found`**
   - **原因**: 依存関係が不足している
   - **対処**: ローカルで確認
     ```bash
     cd /workspace/shadcn-ui
     pnpm install
     pnpm run build
     ```
   - ローカルでビルドが成功することを確認してから再プッシュ

### 環境変数エラー

**症状**: サイトは表示されるが、Supabaseへの接続が失敗する

**原因と対処法**:

1. **環境変数が設定されていない**
   - **対処**: Vercel → Settings → Environment Variables
     - `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` が設定されているか確認
     - 設定されていない場合は追加
     - 再デプロイ

2. **環境変数の値が間違っている**
   - **対処**: 
     - ローカルの `.env.local` ファイルと比較
     - 値が正確にコピーされているか確認（スペースや改行に注意）
     - 修正後、再デプロイ

3. **環境変数の適用範囲が間違っている**
   - **対処**: 
     - Production, Preview, Development すべてにチェックが入っているか確認
     - チェックを入れて「Save」
     - 再デプロイ

### DNSエラー

**症状**: 独自ドメインでアクセスできない

**原因と対処法**:

1. **DNS反映待ち**
   - **対処**: 最大48時間待つ（通常は1時間以内）
   - コマンドで確認: `nslookup do-deuce-fan.com`

2. **DNSレコードの設定ミス**
   - **対処**: Google Domainsで再確認
     - Aレコード: `@` → `76.76.21.21`（Vercelが指定した値）
     - CNAMEレコード: `www` → `cname.vercel-dns.com`（Vercelが指定した値）
   - 修正後、反映を待つ

3. **既存のレコードとの競合**
   - **対処**: Google Domainsで既存のレコードを削除
     - 特にGoogle Sitesなどのデフォルト設定
     - 削除後、正しいレコードを追加

### SSL証明書エラー

**症状**: 「Your connection is not private」エラーが表示される

**原因と対処法**:

1. **SSL証明書の発行待ち**
   - **対処**: DNS反映後、最大24時間待つ（通常は数分〜1時間）
   - Vercel → Settings → Domains でステータスを確認

2. **DNSが正しく反映されていない**
   - **対処**: DNSレコードを再確認
   - `nslookup do-deuce-fan.com` で正しいIPアドレスが返ってくるか確認

### 自動デプロイが動作しない

**症状**: GitHubにプッシュしてもVercelでデプロイが開始されない

**原因と対処法**:

1. **GitHub連携が切れている**
   - **対処**: Vercel → Settings → Git
     - 「Connected Git Repository」を確認
     - 再接続が必要な場合は「Disconnect」→「Connect」

2. **ブランチが間違っている**
   - **対処**: Vercel → Settings → Git
     - Production Branch が `main` になっているか確認
     - 違う場合は変更して「Save」

3. **Webhookが無効**
   - **対処**: GitHub → リポジトリ → Settings → Webhooks
     - Vercelのwebhookが存在し、有効になっているか確認
     - 無効な場合は削除して、Vercelで再接続

---

## 付録: よくある質問

### Q1: コードを変更したい場合はどうすればいい？

**A**: 以下の手順で変更できます：

1. ローカルでコードを編集
2. ローカルで動作確認（`pnpm run dev`）
3. Gitにコミット＆プッシュ
   ```bash
   git add .
   git commit -m "説明"
   git push origin main
   ```
4. Vercelで自動デプロイが実行される
5. `https://do-deuce-fan.com` で変更を確認

### Q2: 環境変数を変更したい場合は？

**A**: 以下の手順で変更できます：

1. Vercel → Settings → Environment Variables
2. 変更したい変数の「⋯」メニューから「Edit」を選択
3. 新しい値を入力して「Save」
4. Deployments → 最新のデプロイ → 「⋯」→ 「Redeploy」

### Q3: ドメインを変更したい場合は？

**A**: 以下の手順で変更できます：

1. Vercel → Settings → Domains
2. 古いドメインの「⋯」メニューから「Remove」を選択
3. 新しいドメインを追加（「Add」ボタン）
4. Google Domainsで新しいドメインのDNS設定を行う

### Q4: デプロイ履歴を確認したい

**A**: Vercel → Deployments タブで確認できます

- 各デプロイのステータス、時刻、コミットメッセージが表示される
- クリックすると詳細ログを確認できる
- 過去のバージョンにロールバックも可能

### Q5: プレビューデプロイとは？

**A**: プルリクエストごとに作成される一時的なデプロイです

- `main` ブランチ以外の変更をプレビューできる
- 本番環境に影響を与えずにテストできる
- プルリクエストをマージすると自動的に削除される

---

## まとめ

この手順書に従うことで、以下が実現できました：

✅ **GitHubリポジトリ作成**: ソースコードをGitHub上で管理
✅ **Vercelデプロイ**: 自動ビルド＆デプロイ環境の構築
✅ **環境変数設定**: Supabase接続情報の安全な管理
✅ **自動デプロイ**: `git push` だけで本番環境に反映
✅ **独自ドメイン**: `https://do-deuce-fan.com` でのアクセス
✅ **HTTPS対応**: SSL証明書の自動発行

**今後の運用**:
1. コードを変更したい場合は、ローカルで編集 → `git push`
2. 自動的にVercelでビルド＆デプロイが実行される
3. 数分後に `https://do-deuce-fan.com` で変更が反映される

**サポート**:
- Vercelドキュメント: https://vercel.com/docs
- Supabaseドキュメント: https://supabase.com/docs
- GitHubドキュメント: https://docs.github.com

---

**🎉 デプロイ完了おめでとうございます！**

ドウデュース応援サイトが `https://do-deuce-fan.com` で公開されました。