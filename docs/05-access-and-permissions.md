# アクセス権限メモ

## Google Drive

CodexのGoogle Driveコネクタから、ユーザー提供のDriveフォルダと主要ファイルを読み取れた。

今後の注意:

- 実際のDrive IDやURLは、公開される可能性がある場所に書かない。
- 本番データには個人名、住所、現場情報、請求情報が含まれる。
- 開発中は本番データを直接変更しない。
- 必要であれば、サンプル用シートを別に作る。

## AppSheet

通常のWeb取得ではAppSheet管理画面を確認できなかった。

理由の候補:

- AppSheet管理画面がログイン状態に依存している。
- Codexから操作できるブラウザ環境と、AppSheetにログイン済みのブラウザが違う。
- AppSheetアプリの共同編集権限が不足している。

確認したいこと:

- AppSheetアプリを、Codexが接続しているGoogleアカウントに共同編集者として共有する。
- 可能なら、AppSheetの次の画面を確認する。
  - Data
  - UX
  - Behavior
  - Automation
  - Security
  - Manage

代替手段:

- AppSheet設定画面のスクリーンショットを共有する。
- AppSheetの設定エクスポートが可能なら共有する。
- 主要な画面構成だけ手作業で一覧化する。

## GitHub

GitHubアプリの接続アカウントは確認できた。

現時点の制約:

- この環境にGitHub CLIの `gh` が入っていない。
- 現在利用可能なGitHubコネクタには、新規リポジトリ作成ツールが見えていない。

そのため、GitHub上の新規リポジトリ作成には次のどちらかが必要。

1. ユーザーがGitHubで `WACWA-CUP` リポジトリを作成し、Codex用GitHubアプリのアクセス対象に追加する。
2. このPCにGitHub CLIを導入し、ログイン後に `gh repo create` を使う。

推奨:

- リポジトリは最初はprivateで作る。
- 実データ、Drive ID、個人情報、請求情報はコミットしない。
