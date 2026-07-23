# オシゴトアプリ 移行表と運用手順

Status: Implementation gate draft
Date: 2026-07-23

## 1. 移行の基本方針

既存AppSheetを停止せず、読み取り確認、サンプル移行、限定利用、本番切替の順で進める。元データは変更せず、移行用コピーで検証する。

本番切替前に、旧アプリで作成済みのPDF、画像、入力データを参照できる状態を保つ。

## 2. 既存データ対応表

| 既存項目 | 新アプリでの扱い | 方針 |
| --- | --- | --- |
| id | reports.reportId | 既存IDを保持または旧ID対応表を保存 |
| docType | reports.documentType | 完了報告書/丸産報告書へ変換 |
| status | reports.status | 状態名を新状態へ対応付け |
| displayDate, workDate | reports dates | 日付型へ正規化 |
| workerName | users/reports | 作成者または作業者へ分離 |
| toCompany, toOffice, toPerson | reports.recipient | 宛先情報をまとめて管理 |
| siteName, orderNo, address | reports | 既存値を保持 |
| work2-work10 | report_items | 工事内容の新しい複数行欄へ変換 |
| diary1 | reports.notes | 備考・作業メモへ対応 |
| constructionTotal | reports.total | 数値として検証 |
| tax | reports.tax | 新計算値または旧手入力値を区別 |
| parkingReceiptImage | attachments.original | 元画像として保持 |
| pdfName, pdfUrl, pdfFileId | attachments/pdf_jobs | 旧PDFへの参照として保持 |
| supporters | report_items | 作業者欄へ対応付けを確認 |
| completionStatus | reports.completionStatus | 完了/未完へ対応 |
| ms_personInCharge | reports.personInCharge | 丸産担当者へ対応 |
| ms_date, ms_site | reports | 日付と現場へ変換 |
| ms_am_time, ms_pm_time | report_items | AM/PM欄へ変換 |
| ms_work2-ms_work4 | report_items | AM/PM 6欄への対応を確認 |
| ms_nameL1-ms_nameL3, ms_nameR1-ms_nameR3 | report_items | 6人の作業者欄へ変換 |

## 3. 移行前チェック

- Google Sheetsのコピーを作成する。
- Driveの画像フォルダとPDFフォルダの権限を確認する。
- 件数、ID重複、必須値の空欄を調べる。
- 旧PDFと元画像のリンク切れを調べる。
- 個人情報・業務データをサンプルから除外する。
- 移行結果を件数と代表サンプルPDFで照合する。

## 4. 移行手順

1. 旧データを読み取り専用コピーへ複製する。
2. 旧列と新列の変換ルールをバージョン付きで保存する。
3. サンプル10件以下で変換する。
4. 入力内容、画像、PDFリンク、計算値を照合する。
5. 不一致を修正し、変換を再実行する。
6. 承認後に全件移行する。
7. 移行後の件数とエラー件数を記録する。
8. 旧アプリを一定期間参照専用で残す。

## 5. リリース手順

### 開発版

- サンプルデータのみ接続する。
- 画面、PDF、領収書、権限テストを実行する。
- GitHubへ変更を保存する。

### 限定公開版

- 実利用者を少人数に限定する。
- 本番コピーまたは分離したデータを使用する。
- 旧アプリと結果を比較する。
- 問題がなければリリース候補として記録する。

### 本番版

- リリース番号、変更内容、復旧先を記録する。
- バックアップを確認する。
- 管理者が主要操作を確認する。
- 利用者へ変更点を短く案内する。

## 6. 障害対応

### PDFが作成できない

1. PDFジョブIDを確認する。
2. 失敗箇所が入力、画像、描画、Drive保存のどれかを確認する。
3. 入力データと元画像が残っていることを確認する。
4. 原因を直して同じジョブを再試行する。
5. 再試行できない場合は、ジョブIDとエラーを記録して管理者へ引き継ぐ。

### データが見つからない

1. reportIdで検索する。
2. 状態と最終更新日時を確認する。
3. 添付ファイルIDとPDFファイルIDを確認する。
4. バックアップと監査履歴を照合する。
5. 復元前に現在の状態をコピーする。

### 誤った帳票が出力された

1. PDFを利用停止にする。
2. 使用した帳票設定のバージョンを確認する。
3. 設定を直前の安定版へ戻す。
4. 修正版PDFを再作成する。
5. 旧PDFと修正版PDFを履歴に残す。

## 7. 定期運用

| 頻度 | 確認内容 |
| --- | --- |
| 毎日 | PDF失敗、Drive保存失敗、未処理ジョブ |
| 毎週 | バックアップ、権限、失敗件数、容量 |
| 毎月 | 復旧テスト、不要ファイル、利用者設定、変更履歴 |
| リリース毎 | 受け入れテスト、設定バージョン、ロールバック先 |

## 8. 実装開始前の未確定事項

- 新アプリの公開先をどの環境にするか。
- 本番データを初期から新構造へ移すか、旧Sheets互換層を置くか。
- 旧アプリを参照専用で残す期間。
- 領収書を1枚対応にするか、複数枚対応にするか。
- 元画像を保存する期間と削除権限。

これらは実装開始前にユーザー承認を受ける。決定前に本番データへ変更を加えない。
