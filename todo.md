# ドウデュース応援サイト Phase1 - 開発計画

## プロジェクト概要
種牡馬ドウデュースの交配牝馬一覧を表示するWeb応援サイト。
Supabaseをバックエンドとして使用し、管理者がCSVアップロードでデータを管理できる。

## 技術スタック
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Shadcn-ui
- Supabase (PostgreSQL + Auth)
- Vercel (デプロイ)

## デザインガイドライン

### カラーパレット
- Primary: #1E40AF (競馬ブルー - メインアクション)
- Secondary: #7C3AED (ロイヤルパープル - アクセント)
- Background: #F9FAFB (ライトグレー)
- Text Primary: #111827 (ダークグレー)
- Text Secondary: #6B7280 (ミディアムグレー)
- Success: #10B981 (グリーン)
- Error: #EF4444 (レッド)

### タイポグラフィ
- Heading1: font-bold text-4xl (36px)
- Heading2: font-bold text-3xl (30px)
- Heading3: font-semibold text-2xl (24px)
- Body: font-normal text-base (16px)
- Small: font-normal text-sm (14px)

### レイアウト
- 最大幅: max-w-7xl (1280px)
- パディング: p-4 (モバイル) / p-6 (タブレット) / p-8 (デスクトップ)
- カード: rounded-lg shadow-md
- ブレークポイント: md:768px (PC/スマホ切り替え)

## 開発タスク

### 1. プロジェクト初期設定 ✅
- [x] shadcn-ui テンプレート取得
- [x] 依存関係インストール
- [x] 開発サーバー起動確認

### 2. Supabase設定
- [ ] 環境変数設定 (.env.local)
- [ ] Supabaseクライアント設定
- [ ] データベーステーブル作成 (mares, cover_records)
- [ ] Row Level Security (RLS) ポリシー設定

### 3. 型定義・ユーティリティ
- [ ] TypeScript型定義 (lib/types.ts)
- [ ] Supabaseサービス層 (lib/supabase/)
- [ ] CSVプロセッサー (lib/csv/processor.ts)
- [ ] 日付フォーマット関数

### 4. 共通コンポーネント
- [ ] Header (ヘッダー・ナビゲーション)
- [ ] Footer (フッター)
- [ ] Layout (共通レイアウト)
- [ ] Loading (ローディング表示)

### 5. トップページ (/)
- [ ] HeroSection (ドウデュース紹介)
- [ ] CTAButton (交配牝馬一覧へのリンク)
- [ ] FutureFeatures (将来機能の告知)

### 6. 交配牝馬一覧ページ (/mares/[year])
- [ ] YearTabs (年選択タブ: 2023/2024/2025)
- [ ] FilterBar (フィルタ・ソート UI)
- [ ] MaresTable (PC版テーブル表示)
- [ ] MaresCards (スマホ版カード表示)
- [ ] データ取得ロジック (getMaresByYear)

### 7. 管理者ログイン (/admin/login)
- [ ] LoginForm (メール・パスワード入力)
- [ ] Supabase Auth統合
- [ ] エラーハンドリング

### 8. CSVアップロード (/admin/import)
- [ ] CSVUploader (ファイル選択・アップロード)
- [ ] プログレスバー表示
- [ ] バリデーション処理
- [ ] UPSERT処理 (mares + cover_records)
- [ ] エラーレポート表示

### 9. 管理用一覧 (/admin/mares)
- [ ] SearchBar (牝馬名検索)
- [ ] AdminMaresTable (全牝馬一覧)
- [ ] 編集・削除機能 (オプション)

### 10. 認証ミドルウェア
- [ ] middleware.ts (管理画面アクセス制御)
- [ ] セッション確認ロジック

### 11. テスト・デバッグ
- [ ] 各ページの動作確認
- [ ] レスポンシブ対応確認
- [ ] CSVアップロード動作確認
- [ ] エラーハンドリング確認

### 12. ドキュメント更新
- [ ] README.md更新
- [ ] 設計書更新 (実装内容反映)
- [ ] テーブル定義書更新

## ファイル構成

```
/workspace/shadcn-ui/
├── app/
│   ├── layout.tsx (ルートレイアウト)
│   ├── page.tsx (トップページ)
│   ├── mares/
│   │   └── [year]/
│   │       └── page.tsx (交配牝馬一覧)
│   └── admin/
│       ├── login/
│       │   └── page.tsx (管理者ログイン)
│       ├── import/
│       │   └── page.tsx (CSVアップロード)
│       └── mares/
│           └── page.tsx (管理用一覧)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── mares/
│   │   ├── YearTabs.tsx
│   │   ├── FilterBar.tsx
│   │   ├── MaresTable.tsx
│   │   └── MaresCards.tsx
│   └── admin/
│       ├── LoginForm.tsx
│       ├── CSVUploader.tsx
│       └── AdminMaresTable.tsx
├── lib/
│   ├── types.ts (型定義)
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── queries.ts
│   └── csv/
│       └── processor.ts
├── middleware.ts (認証ミドルウェア)
└── .env.local (環境変数)
```

## 注意事項
- スモールスタートで動くことを最優先
- PC/スマホ両対応のレスポンシブデザイン
- CSVアップロード時の適切なエラーハンドリング
- Supabase RLSによるセキュリティ確保
- プログラム変更時は設計書・テーブル定義書も更新