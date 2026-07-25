# PDF生成の固定接続先と検証結果

## 固定接続先

新アプリのPDF生成は、次のGoogle Apps Script Webアプリへ固定する。

`https://script.google.com/macros/s/AKfycbypf--ECDZXeaXM32FvkkO_f1092xI-_L75k2LnceqsImgUgQk9ZgJFn6wLd_A1Imgz/exec`

このURLはアクセス先を毎回変えないための接続先である。WebアプリはGoogle Slides台紙をコピーし、タグを置換し、PDFへ変換してDriveへ保存する。

## 2026-07-24の確認

- 完了報告書: APIからPDF生成成功、1ページ、Drive保存成功
- 丸産報告書: `ms_*` の丸産専用タグでPDF生成成功、1ページ、Drive保存成功
- 出力先: `1S_je5bOw_KWBcgYeKbpjKWD3551T83Jl`
- 完了報告書テンプレート: `1X6ouLZBV56-Mz8XmdnR0kSC63gJnsTPegmTK_gmfRUU`
- 丸産報告書テンプレート: `1hNAWOSqYxBlhpP7N6-_bi3f8tKa0nMQLAQfqFlJHR1o`

## 現時点の判定

API接続、PDFファイル作成、現行と同じ入力値によるページ画像比較を確認した。

- 台紙、文字の位置、文字サイズ、完了・未完と回数の丸印: 一致
- 工事内容の重複表示、高速代0表示: 修正済み
- 領収書画像: 元画像IDを同じ入力へ含めた最終比較が未完了
- 完全一致の合格判定: 領収書画像を含む最終比較後に判定する

丸産報告書は完了報告書のタグを流用せず、`ms_personInCharge`、`ms_date`、`ms_site`、`ms_am_time`、`ms_pm_time`、`ms_work2`、`ms_nameL1`〜`ms_nameR3`など丸産専用タグを使用する。
