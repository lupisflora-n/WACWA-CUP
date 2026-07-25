# Apps Script連携

`Code.gs` は、現行のGoogle Slides台紙生成方式を新アプリから呼び出すための連携コードです。

## 必要なScript Properties

Apps Scriptの「プロジェクトの設定」に次を登録できます。未登録でも、下記の現行Drive確認済みIDが初期値として使われます。

| 名前 | 内容 |
|---|---|
| `OUTPUT_FOLDER_ID` | PDF保存先のDriveフォルダID |
| `COMPLETION_TEMPLATE_ID` | 工事完了報告書のSlides台紙ID |
| `MARUSAN_TEMPLATE_ID` | 丸産報告書のSlides台紙ID |

## リクエスト形式

```json
{
  "action": "generatePdf",
  "fileName": "工事完了報告書_20260721",
  "report": {
    "type": "completion",
    "toCompany": "AHC",
    "workDate": "2026/07/21",
    "supporters": ["菊", "笠"],
    "completionStatus": "完了",
    "occurrence": "1回目"
  },
  "tagValues": {}
}
```

`tagValues` は、管理画面で追加されたタグの値を渡すための拡張領域です。複数帳票を1つのPDFにする場合は `reports` 配列を渡します。各帳票は自分の種類のSlides台紙からページ追加されます。

丸産報告書は `ms_personInCharge`、`ms_date`、`ms_site`、`ms_am_time`、`ms_pm_time`、`ms_work2`〜`ms_work4`、`ms_nameL1`〜`ms_nameR3` を正式タグとして扱います。工事完了報告書のタグを丸産へ流用しません。

## 本番前の確認

- GAS Webアプリの実URL
- 実行ユーザーとアクセス権
- 丸産報告書の正式なSlides台紙ID
- 領収書画像を新アプリからDriveへ保存する方法
- 現行PDFと新アプリPDFの画像比較
## 共有保存（本番化前の設定）

新アプリのフォーム入力を複数端末で共有する場合は、同じApps Script Webアプリに次のScript Propertiesを登録します。未登録時は従来どおりPDF生成だけが動き、ブラウザの端末保存を使います。

| 名前 | 内容 |
|---|---|
| `STORAGE_SPREADSHEET_ID` | 共有保存用スプレッドシートID。現行の `completion_reports` を直接変更せず、専用タブを使う |
| `STORAGE_SHEET_NAME` | 保存タブ名。例: `_oshigoto_records` |
| `GOOGLE_CLIENT_ID` | Google Identity ServicesのWeb client ID |
| `ALLOWED_EMAILS` | 利用を許可するGoogleアカウントをカンマ区切りで登録 |
| `ADMIN_EMAILS` | タグ・配置設定を変更できる管理者アカウント |
| `VIEWER_EMAILS` | 閲覧専用にするGoogleアカウントをカンマ区切りで登録 |
| `AUTH_REQUIRED` | 本番では `true`。設定中は `false` のままにする |

`AUTH_REQUIRED=true` では、保存・削除・PDF生成の各リクエストにGoogleログインのIDトークンが必要です。公開APIに共有書き込み権限を残さないため、許可メールアドレスを登録してから切り替えます。共有保存の一覧・保存・削除・設定変更は、認証が無効な状態では拒否されます。

保存先は現行の `completion_reports` と分離した専用タブです。移行確認後に、必要な列だけを現行シートへ同期する方針にできます。

認証後の保存先は `_oshigoto_records`、設定変更履歴は `_oshigoto_config_history`、操作履歴は `_oshigoto_audit` に分離されます。
