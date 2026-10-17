# アプリ・ポートフォリオ運用手順 v1.2

初版: 2026-10-17  
正本: [APP_PORTFOLIO.md](APP_PORTFOLIO.md)  
閲覧UI: [Session Deck アプリ台帳](../portfolio.html)

## 役割の分離

- **各アプリのリポジトリ**: ソース、仕様、GitHub Issue/PR、検証ログ、今後の作業の一次情報。
- **APP_PORTFOLIO.md**: 全アプリの目次と現在地。詳細な仕様の重複記載は避ける。
- **Session Deck UI**: Markdown台帳と公開GitHub観測JSONを**読取り専用**で表示します。表示やフィルタ操作はGitHubを書き換えません。
- **チャット／Codex／Claude Code**: 意図・意思決定・作業中の状況の補足情報。各セッションの主張はコミット・テスト・実URL等の根拠が取れるまで「確認済み」にしない。

## 日常運用：イベント駆動方式

通常の相談・軽微な修正・思いつきだけでは毎回台帳更新を要求しない。

次の場合にのみ更新を検討する。

1. アプリ案が正式採用された、Repoの正本が確定した。
2. 実装段階が進んだ（構想→設計、設計→試作、公開開始など）。
3. 重要な仕様が変わった、別案を採用／保留した。
4. 試作・PR・CI・デプロイ・実機試験が完了し、根拠URLができた。
5. 別チャットや別AIへ担当が移る、作業を停止／再開する。

**報告条件と記録条件は同じではない。** 小さな更新は各Repoのコミット・Issueだけで足りる。中央台帳には横断的に重要な差分のみ反映する。

## 記録の最小単位

- APP-ID（台帳の固定識別子。再利用しない）
- アプリの正本Repo、開発段階（構想／調査・設計／試作／限定公開／運用・改善／保留）
- 作業状態（未着手／進行中／検証待ち／保留／現況未確認）
- 確認済み成果 + 根拠URL（コミット、PR、README、CI、実URL検証）
- 未解決課題、次の作業を**1件**中心に記載
- 根拠最終確認日（YYYY-MM-DD）。GitHub最終push日やチャット最終発言日とは区別

ソースがGitHubにあっても「Web配信済み」「実機確認済み」「ユーザー受入済み」は別々の事実。セッションが作業中かは自動判定しない。

## 既存アプリからの初期情報吸い上げ

1. **Repo発見**：GitHubの両アカウントからRepository一覧を確認し、名称変更・同内容のRepoを照合する。新規Repoをむやみに作らない。
2. **技術的事実**：README、docs/ROADMAP、仕様書、直近コミット、PR、Issue、CIを読み、日付・参照URLとともにまとめる。
3. **公開状態**：Pages URLがREADMEにあるだけでは「配信成功」としない。Actionsの成功、実URLの応答、主要操作の検証を分ける。
4. **チャットだけの成果**：既存チャットに対し、下の「初回棚卸し依頼」を**1回だけ**出す。アクセスできないチャット・未コミット成果は未照合とする。
5. **照合**：同じアプリについてGitHubとチャット内容が食い違った場合は「未検証の更新」「ローカルのみの実装」などに分け、裏付け前に進捗を引き上げない。
6. **差分反映**：中央台帳の該当APP-IDだけ編集し、他のセッションによる更新を消さない。反映後はGitHubから読戻す。

### 初回棚卸し依頼（各アプリの既存チャットで1回だけ）

> このアプリを全体台帳に登録・照合します。現在の作業を次の項目で簡潔に報告してください。①アプリ名と正本リポジトリURL ②実装済み／検証済み／Web公開済みを分けた成果 ③参照できる最新コミット・PR・仕様書 ④未保存・未コミットの成果 ⑤未完了の問題と次の一手 ⑥最終確認日。わからないことは未確認としてください。**この依頼によって新しい実装・公開・変更は行わないでください。**

この報告を受けた後、台帳の中央管理担当がGitHubで裏付けを確認して反映する。すべての開発チャットに毎回貼り付ける必要はない。

### 今後の各チャットに渡す短い共通指示（必要な場合のみ）

> 本アプリの正本はGitHubです。重要な状態変化（仕様確定・試作完成・公開・検証・停止・引継ぎ）の際だけ、APP-ID、確認できた成果と証拠URL、未確認事項、次の作業を短く記録してください。通常の応答では不要です。中央台帳 `moyashimisosoup/session-deck/docs/APP_PORTFOLIO.md` は最新内容を読み取ったうえで差分のみ反映し、書込みできなければ「未反映メモ」を出してください。未検証の結果を完成と扱わないでください。

**適用範囲**：ChatGPTのプロジェクト共通指示は他のChatGPTプロジェクト／Codex／Claude Codeへ自動伝達されない。必要なら各RepoのAGENTS.mdやCLAUDE.mdからこの文書を案内する。ただし既存のAGENTS.md・CLAUDE.mdの安全・承認・運用規則を変更・上書きしない。

## GitHub公開リポジトリの自動収集（2026-10-17稼働開始）

