# オシゴトアプリ 現在の受入ゲート（2026-07-24）

## 今回確認・修正したこと

- Google Slides台紙を使った工事完了報告書・丸産報告書のPDF生成経路を維持した。
- 丸産報告書は `ms_` 系の専用タグで処理し、工事完了報告書のタグを流用しない。
- タグ定義と配置定義はリクエストに含め、位置・幅・高さ・文字サイズをPDF生成側にも渡す。
- 領収書の加工済み画像をPDF生成リクエストへ渡し、データURLまたはDrive画像をSlidesへ配置できるようにした。
- Googleログインを有効にした場合、PDF生成にもIDトークンを渡すようにした。
- 共有保存は認証なしでは拒否する。認証後は利用者・管理者・閲覧者を分け、帳票・設定・操作の記録を専用タブへ分離する。

## 合格済みの証拠

- `docs/32-pdf-placement-deployment-evidence-20260724.md`
- `npm.cmd run build` 成功
- `integrations/apps-script/Code.gs` の構文検査成功

## 未合格のゲート

1. 最新のApps Scriptを固定Webアプリへ再デプロイする操作が未完了。現在のローカルコードを保存済みだが、公開版への反映は未確認。
2. `GOOGLE_CLIENT_ID`、`ALLOWED_EMAILS`、`ADMIN_EMAILS`、必要なら`VIEWER_EMAILS`が未登録。したがって認証付き共有保存は未運用開始。
3. GitHub Pagesへ最新ローカル変更を公開していない。固定URLは確認済みだが、最新変更をスマホから受入確認できる状態ではない。
4. 現行AppSheetの権限・通知・共有仕様は、AppSheet管理画面での最終比較が必要。確認できない挙動は実装済みとみなさない。

## 本番化の順序

1. Apps Scriptの既存デプロイを同じURLのまま更新する。
2. Google CloudのWebクライアントIDと許可メールアドレスを登録する。
3. `AUTH_REQUIRED=true`に変更し、利用者・管理者・閲覧者で保存、閲覧、PDF生成を受入する。
4. ローカル変更を承認されたGitHub変更として公開し、スマホの固定URLでフォーム、領収書、PDF、履歴を確認する。

## 2026-07-25 deployment evidence

- The fixed Apps Script web-app deployment ID was updated in the Apps Script UI without changing its URL.
- The deployed version reported by the UI is version 4 (2026/07/25 00:00).
- Execute-as account remains `kmk7531.hmk.runner@gmail.com` and access remains `全員`.
- The stable endpoint remains `https://script.google.com/macros/s/AKfycbypf--ECDZXeaXM32FvkkO_f1092xI-_L75k2LnceqsImgUgQk9ZgJFn6wLd_A1Imgz/exec`.
- Browser navigation to the endpoint response was not completed in this pass; do not treat the health response as independently verified.
