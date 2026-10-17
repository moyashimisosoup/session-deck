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

## 新アプリ受付を自動化する App Factory（初期実装）

- [採用→非公開Repo作成の設計と導入手順](docs/APP_FACTORY_LAUNCH_PLAN.md)／[移植用のテスト済みコード](bootstrap/app-factory/README.md)。
- 「新アプリ案」で**構想整理のみ**、「採用」で承認依頼、「作成を承認」でprivate Repo生成を試みる。公開GitHubに個別アイデアの申請本文は置かない。
- 現在この公開Repoに保存されているのは**起動しないブートストラップ**。ユーザーが専用の非公開受付Repoを一度作成し、そこへ設置・Action Secretを設定するまで自動作成機能は稼働しない。
- リポジトリ生成、初期ファイル配置、台帳のAPP-ID登録、Pages配信をそれぞれ別々に検証する。未実施を「作成済み」と報告しない。

## ChatGPTの早期引継ぎとプロジェクト設定（2026-10-17）

- [早期引継ぎ運用規則](docs/CHATGPT_EARLY_ROTATION_POLICY.md)：通常ChatGPTのコンテキスト残量を推測せず、意味のある進捗・記録の鮮度・作業の複雑さでCHECKPOINT/HANDOFF_READYを判断します。
- [ChatGPTプロジェクト指示への追記文](docs/CHATGPT_PROJECT_INSTRUCTIONS.md)：ユーザーが「アプリ思いつき作成」のプロジェクト設定へ**手動で1回貼る**ための短文。GitHub保存だけではChatGPTの設定は自動更新されません。
- 公開[アプリ台帳](portfolio.html)下部のコピー機能にも「早期引継ぎの規則」を追加します。ここから実チャットや非公開イベントを自動取得する機能はありません。

## 全アプリ共通の小さな進捗表示（2026-10-17）

- [Chat Progress Bar](docs/CHAT_PROGRESS_BAR.md)：各開発チャットの回答末尾に**現在の状態・確認したJST時刻・保存済みの証拠・次の一手**を1行表示する共通ルール。ChatGPTのプロジェクト設定へ貼り付ける短文も収録。プロジェクト設定自体をGitHubから自動変更したものではありません。
- [公開アプリ台帳](portfolio.html)の「セッション記録テンプレート」に**毎回答の進捗表示ルールをコピー**を追加。START/ENDと違い、毎回答の表示だけを指示します。保存や実セッションの自動検出は行いません。

## 非公開セッションの復元・再開PoC（2026-10-17）

- 非公開Driveで**架空のSTART→CHECKPOINT→HANDOFFを各1件**、リビジョン条件付きで保存・読戻し。古いrevisionの書込み拒否と無変更も確認しました。実チャットの自動収集ではありません。
- [private_journal.py](scripts/private_journal.py)は`event_id`の冪等性確認、同IDの内容衝突の拒否、破損JSONの拒否、`work_id`ごとの最新CHECKPOINT／HANDOFF・次の一手を**オフライン**で再構成します。[回帰テスト](tests/test_private_journal.py)は架空データ専用です。
- [アプリ台帳](portfolio.html)のアプリ詳細に「このアプリの引継ぎを復元」、下部に「再開・復元をコピー」を追加。認証済みのGoogle Drive接続を使って**読み取り専用で**照合するプロンプトを渡します。公開HTMLからDriveへ直接アクセスしません。
- 所有者限定のGoogle Docs内に、架空Workの再開状態だけを示す**手動更新の試験ビュー**も作成済みです。自動同期・認証付き独立Web UIは未実装。[PoC運用と限界](docs/PRIVATE_SESSION_STORE_PLAN.md)参照。

## 自動Repo衛生監査と非公開セッション保存PoC（2026-10-17）

- [アプリ台帳](portfolio.html)の「リポジトリの整理候補」に、2アカウントの**公開Repo限定**の週次チェックを追加しました。名前の一致、アプリ台帳未登録、最終pushの経過（30/60/90日）、空に近い初期状態を検知します。公開可能なメタデータだけを[生成JSON](https://moyashimisosoup.github.io/session-deck/data/repo-hygiene.json)に配信します。
- 確認結果は[REPO_HYGIENE_DECISIONS.json](docs/REPO_HYGIENE_DECISIONS.json)に明示的な証拠と日時で記録でき、自動検出だけでArchive/Deleteはしません。公開GitHubに登録された非公開Repoの情報は収集結果へ含めません。
- [非公開イベント保存PoC](docs/PRIVATE_SESSION_STORE_PLAN.md)では、所有者限定のGoogle DriveフォルダとGoogle Docを作成し、ダミーの書込み・読戻し・権限確認を実施。実会話の自動記録／ChatGPT開始時刻の自動取得／非公開管理UIは**未実装**。
- [イベント形式バリデータ](scripts/validate_private_event.py)は**ネットワークも保存も行わない**純粋な形式検査です。CIには架空データしか渡しません。非公開の実イベントを公開リポジトリへコミットしないでください。

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
