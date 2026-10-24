# 公開GitHub観測器の役割分担と重複回避

- 対象: APP-001 Session Deck
- 照合日: 2026-10-21 JST
- 状態: 既存実装を比較した境界決定。統合リファクタリングは未実施。
- 参照: [実データ取込計画](REAL_DATA_INGESTION_PLAN.md) / [運用台帳](APP_PORTFOLIO.md)

## 1. 現行実装の比較

| 観点 | 公開台帳収集器 `scripts/collect_portfolio.py` | 独立調査CLI `scripts/github-public-probe.mjs` |
|---|---|---|
| 主な用途 | Pages公開台帳に載せる、制限された観測スナップショットの生成 | 1件の**公開**リポジトリを手動調査するPoC |
| 対象選択 | `docs/APP_PORTFOLIO.md`の公開A節を正本として制限 | `--repo owner/name`で明示指定 |
| 公開に使えるフィールド | 公開repo・commit・PR/Issue/Actionsの限定した識別子、時刻、状態等。本文/タイトルは含めない | PR・Issueの**タイトルを含む**調査用出力。ページ公開に流用しない |
| 出力・使用場所 | `_site/data/portfolio-observations.json`。Pages公開用にホワイトリスト配信 | CLI標準出力のJSON。既定は非公開のローカルレビューのみ |
| GitHubアクセス | 公開repoのみをチェック。ActionsからGitHub tokenを使えるが公開属性を検証 | 通常は無認証read-only。fixtureテストあり |
| 既存テスト | `tests/test_collect_portfolio.py`（Python） | `tests/github-public-probe.test.mjs`（Node） |
| 状態評価 | previous snapshot・レビューアンカー・取得不能を区別 | リクエスト時点の生情報。レビュー判定や複数APPとの紐付けは行わない |
| 実セッション取得 | 非対応 | 非対応 |

## 2. 今回の判断

1. **収集実装の一本化はまだ行わない**。用途・出力公開範囲・許可対象・言語・欠損表現が異なる。単にGitHub APIを呼ぶ点だけで統合すると、タイトルや未審査フィールドが公開Pagesに紛れ込む恐れがある。
2. 公開台帳は引き続きPython収集器を正とする。公開Pagesの`deploy-pages.yml`は許可済みファイルだけをステージングし、調査用PoCやfixturesを配信しない。
3. 調査CLIは**開発者が明示実行する検証器**として維持する。生成した実API JSONを公開リポジトリ、Pages、Actions artifactへ追加しない。
4. 将来共通化するなら、取得結果を直接共有せず、まず`source` / `observed_at` / `repository` / `verification` / `availability`などの**非公開インターフェースと正規化規則**から検討する。フィールドの公開可否は各出力側で別審査する。
5. 実セッション・実work_idとの結合処理を公開収集器へ足さない。work_idの照合やChatGPT・Claude Code・Codexの連携は、別途選定・認証された非公開データ層で実行する。

## 3. 後続の検収ゲート

- 公開観測スナップショットにIssue/PR本文・タイトル・認証情報・非公開Work IDがないことをCIで継続検査。
- 調査CLIの異常repo名・不正limit・fixtureスキーマのテストを維持。
- GitHub API障害時、`unavailable`を`stopped`/`completed`/`unchanged`と誤表示しない。
- いずれかの処理を統合する前に、2種類の出力フィールドの差分と実データ0件・失敗時の回帰テストを追加。
- UI実機テスト（PC 100%表示、iPhone Safari）と公開HTTP読戻しは、コード・CI検証とは別記録にする。

本資料は既存コードの構成判断であり、新たな外部データ連携や非公開セッション取得が成立したことを示すものではない。