[GitHub Actions](../.github/workflows/deploy-pages.yml)で[収集プログラム](../scripts/collect_portfolio.py)を実行し、公開GitHub REST APIから台帳A節のAPP-001〜013に紐づくRepoを観測します。台帳B節の会話ベース構想は自動収集しません。

- **定期実行**：毎週月曜日10:17 JST（UTC月曜01:17）。GitHub側で遅延する場合があります。中央台帳・UI・収集プログラム・ワークフローの変更でも自動実行します。
- **手動実行**：[Actions → Deploy Session Deck to GitHub Pages](https://github.com/moyashimisosoup/session-deck/actions/workflows/deploy-pages.yml) → **Run workflow** → `main` を選択。成功後に[アプリ台帳](https://moyashimisosoup.github.io/session-deck/portfolio.html)を再表示してください。
- **収集対象**：公開Repoの最新コミットSHA/日時、Actionsの直近Run・対象SHA、公開の未完了PR/Issueの番号・リンク・日時の一部。直近数件は**サンプル**であり総数ではありません。
- **収集しない**：PR/Issueのタイトル・本文、実チャット、非公開Repo、個人情報、資格情報、未コミット差分。APIがprivateを返すRepoは登録されていても観測情報を公開しません。
- **配信先**：Pagesの[観測JSON](https://moyashimisosoup.github.io/session-deck/data/portfolio-observations.json)。GitHubのリポジトリには生成JSONをコミットしません。**進捗の正本は引き続きMarkdown**です。
- **差分**：前回配信した公開観測JSONと最新SHAを比較し、`changed`／`unchanged`／`baseline`／`unavailable`に分類します。コミット差分は「進捗更新候補」であり、機能完成や試験成功を意味しません。
- **CI整合性**：最後のActions Runが現行コミットと一致するか別途表示します。過去の成功を最新コミットの成功と誤認しません。
- **失敗**：一部取得不能は`partial`／`error`と表示し「変更なし」にしません。全対象取得失敗時は配信を失敗にし、既存Pagesデータを維持します。
- **権限と安全**：通常のGitHub Actions `GITHUB_TOKEN`を`contents:read`に制限して使用。別Repoへ書込まず、トークンは公開JSON・HTML・ログに出力しません。

**初回稼働確認**：2026-10-17、公開Repo 13/13件の取得とJSON配信、GitHub Actions [run #38948749258](https://github.com/moyashimisosoup/session-deck/actions/runs/38948749258) 成功、公開Web画面の読戻しを確認しました。モバイル実機操作・以後の週次実行は未確認です。

### 週次の進捗確認と台帳反映

1. 台帳の「前回収集からコミット更新あり」を確認する。
2. 変更のあるカードで「この差分の検証依頼をコピー」を押し、その文章を全体管理チャットへ貼り付ける（または直接Repoを確認する）。README・コミット・PR・CI・公開URLを確認後、**重要な状態変化だけ**APP-IDの行に反映する。ボタンはコピーのみで、自動更新はしない。
3. 他チャットの未保存成果は上記の「初回棚卸し依頼」で収集する。報告内容とGitHub証拠が一致しなければ未確認のままにする。
4. 台帳の更新時は最新バージョンを取得してから差分を編集し、競合・他行の上書きを防ぐ。変更がなければコミットしない。**レビュー基準の更新は次節の規則で別管理する。**

**運用上の制限**：公開Repoが60日間非アクティブだとGitHubのスケジュールは無効化され得ます。Actionsで次回の実行を確認し、必要なら再有効化してください。週次のメール通知や全チャット自動収集は未実装です。

## 未レビュー状態の永続管理（v1.2）

前回の公開スナップショットとのSHA比較だけでは、次のスキャンで未確認の変更が表示から消えてしまう。これを防ぐため、**レビュー確認の基準**を[PORTFOLIO_REVIEW_CHECKPOINTS.json](PORTFOLIO_REVIEW_CHECKPOINTS.json)に分離した。

- 1レコードは`app_id / repo / anchor_sha / anchor_kind`。`anchor_kind=bootstrap`は**初期観測基準**を意味し、人間が内容を確認済みという意味ではない。
- 公開GitHub APIから得た`HEAD`が基準SHAと異なれば、`review_status=pending`として表示する。毎週繰り返し収集しても、基準が変更されない限り未レビューのまま残る。
- 基準と同じ場合、`bootstrap`なら「初期基準（未レビュー）」、`reviewed`なら「最終観測コミットまで明示的レビュー済み」を区別する。新規登録の未設定Repoは`untracked`、取得失敗時は`unavailable`である。
- 以前の`comparison=changed/unchanged`は「直前の収集との差分」であり、レビュー状況とは別。レビュー済みの判定に使用しない。
- フロントエンドでは未レビュー件数、絞り込み、GitHubの`BASE...HEAD`比較リンク、検証依頼コピーを表示する。**UI操作だけでは台帳も確認基準も編集しない**。

### レビューを完了させる手順

1. アプリ台帳の「未レビュー更新」を開いて、該当アプリの**差分比較**と**検証依頼のコピー**を使用する。
2. 個別Repoの変更内容・README・PR・CI・配信URL・必要な実機操作を確認し、検証できた事項と未確認事項を分ける。
3. 全体台帳`APP_PORTFOLIO.md`は、アプリの重要な状態変化がある場合だけ該当行を更新する。単にコミットが増えただけなら台帳更新は不要。
4. **変更内容のレビューを実際に完了した場合のみ**`PORTFOLIO_REVIEW_CHECKPOINTS.json`の該当`APP-ID`を更新する。`anchor_sha`を**検証したHEAD SHA**にし、`anchor_kind`を`reviewed`へ変更。`reviewed_at`（日時ISO8601、タイムゾーン付き）と`evidence_url`（確認根拠となる公開GitHub URL）を記録する。
5. チェックポイントを更新する前に最新ファイルを再取得し、他アプリのレビュー基準を失わないよう差分編集する。PR/CIを経由し、保存後に再スキャンして「レビュー済み」を確認する。
6. CIや公開・実機の未確認を残したまま「すべて完了」と誇張しない。変更内容を読んだことと、完成・公開・実機受入が済んだことは別。根拠が不足するなら**`pending`を維持**する。

### 誤操作時の復元・新規アプリ追加

- 誤ってレビュー済みにした場合は、そのレコードの`anchor_sha`を直前の根拠ある値へGitHub履歴から戻す。単純に最新HEADへ合わせる自動処理は禁止。
- 台帳A節へ新しいアプリが増えた場合、チェックポイントが無ければ`untracked`になる。公開Repoであることを確認し、`bootstrap`で**初期の観測SHA**を保存してからレビュー対象として管理する。チェックポイント作成は必ず意図的に実施する。
- 新しいレビュー基準をGitHubへ保存すると、[Pages用ワークフロー](../.github/workflows/deploy-pages.yml)が再収集する。画面で確認できるのは公開ビルドの反映後。
- **台帳とレビュー基準の責務は別**：台帳はアプリの現在地、レビュー基準は収集済みコミットの確認履歴。双方を同じ数値から自動更新しない。

## Session Deck UIの仕様

- [portfolio.html](../portfolio.html) はPagesに同梱する `docs/APP_PORTFOLIO.md` をブラウザで読み込み、A節とB節のAPP-ID行を抽出する。
- 名前・状態・「次の作業」の検索、段階フィルタ、Repo確認済み／会話ベースの区分切替ができる。
- **Markdownだけが進捗の正本**。生成JSONは観測データであり、段階・課題・次の作業を上書きしません。
- 台帳が変わるとGitHub ActionsによるPages再配信対象になる。公開URLで読めるかは別途確認する。
- 読取り不能時は空データを真のゼロ件として扱わず、GitHub正本へのリンクを残す。
- この画面は**公開情報のみ**を表示する。個人情報や非公開セッション情報を登録しない。

## 今後の拡張候補

1. 取得済みコミットやPR/Issueの参照導線を改善し、重要な差分を人間が採用するレビューUIを整備する。
2. APP-IDとSession Deckのwork_idを対応づける。ただし「アプリ」「作業」「セッション」は別エンティティ。
3. 一覧から詳細履歴、最終検証日、公開URL、変更根拠へ遷移できるようにする。
4. 項目数が増えたらYAML/JSONを**単一正本として移行**する。MarkdownとJSONの二重手入力はしない。


## 公開Repoの衛生監査（2026-10-17追加）

[GitHub Actions](../.github/workflows/deploy-pages.yml)は公開アプリ13Repoの進捗観測に加え、**両アカウントの公開Repoのみ**を毎週・手動・対象ファイルpush時に監査します。[収集プログラム](../scripts/scan_repo_hygiene.py)は提供元APIの各Repoに対し `private === false` を検証してから、安全な項目だけを出力します。非公開リポジトリは名前・件数・最終push時刻も公開JSONに載せません。

[公開Repo衛生JSON](https://moyashimisosoup.github.io/session-deck/data/repo-hygiene.json)は `same_name`、`not_in_app_ledger`、`minimal_content`、`push_30d_plus / push_60d_plus / push_90d_plus`等を候補理由として示します。**最終push日時はAIのセッション活動とは別**で、停止・完成・廃止・アーカイブ済みと自動推定しません。

[確認処理の正本](REPO_HYGIENE_DECISIONS.json)の各レコードは `repo`、`status`、人が確認した `reviewed_at`、`evidence_url` で構成します。`status`は `review_required`、`canonical`、`intentional_parallel`、`maintenance`、`out_of_scope` のいずれか。確認済みの値は時刻とRepo自身の証拠URLがなければ拒否。再スキャンが完了しても、確認済みを勝手に解除したり、Archive/Deleteすることはありません。

## 非公開イベント保存PoC

[PRIVATE_SESSION_STORE_PLAN.md](PRIVATE_SESSION_STORE_PLAN.md)を参照。2026-10-17、所有者限定のGoogle Driveフォルダ・Google Docを作成、ダミーイベントの書込みと読戻しに成功。非公開Driveの実ファイルID・会話URLは**公開GitHubに載せない**。これはコネクタを用いた試験であり、Session Deckの非公開認証UI・自動同期の完成ではありません。

