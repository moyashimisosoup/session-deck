# Session Deck 非ローカル・セッション運用プロトコル v1.0

策定：2026-10-17 JST／**実装状況：設計と手動開始テンプレート。全サービスの自動計測・同期は未実装。**  
正本：この運用契約。詳しい個別作業は各RepoのAGENTS.md、CLAUDE.md、既存TradingSystem runbookが優先。  
関連：[実データ連携計画](REAL_DATA_INGESTION_PLAN.md)／[公開アプリ台帳](APP_PORTFOLIO.md)／[Repo整理候補](REPO_HYGIENE_20261017.md)

## 1. 目指す画面

\`APP-ID｜作業名｜担当AI｜状態｜開始｜最後の記録｜次の一手\`  
詳細を開くと \`work_id / session_id / 終了 / 根拠 / CHECKPOINT・HANDOFF / ブランチ / CI\` を閲覧できる。ただし非公開の実セッションは**本人認証した非公開画面のみ**で表示する。

### 3つの日時を分ける

| 項目 | 意味と計測方法 | なければ |
| --- | --- | --- |
| \`started_at\` | チャット開始をプラットフォーム/ユーザー/記録ツールが**確認した**日時 | \`未確認\` |
| \`last_event_at\` | そのセッションにチェックポイントや状態更新が**実際に保存された**日時 | \`未記録\` |
| \`ended_at\` | 明示的な終了・引継ぎ完了イベントの日時。無応答だけで勝手に閉じない | \`未終了／終了未確認\` |
| \`source_updated_at\` | GitHub最終コミット・Claude Stop hookなどソース自身の時刻 | \`未取得\` |
| \`observed_at\` | Session Deck側がそのソースを読んだ時刻 | \`未観測\` |

**重要**：「GitHub最終コミット」「AIチャットの最終稼働」「Session Deckの最終観測」は別。現在の公開アプリ台帳に実セッションの開始・終了を補完して表示することはしない。

## 2. ID・命名

- \`app_id\`：APP-001のような全体ポートフォリオの**アプリID**。1つのアプリに複数の作業。
- \`work_id\`：担当AI・チャットが変わっても引き継ぐ**一意の作業ID**。例 \`APP-001-W003\`。
- \`session_id\`：そのチャット／Codex／Claude Codeの記録ID。サービス固有IDが取れなければ発番し、\`native_id_verified=false\`を付与。タイトルはIDの代用にしない。
- **推奨チャット名**：\`〖短い作業名〗MMDD・NN・具体的内容\`。例：\`〖台帳整理〗1017・03・重複監査と引継ぎ\`。
- TradingSystemで利用中の \`開始日・【作業名】・[作業番号]・内容\` 形式も**入力互換として許容**。既存チャットを大量に改名せず、両形式を同じ\`work_id\`へマッピングする。
- ChatGPTの実際のUIタイトルは通常の会話から**自動変更できると仮定しない**。初回の推奨名を表示し、必要ならユーザーが変更する。Session Deck内部の\`display_name\`と実際のタイトルを分ける。

## 3. 開始／中間／終了：4イベントだけ

| イベント | 記録する事実 | いつ実行するか |
| --- | --- | --- |
| \`START\` | APP-ID、work_id、セッション識別、推奨名、記録できる開始時刻JST、目的・次の一手、現行Repo/branch | 新しい作業チャットを始めたとき**1回** |
| \`MILESTONE\` | 設計確定、コミット、PR/CI、試作・配信・テストの証拠URL、変更後の次の一手 | **意味のある状態変化時だけ** |
| \`CHECKPOINT\` / \`HANDOFF\` | 完了済み、未確認、現在のRepo/branch/HEAD、未コミット差分の有無、次の1操作、次セッションに必要な参照先 | 長文化・コンテキスト圧迫・担当交代の**必要時のみ** |
| \`END\` | 実際に終了・保留・担当交代と決まった時刻、最後の証拠、未完了、引継ぎ先 | **明示終了を行った時だけ**。沈黙・最終pushから推測しない |

**非ローカルChatGPTへの表示例（最初と区切り時のみ）**

> セッション　\`〖台帳整理〗1017・03・重複監査と引継ぎ\`  
> APP-001 ／ Work \`APP-001-W003\` ／ 開始：2026-10-17 09:38 JST（記録例）  
> 状態：進行中 ／ 最終記録：未保存 ／ 次：重複Repoを根拠照合

日付は**書式例**であって、このチャットの実開始時刻を認定するものではない。時刻・IDを取得できない場合は\`未確認\`とする。毎回の回答にこのカードを表示して会話の面積を使わない。

## 4. TradingSystemの寿命管理から再利用すること

TradingSystemで確認できた \`AGENTS.md\` と \`docs/runbooks/SESSION_LIFECYCLE.md\`（2026-10-14版）の考え方を引用して適用する。

1. 測定可能なClaude Code／Codexセッションでは、元の\`L = min(150000, floor(0.75 × context_window))\`と\`CHECKPOINT=0.67L / HANDOFF_READY=0.8L / ROTATION_DUE>=L\`の段階を、**元システムの監視値が確認できる場合にのみ**利用。モデルごとの窓・コンパクション・利用量は実際のテレメトリに従う。新しく架空の「コンテキスト残量」を表示しない。
2. \`CHECKPOINT\`：必要なGit事実と未完了を短く記録。長文要約でコンテキストを余計に消費しない。
3. \`HANDOFF_READY\`：今の作業単位を区切って引継ぎ記録を作る。
4. \`ROTATION_DUE\`：新セッションへの移行を提案。**強制終了・自動交代はしない**。
5. 新セッションは\`resume-check\`に相当する再確認を必須にする。HEAD・PR・CI・公開URLは**今の状態を読戻し**、前セッションの自己申告を鵜呑みにしない。
6. 同一\`work_id\`の書込み競合を避ける。TradingSystemの\`claim\`は既存の管理者・実装に任せ、Session Deckが代理で解除しない。

**ChatGPT通常チャットではコンテキスト利用量と上限を自動取得できる前提を置かない**。\`0.67L\`等を推定適用せず、作業が長くなった・別チャットへ移行する・重大な決定があったなど**イベントを基準**にチェックポイントを保存する。アプリ側の「72%消費」など根拠のない表示は行わない。

### 非ローカルでの引継ぎの最小形

- 目的／App・Work ID／担当の作業
- 保存済み（コミット・PR・CI・Pages）とその証拠URL
- 未保存・未コミットの成果（ある場合）、未確認事項
- 現行branchとHEAD。取得不能は\`未確認\`
- 次に実行する**具体的な一手**と、その行き先（RepoやPR）
- 前回の引継ぎ日時（検証済みのみ）

これだけを「コンテキスト復元の核」とし、過去会話全体の貼り直しをしない。

## 5. セッションイベントの最小形式（非公開保存のみ）

現行の [validate_private_event.py](../scripts/validate_private_event.py) が実際に受け入れるスキーマを正本とする。ここでは**架空データ**を示す。旧設計案の `name` / `source` / `progress` / `evidence` / `sync_status` は**現在のイベントv1スキーマにはない**ため、実データとして混ぜない。

```json
{
  "schema_version": 1,
  "event_id": "DEMO_CHECKPOINT_001",
  "event_type": "CHECKPOINT",
  "app_id": "APP-001",
  "work_id": "APP-001-W0003",
  "session_id": "example-only-not-a-real-chat",
  "platform": "chatgpt",
  "event_at": null,
  "recorded_at": "2026-10-17T00:54:52Z",
  "time_verification": "not_observed",
  "native_id_verified": false,
  "privacy_classification": "private_session_metadata",
  "summary": "架空のCHECKPOINT。実ユーザーの作業履歴ではない。",
  "next_action": "現在のGitHub HEADとCIを確認する",
  "evidence_urls": []
}
```

- `event_at` は確認できた元イベント日時のみ。確認できない場合は`null`にして`time_verification=not_observed`を明記。ChatGPT通常チャットの開始日時を推測しない。
- `recorded_at` はイベントメタデータの作成・記録準備時刻。**実際にDriveへ保存できた時刻とは別**。永続化成功は条件付き書込みとDoc読戻しで確かめる。
- `started_at`は確認できたSTART、`ended_at`は確認できたENDの`event_at`からだけ導出する。CHECKPOINTや無応答から開始・終了を補完しない。
- イベントは変更・削除せず追記する。同一`event_id`＋同一内容は何もしない、異なる内容のID重複は衝突として拒否する。
- [private_journal.py](../scripts/private_journal.py)は認証済みDocの本文を渡されたときだけ復元し、`work_id`単位でHANDOFF／最新の一手を表示用に派生する。**GitHub Pagesには記録本文を配信しない**。
- 既存のGoogle Drive owner-only疎通試験、古いrevisionによる書込み拒否、架空3イベントの保存・復元は[非公開保存PoC](PRIVATE_SESSION_STORE_PLAN.md)参照。
- 保存先・書込権限がない場合は「保存済み」と言わず、**未保存の引継ぎメモ**を返す。非公開のDoc実IDを公開RepoやActionsへ記録しない。

## 6. データ公開境界と段階的導入

1. **今回導入するもの**：この公開の運用規則と、GitHubの公開Repoに限った整理候補の棚卸し。既存台帳から運用手順へ移動できるUI導線。
2. **次の小さなPoC**：セッション開始・引継ぎテンプレートをチャットへコピーし、実際に非ローカルチャット1件で\`START→CHECKPOINT→HANDOFF\`を完走する。タイトル変更と自動時刻取得を保証しない。
3. **非公開ストア**：認証・アクセス制御・バックアップ／復元・費用を確認した上で、非公開のセッションイベントだけを記録。公開Pagesには実Sessionを配信しない。
4. **Session Deckの非公開ビュー**：アプリのRepoメタデータ（公開）とSessionイベント（認証後）を\`work_id\`で結合し、最終観測・記録・次の一手をソース付きで表示。自動取り込みはClaude Code/Codexの既存出力をread-only利用から開始。
5. **運用安定後**：Repo側のAGENTS.md/CLAUDE.mdに以下の5行を必要に応じて追記。全Repoへ一斉自動挿入はしない。

\`\`\`md
- 作業開始時は APP-ID / work_id と推奨チャット名を確認する。
- 重要な状態変化・引継ぎ時だけ Session Deck の短い記録を残す。
- 開始/終了時刻は観測できたものだけ記録し、GitHubコミット時刻と混同しない。
- コンテキスト飽和が疑われたら証拠・未完了・次の一手をCHECKPOINT化する。
- 詳細: https://github.com/moyashimisosoup/session-deck/blob/main/docs/CLOUD_SESSION_PROTOCOL.md
\`\`\`

**権限**：TradingSystemの既存runbook・AGENTS.md・監視スクリプト・GitHub Actions実行権限をこの仕様が上書きすることはない。金融取引・認証情報・既存claimの変更・非公開データの公開を許可するものでもない。
