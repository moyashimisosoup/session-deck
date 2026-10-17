# Session Deck

**ChatGPT・Claude Code・Codexの作業とセッションを横断して俯瞰するWebダッシュボード。**

> **2つの表示を分離しています。** `index.html` は架空セッションの操作デモ、`portfolio.html` はGitHubで管理する実アプリ台帳と**公開リポジトリの観測メタデータ**を扱う読取り専用画面です。実際のChatGPT/Claude Code/Codexセッションを自動取得する機能ではありません。

## デモを動かす

リポジトリの `index.html` を、`styles.css`・`app.js` と同じフォルダに置いて開きます。ブラウザで動く静的アプリで、パッケージのインストールやサーバー側の処理は不要です。

ローカルHTTPサーバーを利用する場合:

```sh
python -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。

GitHub Pagesの公開方式は `Settings → Pages → Build and deployment → Source: GitHub Actions`。 [公開・週次収集ワークフロー](.github/workflows/deploy-pages.yml) が `index.html` / `styles.css` / `app.js` / `portfolio.html` / 公開用台帳 / **生成された公開GitHub観測JSON**のみをステージングして配信します。**毎週月曜10:17（JST）頃に再収集**し、対象ファイルへのpushやGitHub Actionsの `Run workflow` でも実行できます（GitHub側で実行遅延の可能性あり）。公開URL: https://moyashimisosoup.github.io/session-deck/ 。配信後は実URLを読み戻して確認してください。

## Repo整理・クラウドセッション継続運用（2026-10-17）

- [公開Repoの整理候補](docs/REPO_HYGIENE_20261017.md)：2アカウントのRepoを棚卸しし、重複・公開Repoの長期間未push・空に近いRepoを**候補**として記載しました。無人でArchive/Deleteはしません。
- [非ローカルSession運用規則](docs/CLOUD_SESSION_PROTOCOL.md)：APP-ID / work_id / session_id の分離、推奨チャット名、START・CHECKPOINT・HANDOFF・END、実測時刻と未確認の区別、TradingSystemの段階的寿命管理を参考にした引継ぎ原則。
- [アプリ台帳UI](portfolio.html)の下部に「セッション記録テンプレート」を追加。**開始／チェックポイント／終了・引継ぎ**をコピーしてChatGPT・Codex・Claude Codeの非ローカルセッションで使えます。これはテンプレートのコピーのみで、実チャットを自動監視・記録・改名する機能ではありません。
- 現在の公開GitHub Pagesは匿名閲覧できるため、**実際のセッションID、会話URL、非公開Repoの名前・進捗や引継ぎの本文を配信しません**。セッションイベントの同期には別の認証付き非公開保管先が必要です。

## アプリ台帳（実データの読取り専用画面）

- [アプリ台帳を開く](portfolio.html) ／ [台帳の正本](docs/APP_PORTFOLIO.md)
- 実際のアプリ登録内容を、GitHubの公開Markdownから画面表示時に読み込みます。名称・段階・次の作業で検索し、Repo確認済みと会話ベースの構想を絞り込めます。
- **台帳は手動・節目更新が基本**。公開リポジトリ13件をGitHub REST APIで週次・手動・台帳更新時に収集し、最新コミット・Actions・直近の未完了PR/Issueのメタデータを表示します。変更検出はコミット差分の候補提示のみで、台帳の自動書込みや、チャット本文の自動収集は行いません。
- [初回の吸い上げ・今後の更新ルール](docs/PORTFOLIO_OPERATIONS.md)
- この画面と、架空セッション情報だけを表示する既存デモ画面は独立しています。公開台帳に非公開セッションURL・個人情報を記録しないでください。
- **収集・公開確認済み（2026-10-17）**：GitHub Actionsの公開データ収集が13/13件成功し、Pagesの [portfolio.html](https://moyashimisosoup.github.io/session-deck/portfolio.html) と [観測JSON](https://moyashimisosoup.github.io/session-deck/data/portfolio-observations.json) で読戻し確認済み。iPhone実機操作は未確認です。

## 更新候補を見失わない「未レビュー」キュー

- [チェックポイント台帳](docs/PORTFOLIO_REVIEW_CHECKPOINTS.json)にAPP-ID別の**初期観測基準**を保持。内容を確認済みと偽らず、前回スキャンの比較とは独立して更新候補を記録します。
- GitHubのHEADが基準SHAと異なれば[アプリ台帳](portfolio.html)で「未レビュー」と表示し続けます。「差分をGitHubで確認」「検証依頼をコピー」からレビューします。
- レビュー後、根拠を確かめた担当者がコミットSHAと日時・証跡を更新するまで確認完了とは扱いません。アプリ台帳の開発段階は引き続きMarkdownの手動更新が正本です。
- 運用手順は[進捗の更新・レビュー基準](docs/PORTFOLIO_OPERATIONS.md)を参照してください。並行するUI改良は別ブランチで行い、同一ファイルの変更を競合確認してから統合します。

## 静かなLinear風UIとキーボード操作（2026-10-17）

- [アプリの現在地](portfolio.html)に、落ち着いたチャコール系のダークUIとライトテーマ切替を追加。Linearの2026年UI刷新で示された「主コンテンツ優先」「画面間の一貫性」を設計思想として参考にしました。デザイン素材・CSSの転載はありません。
- **⌘K / Ctrl+K** でアプリ名やAPP-ID、表示切替を検索。**J/K・上下キー**で行移動、**Enter**で詳細展開、**/**で検索欄へ移動、**Esc**で閉じます。入力欄で文字入力中は行操作を実行しません。
- 画面右上のボタンでダーク／ライトを切り替えられます。端末のlocalStorageには**テーマ名だけ**保存し、認証情報やアプリデータは保存しません。
- [比較調査とアクセシビリティ設計](docs/PORTFOLIO_LINEAR_UX.md)に参照したLinear公式記事、採用したUI要素、未確認の実機項目を明記しています。

## アプリ台帳の一覧UI（2026-10-17）

- [アプリの現在地](portfolio.html)は「**いまの状態**（台帳）／**最後のGitHubコミット**（公開観測）／**次にすること**（台帳）」の3項目を1行で確認できる高密度の一覧画面です。長い検証結果は行を展開して読む方式にしました。
- 上部で「未レビュー」「台帳上で進行中」「全件」「Repo未照合」を絞り込み、コミット新着順・ID順・開発段階順へ切り替えられます。PCは表、スマホは縦の情報ブロックです。
- コミット日付はGitHub上の記録であり、最終チャット発言時刻・作業者の操作時刻とは異なります。「未照合」「未取得」を残して状態を推測しません。
- 技術は依存ゼロのHTML/CSS/JavaScript。[他製品UIとの比較と選定理由](docs/PORTFOLIO_UI_RESEARCH.md)を参照。既存のセッション管理デモとそのUIアニメーションは変更していません。

## v0.1で試せること

- ダッシュボード、作業一覧、セッション一覧、引継ぎ記録の切替
- 作業/セッションの検索、AI・プロジェクト・状態による絞込み
- 作業・セッションの詳細、正式名と実表示名の差異の可視化
- デモ作業の登録・状態変更、セッション追加、引継ぎメモ登録
- 正式名 `【短い作業名】MMDD・作業番号・具体的内容` の作成・コピー
- ブラウザ内保存（localStorage）、JSONエクスポート、初期化
- PC・モバイル対応レイアウト（実機検証はこれから）

## 現状と制約

- **GitHubへ保存済み**: HTML・CSS・JavaScript、公開GitHub観測スクリプト、オフラインテスト、ワークフロー、設計文書。
- **確認済み（2026-10-17）**: GitHub Pages上でセッション管理デモのトップページがHTTP 200、アプリ台帳画面がHTTP 200・全21件表示。Actions [run #3](https://github.com/moyashimisosoup/session-deck/actions/runs/38943748943) が成功。
- **未確認**: iPhone実機での動作、デモの全操作・ブラウザE2Eテスト。
- **未実装**: 実サービスのセッション自動取得、オンライン同期、実チャット名の自動改名、認証付きデータベース。
- ブラウザ上のデモ編集は実際のセッション・GitHub・Claude Code / Codexの作業には影響しません。
- このデモに入力したデータはブラウザのlocalStorageに保存されます。会話本文、実セッションID、内部URL、口座情報、認証情報など**実データを入力しない**でください。JSONエクスポートにも入力内容が入ります。
- ブラウザストレージは端末間同期されず、消去・プライベートブラウズなどで失われ得ます。
- デモに表示される「進行中」や「最終更新」は架空データであり、実際の稼働確認を意味しません。

## 構成

| ファイル | 役割 |
|---|---|
| [index.html](index.html) | 画面のHTML |
| [styles.css](styles.css) | レスポンシブな外観 |
| [app.js](app.js) | 架空データ、画面操作、ローカル保存 |
| [portfolio.html](portfolio.html) | 実台帳＋公開GitHub観測の閲覧UI |
| [docs/APP_PORTFOLIO.md](docs/APP_PORTFOLIO.md) | アプリ進捗の唯一の中央台帳 |
| [scripts/collect_portfolio.py](scripts/collect_portfolio.py) | 公開GitHub情報の取得・検証・配信用JSON生成 |
| [tests/test_collect_portfolio.py](tests/test_collect_portfolio.py) | 台帳解析・公開境界・差分検知のオフラインテスト |
| [docs/PORTFOLIO_OPERATIONS.md](docs/PORTFOLIO_OPERATIONS.md) | 週次運用、初回吸い上げ、失敗時の対応 |
| [docs/CONCEPT.md](docs/CONCEPT.md) | 初期構想、原則、データモデル |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 今後の優先順位、実装フェーズと完了条件 |
| [docs/INTEGRATION_PLAN.md](docs/INTEGRATION_PLAN.md) | 外部連携、安全境界、データの公開・非公開 |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | 実機・ブラウザ・安全性の検証計画 |
| [docs/REAL_DATA_INGESTION_PLAN.md](docs/REAL_DATA_INGESTION_PLAN.md) | 実データの安全な収集・正規化・保管・接続ロードマップ |
| [docs/UI_MOTION_DESIGN.md](docs/UI_MOTION_DESIGN.md) | 参照ライブラリ比較、画面ごとのアニメーション仕様、性能・操作性テスト |

## 次の段階

1. PCとiPhoneでの表示・操作テストを実施し、必要なUI修正を行う。
2. 確認済みのGitHub PagesでPC・スマホの主要操作を検証する。
3. 非公開データ管理の方式を決め、作業IDとセッションIDのスキーマを確定する。
4. 公開GitHubの読取り連携は試作稼働済み。今後は変更候補のレビューを改善し、プライバシー・認証設計後に限りClaude Code / Codex / ChatGPTの非公開セッション連携を検討する。

非公開セッション情報の連携は[取り込み計画](docs/REAL_DATA_INGESTION_PLAN.md)、UIモーションは[設計](docs/UI_MOTION_DESIGN.md)を参照してください。**公開GitHubメタデータ収集のみ実装済み**で、非公開AIセッションの収集と追加モーションの計画は未実装です。

より詳しくは[開発ロードマップ](docs/ROADMAP.md)を参照してください。TradingSystemの運用正本や権限境界を、このリポジトリが変更することはありません。
