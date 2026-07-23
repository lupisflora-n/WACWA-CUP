# 2026-07-24 引継ぎ前チェックポイント

## この地点の意味

現行AppSheetからの完全移行を優先するため、次のアプローチへ切り替える直前の保存地点。ここまでの仮アプリと調査資料を残し、別方針を試した後でもこの状態へ戻せるようにする。

## 現在あるもの

- React/Viteの仮アプリ「オシゴトアプリ」
- 工事完了報告書・丸産報告書のフォームと帳票プレビュー
- 下書き、完了、履歴、バックアップ、ローカル保存
- 領収書の添付・編集画面の試作
- 項目タイトルとタグ文字列の編集・コピー画面
- 新台紙を背景にしたタグ配置調整画面
- GitHub Pages向けのビルドと公開設定
- 調査・仕様書: `docs/00-project-understanding.md`、`docs/14-new-document-field-analysis.md`、`docs/16-approved-form-specification.md`、`docs/27-current-full-flow-status.md`

## 既知の未完成部分

- 現行AppSheetとの完全な機能・項目・権限・アクション対応確認
- Google Drive/Sheetsを使った本番データ保存と認証
- 本番用PDF生成とDrive保存
- 新しいPDF/Excel台紙との正確な座標・文字サイズ合わせ
- 領収書画像の本番永続保存
- サーバー側の権限、監査履歴、失敗時の再実行

## 復帰方法

この文書を含むコミットに付けたGitタグ `checkpoint/pre-migration-rearchitecture-2026-07-24` を復帰先とする。作業を戻す場合は、作業中の変更を別ブランチへ保存してから、タグから新しい作業ブランチを作る。既存のユーザー変更を削除する操作は、明示的な承認なしに行わない。

## 確認URL

- 公開アプリ: https://lupisflora-n.github.io/WACWA-CUP/
- 項目タイトル・タグ編集: https://lupisflora-n.github.io/WACWA-CUP/?open=tags
- 台紙タグ配置: https://lupisflora-n.github.io/WACWA-CUP/?open=placements
