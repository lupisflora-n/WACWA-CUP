# Driveデータ調査

調査日: 2026-06-25

## ルートフォルダ

- フォルダ名: 書類関係
- アクセス状態: CodexのGoogle Driveコネクタから一覧取得できた
- 備考: 実際のDrive IDやURLは、公開リポジトリに載せない。必要な値は環境変数や安全な運用メモで管理する。

## メインデータ

### 工事完了報告書データ

- 種類: Google Sheets
- タイトル: 工事完了報告書データ
- ロケール: `ja_JP`
- タイムゾーン: `Asia/Tokyo`

確認できたシート:

| シート名 | 推定用途 |
| --- | --- |
| `completion_reports` | 完了報告書、丸産報告、PDF生成状態 |
| `daily_billing_records` | 日報、作業金、残業、駐車場、高速、溶剤・立替 |
| `monthly_summaries` | 月次請求まとめ |
| `solvent_master` | 溶剤マスタ、単価 |
| `月次作業金一覧表` | 月次一覧の出力用または旧集計 |
| `請求書` | 請求書の出力用または旧集計 |
| `settings` | 作業者名などの設定 |
| `menu_items` | AppSheetメニュー項目らしき設定 |

## 主なテーブル構造

### `completion_reports`

主な列:

- `id`
- `docType`
- `status`
- `displayDate`
- `requestedPdfName`
- `pdfName`
- `pdfUrl`
- `pdfFileId`
- `updatedAt`
- `workerName`
- `toCompany`
- `toOffice`
- `toPerson`
- `workDate`
- `siteName`
- `orderNo`
- `address`
- `work2` から `work10`
- `diary1`
- `parkingFee`
- `tollType`
- `tollOneWay`
- `tollGo`
- `tollReturn`
- `materialFee`
- `parkingReceiptImage`
- `constructionTotal`
- `tax`
- `supporters`
- `completionStatus`
- `attemptCount`
- `bundleId`
- `bundleRole`

推定:

- 完了報告書の入力本体。
- 複数の報告書をまとめて1つのPDFにするため、`bundleId` や `bundleRole` がある。
- `status` はPDF作成状態を表す。
- `parkingReceiptImage` はDrive上の画像と紐づく。

### `daily_billing_records`

主な列:

- `id`
- `work_date`
- `item_type`
- `report_id`
- `work_fee`
- `overtime_fee`
- `parking_fee`
- `toll_fee`
- `description`
- `solvent_id`
- `amount`
- `subtotal`
- `billing_month_id`

推定:

- 日々の作業金や経費を記録するテーブル。
- `item_type` で「作業日報」「溶剤・立替」などを分けている。
- `billing_month_id` で月次請求に紐づけている。

### `monthly_summaries`

主な列:

- `id`
- `target_month`
- `customer_name`
- `total_work_fee`
- `total_overtime_fee`
- `total_parking_fee`
- `total_toll_fee`
- `total_other_expenses`
- `total_minus`
- `grand_total`
- `memo`
- `invoice_pdf`
- `summary_pdf`
- `status`

推定:

- 月ごとの請求サマリー。
- 請求書PDF、月次一覧PDFの保存先もここに持つ想定。

### `solvent_master`

主な列:

- `id`
- `solvent_name`
- `unit_price`

推定:

- 溶剤名と単価のマスタ。
- 新アプリでは管理画面で編集できるようにしたい。

### `settings`

確認できた列:

- `workerName`

推定:

- アプリ全体の初期値や作業者情報を置く設定テーブル。

### `menu_items`

確認できた列:

- `id`
- `label`
- `icon`
- `target_view`
- `docType`

推定:

- AppSheetのトップメニュー用データ。

## 帳票テンプレート

### 工事完了報告書台紙

- 種類: Google Slides
- プレースホルダ例:
  - `{{toCompany}}`
  - `{{toOffice}}`
  - `{{toPerson}}`
  - `{{workDate}}`
  - `{{siteName}}`
  - `{{orderNo}}`
  - `{{address}}`
  - `{{diary1}}`
  - `{{parkingFee}}`
  - `{{tollFee}}`
  - `{{materialFee}}`
  - `{{workerName}}`

推定:

- アプリやスクリプトでプレースホルダを置換してPDFを作っている。

### 作業金一覧

- 種類: Google Docs
- AppSheetテンプレート記法 `<<Start: ...>>` が使われている。
- 月次作業金一覧の出力に使われている可能性が高い。

### TRC請求書テンプレ

- 種類: Google Docs
- AppSheetテンプレート記法が使われている。
- 請求書PDFの出力に使われている可能性が高い。

## 出力フォルダ

### 完了報告書

- PDFが日付と作業者名つきで保存されている。

### 画像フォルダ

- `completion_reports_Images`
- `シート1_Images`
- 駐車場領収書画像が保存されている。

## 注意点

- 実データには個人名、住所、電話番号、現場情報が含まれる。
- GitHubに実データをコミットしない。
- 新アプリでは、サンプルデータと本番データを必ず分ける。
