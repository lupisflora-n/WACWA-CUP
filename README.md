# WACWA-CUP

表示名: オシゴトアプリ

## 目的

AppSheetで作成された既存の業務アプリをもとに、工事完了報告書、日報、請求、月次集計を扱う新しいアプリを作る。

このプロジェクトでは、既存のGoogle Drive / Google Sheets / Google Docs / Google Slides資産を調査し、使えるものは引き継ぎながら、管理・更新・保守しやすい形に整理する。

## 現在の状態

- ローカルGitリポジトリ: 作成済み
- GitHubリポジトリ名: `WACWA-CUP`
- 表示名: `オシゴトアプリ`
- Driveフォルダ: 読み取り確認済み
- AppSheet管理画面: 追加の権限確認が必要
- 実装方式: 未確定。現時点の第一候補はPWA寄りのWebアプリ

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
- [用語集](docs/glossary.md)

## 次の作業

1. AppSheet管理画面の閲覧可否を確認する。
2. 既存アプリから引き継ぐ機能を確定する。
3. 新アプリの画面一覧と入力フローを設計する。
4. 技術方式を確定する。
5. 最小実用版の実装に入る。
