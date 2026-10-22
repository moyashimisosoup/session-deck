# APP-001 継続的な命名管理・自動化ロードマップ

版：設計案 v1 / 2026-10-22 JST。対象：既存Manifest V3拡張とSession Deckの非公開作業台帳。
最終目標：作業台帳に基づき、会話を識別し、正式名を継続管理する。作業単位の明示許可がある場合に限り、条件を満たす現在の会話へ自動適用する。
本書の保存は各機能の実装・本番有効化を意味しない。Phase 0の成功だけではプロジェクトを完了にしない。

## 1. 正本と監査時点

| 照合対象 | 2026-10-22 JSTの確認結果 |
|---|---|
| 監査開始時の最新main | `df111da4cfacf79097234d27f63e9703afda5d56` |
| 公開準備中のmain再照合 | `163996f5ebea1e39199a5a9c1834f7816b62ec98`。開始時との差分は `docs/APP_PORTFOLIO.md` のみで、命名関連ファイルに変更なし |
| mainの拡張 | manifest v0.3.0。content.js、popup.js、popup.html、manifest.jsonを確認 |
| PR #29 | v0.3メニュー互換修正、マージ済み |
| PR #35 | v0.3.1入力欄修正、Draft・未マージ。head `b390a2b810daa81815de4912a10775606008077e` |
| mainの既存命名テスト | 本監査で `node --test tests/naming.test.mjs` を実行、8/8成功・終了0 |
| 監査開始時mainの配信CI | [run 39745858896](https://github.com/moyashimisosoup/session-deck/actions/runs/39745858896) success。配信CIは命名実機検収の代替ではない |
| PR #35の命名CI | [run 39743877610](https://github.com/moyashimisosoup/session-deck/actions/runs/39743877610) success、回帰テスト10件 |
| 実機 | v0.3.1で本体UIから先に開いた改名ダイアログを利用し、拡張による入力・保存と再読み込み後の保持を確認。メニュー起動を含む全工程は未合格 |

mainのBlob SHA：content.js `607eb271757cb0452b06686bd1d9ddaaeb1fbf0c`、popup.js `04d27c62f8100d7f91aec9b1f614e279c6cbde72`、popup.html `081b9f5d812c528d6f7dedfc55501c038100081d`、manifest.json `94fc2cd13c437b7b227a51dd56e6e4f94e6fc5a7`。
既存担当の未保存変更は上書きしない。本計画は独立ブランチの文書PRとし、#35の入力欄修正と分離する。既存work_idは未確認であり、節番号を正式な作業IDとして登録しない。

## 2. 命名規則の決定

新規生成の正本を **`〖短い作業名〗MMDD・作業番号・具体的内容`** とする。共通指示側の括弧へコードを合わせる。

監査では `docs/CHAT_PROGRESS_BAR.md` に `〖古典・conj〗` の例があり、命名コンソールと拡張は `【】` を生成・検査していた。`docs/CHATGPT_PROJECT_INSTRUCTIONS.md` は共通指示への手動追記用であり、実際のChatGPT設定を読み取った証拠ではない。

- Phase 0は現行v0.3系の `【】` 検収を維持する。Phase 1で形式を `format_version=2` として切り替える。
- `【】` はlegacy v1として解析・表示できる。混在・括弧欠落は拒否。新規適用はv2を生成し、v1からの変更は差分を示して個別確認する。
- 既存会話を一括変換しない。括弧が旧形式という理由だけでは自動改名しない。
- 短い作業名は1〜20文字、内容は2〜70文字。文字数は共通処理でUnicodeコードポイント単位に揃える。改行・入れ子の括弧は禁止する。
- 共通指示の例に合わせ、括弧内の `・` を認める。括弧外の作業番号では区切り文字・空白を認めず、既存番号を切り詰めたり再発番したりしない。
- 作業番号は既存台帳のwork_idを文字列として照合する。表示に収まらない番号は確認待ちにし、別の番号へ暗黙変換しない。APP-IDとwork_idは別に扱う。
- 日付は正式名の採用日。内部は年月日を保持し実在日付を検査、表示はMMDD。継続利用や日付変更だけで改名しない。
- 共通の生成・解析・検査処理をWebと拡張へ配布し、正規表現の別管理を解消する。
- 共通指示、例、プレースホルダー、テストを同じPRで整える。ChatGPTプロジェクト設定への反映は本人操作と読戻しで別途確認し、GitHub保存だけで反映済みにしない。

## 3. 対応スキーマ（設計。実データは非公開）

既存のWorkとSessionを再利用し、命名用の情報を関連付ける。固有IDはタイトルやURL表記の差から推測しない。

| レコード | 必須の主要フィールドと制約 |
|---|---|
| WorkProfile | `namespace, app_id, work_id, revision, short_name, default_detail, adopted_date, format_version`。既存台帳と照合済みかを保持。初期段階は利用者が明示登録・確認したローカル写し |
| SessionBinding | `binding_id, platform, account_scope, native_session_id, work_ref, binding_revision, binding_source, verified_at, protected`。`(platform, account_scope, native_session_id)`を一意にし、主たる命名用work_refは1個 |
| NamingState | `binding_id, canonical_title, observed_title, observation_source, observed_at, verification, last_operation_id, last_applied_title, manual_override`。正式名と最新観測名を分離 |
| AutoGrant | `grant_id, work_ref, profile_revision, binding_scope, account_scope, device_id, mode, allowed_triggers, expires_at, revoked_at, policy_version`。作業単位の明示許可。別作業・別端末へ伝播しない |
| RenameOperation | `operation_id, binding_id, expected_previous_title, desired_title, idempotency_key, phase, attempted_at, display_verified_at, reload_verified_at, stop_code`。保存試行と確認完了は別 |
| NamingEvent | `event_id, operation_id, binding_id, kind, before_title, after_title, observed_at, device_id, grant_id, revision`。追記履歴。ユーザー申告とUI観測の出所を区別 |

`work_ref=(namespace, app_id, work_id)`。同じWorkに複数セッションを関連付けられる。会話が別作業へ移る場合は関連付け改訂と再確認を要し、以前の自動許可を継承しない。
`account_scope`は本人が選ぶローカル区分を出発点とする。Cookie・メールアドレス等から自動取得せず、ログイン変更の疑い・本人区分の確認不能時は停止する。ChromeプロファイルとChatGPTアカウントを同一視しない。

URLは必要なら非公開の任意フィールドとして保持するが、同一性はnative_session_idで照合する。URLをハッシュ化しただけでも公開可能とはみなさない。
verificationは `candidate / save_attempted / ui_observed / reload_observed / unknown / diverged`。最後の成功と現在の観測を別に保持する。
冪等キーは会話識別・work_ref・プロファイル改訂・形式版・予定名の組合せ。キーだけで成功とは判定せず、最新表示と照合する。

スキーマの型と検証制約：全レコードに整数 `schema_version=1` を付け、未知の版は拒否する。ID類・名前・stop_codeは文字列、改訂は1以上の整数、日時はUTCのISO 8601文字列、未観測の日時はnull、protected/manual_overrideはboolean。work_refは上記3文字列の組、binding_scopeは許可済みbinding_idの配列と明示した新規会話の一回限りの結び付け条件、allowed_triggersはnew_conversation/conversation_switchの集合。modeはsuggest/confirm/conditional_auto。名前は命名形式版に対応する共通検査を通す。
RenameOperation.phaseはprepared/target_checked/menu_open/editor_bound/input_set/save_attempted/ui_observed/reload_observed/stopped/unknown。NamingEvent.kindはbinding_confirmed/candidate_created/grant_changed/rename_attempted/rename_observed/manual_override_detected/restore_observed/stoppedを基本とし、版変更なしに意味を追加しない。秘密・会話本文・未知キーは拒否し、履歴のevent_idと操作のoperation_idを一意にする。タブID・文書世代は端末内の一時実行状態として分離する。物理JSON Schemaと移行コードはPhase 1/2の実装PRでこの制約を機械検証可能にする。

既存 `sessionDeckNamerRecords` はPhase 2で新版へ移行する。旧記録にaccount_scopeやwork_idがなければ未関連付けとして保持し、自動許可を付与しない。移行前バックアップと失敗時の旧データ保持を必須にする。
既存のprivate journalは未知のフィールドを拒否するため、命名イベントを既存バリデータへ無理に流さない。Phase 4で版付きの命名イベント形式または明示的な変換を追加する。

## 4. 共通構成と安全境界

既存4ファイルを段階的に発展させる。新規ファイル名は実装時に確定する予定名。フレームワーク・外部LLM・新しい全文収集基盤は追加しない。

| 構成・対象ファイル | 役割 |
|---|---|
| `content.js` | 現在会話のIDと対象行、メニュー、編集、表示確認。会話本文は扱わない |
| `popup.js / popup.html` | Work選択、候補、確認型実行、作業単位許可、停止・履歴・再確認 |
| `manifest.json` | MV3とchatgpt.com限定。追加権限は各段階の根拠とともに別レビュー |
| `naming-core.js`（予定） | 決定的な生成・解析・検査。`naming.html`からも同一規則を使う |
| `background.js / naming-state.js`（予定） | 会話検出通知、タブ間直列化、段階の永続記録、許可と中断復旧 |
| `naming-ledger.js`（予定） | 既存非公開台帳との変換・読戻し。公開サイトへ実データを送らない |
| `tests/naming*.test.mjs` | 既存Nodeテストへ追加。架空データと最小模擬DOMのみ |
| `docs/NAMING_RUNBOOK.md` | Phase 0手順と運用、停止時の復旧。既存担当と競合を調整して更新 |

公開コード・CIへ実ID、非公開URL、実タイトル、画面画像、認証情報を入れない。診断は段階・候補件数・結果コードを基本にする。
未公開API、認証Cookie、会話本文の無断収集、全履歴の巡回を前提にしない。候補の内容はWorkProfileと本人入力から生成し、会話本文の要約で補わない。
`activeTab`は作業の自動許可ではない。現在の `content_scripts.matches` によるChatGPT限定アクセスと、製品内の作業別同意は別に管理する。
MV3のworker停止に備え、許可・未完了操作・履歴をグローバル変数だけに保持しない。常駐維持のための処理は追加しない。

## 5. Phase 0 — 実機検収（継続・未完了）

- **再利用**：v0.3.0の単一会話テスト、ID照合、命名拒否、候補の一意性、UI読戻し、ローカル記録、既存Nodeテスト。
- **追加**：実機で失敗工程を確定し必要な最小修正。#35のtype省略入力対応とメニュー起動の調査を分離。検収結果を版・コードSHA・導入状態・言語別に記録する。
- **対象と権限**：4ファイル、`tests/naming.test.mjs`、runbook。権限追加なし。専用テスト会話1件だけを明示操作する。
- **テストと受入**：既存回帰＋原因に対応する回帰。ID不一致・複数候補・不正名は無変更。通常開始状態から「拡張を押す→メニュー→入力→保存→サイドバー一致→再読み込み後一致」を通す。復元も個別確認する。
- **本番実機**：導入4ファイルの版混在、正しい対象行、事前ダイアログなしの起動、保存、同一ID、保持。重要会話は使わない。対応言語・画面差の未試験範囲は明記する。
- **未検証・停止**：メニュー起動を含む全工程は未合格。v0.3.1の補助付き成功は部分合格。ID変化、候補重複、未知のダイアログ、タイムアウトは停止。保存後応答なしなら「未変更」と断定せず結果確認へ進む。
- **次工程判断**：計画・候補生成の純粋処理開発は並行可能。Phase 2以降の書込み有効化にはPhase 0の対応環境での合格と修正PRのレビュー・統合を必須とする。v0.3.0自体の成功を装わず、修正が必要なら後継版で同じ検収項目を完了する。

## 6. Phase 1 — 自動候補生成（未実装）

- **再利用**：`naming.html`の4項目と生成処理、popupの対象表示・規則検査、既存Work/Session概念。
- **追加**：共通命名処理、v2括弧互換、WorkProfileと手動確認済み関連付け、拡張内の候補生成・編集・根拠表示。初期値の作業番号を実作業の確認済み番号として扱わない。
- **対象と権限**：`naming-core.js`、popup2ファイル、contentの検査、`naming.html`、命名規則の指示文書とテスト。既存storageの範囲で動作、外部送信・新規権限なし。
- **テストと受入**：v1/v2解析、混在拒否、括弧内の中点、実在日付、文字数、作業番号、同入力同候補、採用日固定、旧記録移行を検査。Webと拡張の生成・判定が一致し、コンソールでの作成・コピーなしで候補が出る。
- **本番実機**：既存Workを選び候補・現在名・根拠を確認、編集後も規則が一致。未登録Workでは入力依頼になり、無関係な前回作業を流用しない。生成だけでは改名しない。
- **未検証・停止**：現行プロジェクト設定への反映は別確認。work_id・採用日・内容の根拠不足、複数Work候補、未対応形式は下書き／確認待ち。本文推測で埋めない。
- **次工程判断**：規則の正本と移行方法が文書・コード・共通指示の配布文で一致し、候補生成回帰と実機表示が合格。実際のプロジェクト設定の反映状況も未確認を残さない。

## 7. Phase 2 — 会話検出・確認型改名（未実装）

- **再利用**：currentId、対象行の読取り、Phase 0の改名処理、Phase 1候補、chrome.storage.local。会話を別途収集する仕組みは作らない。
- **追加**：新規会話・切替・再読み込みの検出、世代番号、候補通知、処理段階と未完了操作の永続記録、1回確認ボタン、履歴と手動変更保護。
- **対象と権限**：content、popup、予定state/worker、manifest、回帰。最初はcontent内の`popstate/pageshow/visibilitychange`と表示中だけの低頻度URL照合、必要最小限のサイドバーDOM変化を併用する。本文は読まない。SPAの履歴変更をpopstateだけで検出できると仮定しない。
- **検出仕様**：`/c/<id>`がない新規画面では候補下書きまで、IDが確定して対象行を一意に読めてから通知。同一IDイベントをまとめ、切替で旧候補・旧処理を無効化。プロジェクトURLだけからWorkを確定しない。
- **権限の判断**：worker追加自体を理由に全URL・tabs・webNavigationを一括追加しない。DOM側方式の検出漏れを測定し、必要な場合だけchatgpt.comを絞った`webNavigation.onHistoryStateUpdated`方式を別PRで評価する。APIのURLフィルタが権限自体の範囲を狭めるとは扱わない。
- **テストと受入**：新規IDなし→ID確定、A→B、戻る・進む、同ID重複、複数タブ、遅延描画、worker再起動を模擬。切替後はAの予定名をBへ適用しない。確認ボタンを押した1件だけが変わり、表示確認と保持確認が別状態で残る。
- **本番実機**：ポップアップを閉じた状態でも新規・切替を検出し、候補が現在会話へ追従すること。日本語の通常／プロジェクト会話を必須とし、追加言語は対応範囲を宣言して実機検収。未確認言語は書込み無効。
- **未検証・停止**：イベントの完全性・負荷・アカウント区分の識別は未確認。送信元origin・トップフレーム・タブ・現在IDを照合できないメッセージは拒否。全非表示タブは候補のみ、改名しない。
- **次工程判断**：対象切替・中断・重複試験と実機の一連動作に合格。履歴、手動変更保護、保存応答途絶後の照合、明示復元が動作し、自動モードはまだOFF。

## 8. Phase 3 — 作業単位の条件付き自動改名（未実装）

- **再利用**：Phase 2の検出・状態・対象照合・履歴・復元とPhase 1のWorkProfile。自動モードも同じ適用処理を通す。
- **追加**：AutoGrant、許可画面、取り消し、適用条件の判定、直列化と冪等性、失敗時の自動停止、見える自動モード表示。
- **対象と権限**：popupに「この作業で自動適用」、state/workerに許可判定と操作管理、contentに直前照合、テスト。ブラウザ権限とAutoGrantを分離し、インストール時はOFF。許可を保存しただけで過去会話を走査しない。
- **許可範囲**：Work改訂・本人区分・端末・有効期限・対象会話集合・起点イベントを確認して許可する。新規会話を対象に含める場合は「この作業の次の新規会話」など明示した結び付け範囲と世代を別途指定し、前回のWorkやプロジェクトだけで自動関連付けしない。Phase 3は単一端末・単一Chromeプロファイルで運用し、別端末には許可を複製しない。
- **適用条件（全て必要）**：許可が有効／確認済みWorkと一意に関連／既知の対応UI／現在の可視・アクティブ会話／IDと文書世代が一致／候補が一意で規則適合／現在名が許可時の期待値と一致／手動保護なし／未完了・確認待ち操作なし。タブが背景へ移ったら保留し、復帰時に全条件を再評価する。
- **頻度と手動尊重**：同じ会話・Work改訂・形式版・予定名は一度だけ適用する。自動適用後の名前が最新観測で異なれば理由を断定せずmanual_overrideとして保護し、再許可まで自動上書きしない。Work定義や形式変更も再確認対象、日付変化のみでは起動しない。
- **処理順**：永続的な操作予約→現在条件の再確認→保存試行を記録→保存1回→表示の読戻し→履歴。worker停止後は再保存せず状態を照合する。storage.localを分散ロックとは扱わず、worker単位の直列化と世代・フェンシングトークンを実装して中断時に自動継続させない。
- **テストと受入**：許可なし・失効・取消・別Work・旧改訂・旧端末・曖昧な関連付けで変更0回。許可された単一会話では保存1回。連続イベント、二重タブ、worker終了、手動改名、応答途絶、取消と保存の競合を試験し安全停止する。
- **本番実機**：テストWorkに期限付き許可→対象会話だけ1回変更→再読み込み保持→手動変更を維持→許可取消後は変更なし。試験は一件ずつ行い、重要会話や一括処理で確認しない。
- **未検証・停止**：ChatGPT画面の操作とローカル記録は単一トランザクションにできず、外部UIの原子的比較更新を保証しない。保存直前照合と直後読戻しでも防げない競合が残る場合は自動モードを出荷せず確認型を維持する。失敗・不明な変更・手動介入は当該許可を停止し、無制限再試行・無断復元をしない。
- **次工程判断**：上記の否定ケースを含む回帰と実機検収に合格し、許可・監査・取消・中断からの照合が説明可能。自動化を有効にした事実と、まだ未確認の環境を区別する。

## 9. Phase 4 — 非公開データ連携・復旧（未実装）

- **再利用**：既存Private Session Vault/Journal PoC、`scripts/validate_private_event.py`、`scripts/private_journal.py`の版検査・event_id冪等性・競合検知、既存Work/Session、Phase 3の履歴。全文収集基盤を新設しない。
- **追加**：命名イベントの版付きスキーマ、台帳アダプター、送信待ち記録、所有者認証、改訂付き書込み・読戻し、履歴ビュー、バックアップ・復元・削除と許可取消の反映。秘密の接続情報は公開コードへ入れない。
- **方式の判断**：まず既存認証済みコネクタで小規模な読書き・読戻しを検証する。ただしチャットのコネクタをChrome拡張が直接呼べるとは仮定しない。継続同期の実装前に、既存の非公開API/ブリッジへ接続できるかを評価し、必要なら最小の認証付き接続を別設計・権限審査する。Google DocのPoCを常時同期DBとして本番化しない。
- **対象と権限**：予定ledgerアダプター、非公開ストア側の対応、private journalの明示的な版拡張とテスト、manifestの接続先限定optional権限。実際の接続先・認証方式・保存期間・削除範囲・復旧目標は本番導入前の決定事項。公開Pagesの表示コードへ実データや秘密を埋め込まない。
- **複数端末の識別**：端末固有device_idと本人区分、platform+native_session_idで同一会話を対応付ける。タブIDは端末内の一時情報。iPhoneからの履歴参照は認証済み非公開ビューで行い、Chromeのローカル記録の共有と混同しない。
- **競合と復旧**：会話単位の所有端末・改訂・期限付きリースとフェンシングを非公開側で判定する。自動適用端末を1台に限定して開始し、取消状態やリースを確認できないオフライン時は自動改名を停止する。履歴同期が古い端末は読取りと確認待ちだけにする。
- **冪等性**：同一event_idは一度だけ受理し、同ID別内容は拒否。改名と台帳書込みが片方だけ成功しても再改名せず、表示の再観測と送信待ちの照合で復旧する。「改名確認済み／台帳保存未確認」を分ける。
- **復元**：元の名前を本人に示して対象IDと最新名を照合し、1回だけ戻す。過去名が通常規則外でも、当該会話の検証済み履歴に限って復元できる専用経路を設ける。他者による後続改名は上書きしない。バックアップ復元から自動許可は復活させない。
- **テストと受入**：架空データで版移行、同時書込み、再送、権限失効、通信断、取消、バックアップ読戻し、削除・復元を検査。公開成果物に実情報が混入しないことを確認する。
- **本番実機**：本人限定権限を再確認し、許可された実セッションの最小メタデータを保存・読戻し。別端末で同一会話の履歴を参照、古い改訂での更新拒否、失効後の停止、復旧を確認する。
- **未検証・停止**：認証方式、ブラウザと既存ストアの接続、同時端末運用は未確定。所有者確認不能・リビジョン競合・権限過大・取消確認不能・破損データで同期と自動適用を停止。記録の暗号化は既存ACLの代替にしない。
- **完了判断**：継続的な命名管理、作業単位許可、自動適用の限定範囲、手動保護、複数端末の識別・履歴・取消・復旧を実証し、未対応環境を明示して初めて最終目標の達成とする。

## 10. iPhoneネイティブアプリの独立評価

Chrome拡張によるChatGPT Web操作はiPhoneネイティブアプリの操作実績にはならない。
当面は正式名の候補・コピーと手動適用、非公開履歴の参照を対象とする。自動改名は、公式に利用できる連携手段・権限・対象識別・書込み後読戻しが存在するかを別調査する。
非公開APIやCookie、アプリ内部データへの侵入を回避策にしない。公式手段が確認できなければ「ネイティブ自動改名は実現性未確認／非対応」と記録し、Webの完成判定と分離する。OS・アプリ版・実機試験の証拠を別に残す。

## 11. 小PRの順序と検証証拠

1. 本書の文書PR：最新mainから独立し、実装・権限・共通指示の稼働設定を変更しない。
2. Phase 0：#35を既存担当と調整してレビュー、メニュー原因の修正は別PR。実機検収は停止条件を維持して進める。
3. Phase 1：命名規則v2・共通処理・スキーマ、その後に拡張内候補UI。指示側とコード側を同時に照合。
4. Phase 2：検出と候補通知、その後に操作段階・履歴・再読み込み後確認と復元。
5. Phase 3：許可モデル・否定ケースを先に実装し、自動モードは合格後に限定有効化。
6. Phase 4：既存非公開PoCとの接続判断、命名イベントの互換、読み取り、条件付き書込み、複数端末と復旧を分割。

各PRで変更ファイルと既存担当を確認し、他の作業の差分を持ち込まない。コード変更時は実テスト・構文・公開境界を検証し、必要な監査に許可された差分と検証結果だけを渡す。
公開CHECKPOINTには版、SHA、PR、CI、確認工程、未確認、停止理由、次の一手を記録し、実会話のURL/ID/本文・画像は非公開のまま保持する。
文書だけのPRで命名CIが自動起動しない場合は、そのpath条件を明記し、既存テストの実行結果と文書の読戻しを別に記録する。計画項目の存在は実装のテスト合格を意味しない。

## 12. 根拠と技術上の制約

- [既存操作手順](NAMING_RUNBOOK.md)、[初期構想](CONCEPT.md)、[全体ロードマップ](ROADMAP.md)、[非公開保存PoC](PRIVATE_SESSION_STORE_PLAN.md)、[共通指示の追記文](CHATGPT_PROJECT_INSTRUCTIONS.md)、[共通表示例](CHAT_PROGRESS_BAR.md)。
- [PR #29](https://github.com/moyashimisosoup/session-deck/pull/29)、[PR #35](https://github.com/moyashimisosoup/session-deck/pull/35)。
- [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)：ユーザー起点の一時的アクセス権。作業単位の自動改名同意を代用しない。
- [Chrome webNavigation](https://developer.chrome.com/docs/extensions/reference/api/webNavigation)：History API更新イベントと追加権限。採用前に必要性と範囲を確認する。
- [MV3 worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)：停止・再起動を前提に状態を永続化し、無条件の操作再開を避ける。
