# WACWA-CUP

表示名: オシゴトアプリ

## 目的

AppSheetで作成された既存の業務アプリをもとに、工事完了報告書、日報、請求、月次集計を扱う新しいアプリを作る。

このプロジェクトは、既存アプリの単純な作り直しではない。既存のGoogle Drive / Google Sheets / Google Docs / Google Slides資産を調査し、使えるものは引き継ぎながら、AppSheetの制約を超えたオリジナルの業務アプリへ再設計する。

重視すること:

- デザインを一新し、オリジナルの操作体験にする
- 既存機能を改善する
- AppSheetでは実現しにくい新機能を検討する
- データ、帳票、設定、権限を整理し、管理・更新・保守しやすくする
- GitHubで履歴管理し、判断理由を後から追えるようにする

## 現在の状態

- ローカルGitリポジトリ: 作成済み
- GitHubリポジトリ名: `WACWA-CUP`
- 表示名: `オシゴトアプリ`
- Driveフォルダ: 読み取り確認済み
- AppSheet管理画面: 追加の権限確認が必要
- 実装方式: 未確定。現時点の第一候補はPWA寄りのWebアプリ

## MVPスマホプレビュー

固定URL:

<https://lupisflora-n.github.io/WACWA-CUP/>

スマホではこのURLをブックマーク、またはホーム画面に追加して確認する。Wi-Fi接続や毎回変わる開発用リンクは不要で、携帯回線からも同じURLを開ける。`main`への公開後はGitHub ActionsがビルドとGitHub Pagesへの反映を行う。

確認用の入口:

- 工事完了報告書の台紙確認: <https://lupisflora-n.github.io/WACWA-CUP/?fixture=completion-reference>
- 丸産報告書の台紙確認: <https://lupisflora-n.github.io/WACWA-CUP/?fixture=marusan-reference>
- 項目・タグ名の編集画面: <https://lupisflora-n.github.io/WACWA-CUP/?open=tags>
- タグ配置の編集画面: <https://lupisflora-n.github.io/WACWA-CUP/?open=placements>

現在の公開版はサンプル環境で、帳票データは原則として端末内に保存する。Google Drive / Sheetsへの共有保存と本番運用権限は別途受入確認が必要である。

## 開発ルール

- 不明点を曖昧なまま実装しない。
- 業務の言葉とシステムの言葉を分けて整理する。
- 初心者でも後から見返せるよう、判断理由をドキュメントに残す。
- データ、画面、帳票、権限、運用を分けて考える。
- 既存のDrive資産を壊さない。調査と設計を先に行う。

## 主要ドキュメント

- [プロジェクト理解](docs/00-project-understanding.md)
- [Driveデータ調査](docs/01-data-inventory.md)
- [プロダクト企画](docs/02-product-plan.md)
- [技術方式の選択肢](docs/03-architecture-options.md)
- [実装ロードマップ](docs/04-implementation-roadmap.md)
- [進行ルールと専門家チーム](docs/06-operating-model.md)
- [Phase 1 棚卸し計画](docs/07-phase-1-inventory-plan.md)
- [Phase 1 初回棚卸し結果](docs/08-phase-1-initial-findings.md)
- [用語集](docs/glossary.md)

## 次の作業

1. AppSheet管理画面の閲覧可否を確認する。
2. 既存アプリから引き継ぐ機能を確定する。
3. 新アプリの画面一覧と入力フローを設計する。
4. 技術方式を確定する。
5. 最小実用版の実装に入る。
