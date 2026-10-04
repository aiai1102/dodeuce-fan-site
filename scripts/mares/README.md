# netkeiba 交配牝馬一覧 CSV生成ツール

種牡馬ドウデュースの交配牝馬一覧を netkeiba からスクレイピングし、Phase1のCSVフォーマットに準拠したCSVファイルを生成するPythonツールです。

## 必要なライブラリ

以下のPythonライブラリが必要です：

```bash
pip install requests beautifulsoup4
```

または、requirements.txtを使用：

```bash
pip install -r requirements.txt
```

### requirements.txt

```
requests>=2.31.0
beautifulsoup4>=4.12.0
```

## 使い方

### 方法1: 種牡馬IDと年を指定

```bash
python netkeiba_mating_csv_generator.py --stallion-id 2019105283 --year 2025 --output mares_2025.csv
```

### 方法2: URLを直接指定

```bash
python netkeiba_mating_csv_generator.py --url "https://own.netkeiba.com/db/sire_broodmare.html?_q=db/sire_broodmare.html&id=2019105283&year=2025" --output mares_2025.csv
```

### オプション

- `--stallion-id`: 種牡馬ID（例: 2019105283）
- `--year`: 年（--stallion-id使用時は必須）
- `--url`: 交配牝馬一覧ページのURL
- `--output`, `-o`: 出力CSVファイルパス（必須）
- `--sleep`: リクエスト間のスリープ時間（秒、デフォルト: 4）

## 出力CSVフォーマット

生成されるCSVファイルは以下のヘッダーを持ちます：

```
season_year,netkeiba_id,mare_name,mare_birth_year,mare_sire_name,cover_date,expected_foaling_date,total_prize,best_win_class,offsprings_started,representative_offspring_name,representative_offspring_url,mare_netkeiba_url
```

### 各カラムの説明

| カラム名 | 説明 | 例 |
|---------|------|-----|
| season_year | 種付け年 | 2025 |
| netkeiba_id | 牝馬のnetkeiba ID | 2018104922 |
| mare_name | 牝馬名 | アールドヴィーヴル |
| mare_birth_year | 牝馬の生年 | 2018 |
| mare_sire_name | 牝馬の父名 | キングカメハメハ |
| cover_date | 種付け日 | 2025-03-12 |
| expected_foaling_date | 生産予定日（種付け日+11ヶ月） | 2026-02-12 |
| total_prize | 獲得賞金 | 8,197 |
| best_win_class | 勝鞍クラス | 22'立雲峡S(3勝クラス) |
| offsprings_started | 既出走産駒頭数 | 1 |
| representative_offspring_name | 代表産駒名 | ステラヴェローチェ |
| representative_offspring_url | 代表産駒URL | https://own.netkeiba.com/db/horse.html?id=... |
| mare_netkeiba_url | 牝馬URL | https://own.netkeiba.com/db/horse.html?id=2018104922 |

## サンプル出力

```csv
season_year,netkeiba_id,mare_name,mare_birth_year,mare_sire_name,cover_date,expected_foaling_date,total_prize,best_win_class,offsprings_started,representative_offspring_name,representative_offspring_url,mare_netkeiba_url
2025,2018104922,アールドヴィーヴル,2018,キングカメハメハ,2025-03-12,2026-02-12,8,197,22'立雲峡S(3勝クラス),0,,,https://own.netkeiba.com/db/horse.html?id=2018104922
2025,2016101779,アイリスフィール,2016,ハービンジャー,2025-04-16,2026-03-16,2,009,19'デイジー賞(500万下),3,ドゥラエテルノ,https://own.netkeiba.com/db/horse.html?id=2022102722,https://own.netkeiba.com/db/horse.html?id=2016101779
```

## 注意事項

### アクセス頻度について

本ツールは、netkeiba サーバーへの負荷を軽減するため、以下の配慮をしています：

- デフォルトで4秒のスリープを挟んでアクセス
- `--sleep` オプションでスリープ時間を調整可能（推奨: 3〜5秒）
- 過剰なアクセスは避けてください

### エラーハンドリング

以下のエラーに対応しています：

- **ネットワークエラー**: 接続失敗時はエラーメッセージを表示して終了
- **HTMLパース失敗**: ページ構造が変更された場合は警告を表示
- **データ欠損**: 一部データが取得できない場合は空文字または0で補完

### 使用上の注意

1. **利用規約の遵守**: netkeiba の利用規約を必ず確認し、遵守してください
2. **個人利用**: 本ツールは個人的な応援サイト構築を目的としています
3. **商用利用禁止**: データの商用利用は避けてください
4. **適切な頻度**: 短時間に大量のリクエストを送信しないでください

## トラブルシューティング

### エラー: "Could not find mare table"

- ページ構造が変更された可能性があります
- URLが正しいか確認してください
- netkeiba にログインが必要なページの場合、本ツールでは対応できません

### エラー: "Failed to fetch page"

- ネットワーク接続を確認してください
- netkeiba がメンテナンス中の可能性があります
- User-Agentがブロックされている可能性があります

### データが一部欠損している

- netkeiba のページにデータが存在しない場合、空文字または0で補完されます
- 出力CSVを確認し、必要に応じて手動で修正してください

## 開発情報

### 技術スタック

- Python 3.7+
- requests: HTTPリクエスト
- BeautifulSoup4: HTMLパース

### ファイル構成

```
.
├── netkeiba_mating_csv_generator.py  # メインスクリプト
├── README.md                          # 本ドキュメント
└── requirements.txt                   # 依存ライブラリ
```

## ライセンス

本ツールは個人的な応援サイト構築を目的としています。
netkeiba のデータ利用については、netkeiba の利用規約に従ってください。

## 更新履歴

- 2025-12-22: 初版リリース
  - 種牡馬IDまたはURLからの交配牝馬一覧取得
  - Phase1 CSVフォーマット対応
  - ページネーション対応
  - エラーハンドリング実装

## サポート

問題が発生した場合は、以下を確認してください：

1. Python 3.7以上がインストールされているか
2. 必要なライブラリがインストールされているか
3. ネットワーク接続が正常か
4. netkeiba のページ構造が変更されていないか

---

**注意**: 本ツールは教育目的で作成されています。netkeiba の利用規約を遵守し、適切に使用してください。