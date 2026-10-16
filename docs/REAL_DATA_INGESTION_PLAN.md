# Session Deck 実データ取り込み・統合設計計画

- 文書ID: SD-PLAN-DATA-001
- 版: 0.1 / 策定日: 2026-10-17 JST
- 対象: ChatGPT / Claude Code / Codex / GitHub / Session Deck
- 状態: **計画案**（以下の連携・保存先・自動化は未実装）
- 基礎: [CONCEPT.md](CONCEPT.md)・[INTEGRATION_PLAN.md](INTEGRATION_PLAN.md)・[ROADMAP.md](ROADMAP.md)
- 原則: 既存のTradingSystemのMASTER/AGENTS/SESSION_LIFECYCLEを改変せず、必要なメタデータだけを読み取る。

## 1. ゴールと非ゴール

**ゴール**: 「どの作業を、どのAI・どのセッションが担当し、何の証拠に基づいて、最後にいつ更新されたのか」をPCとiPhoneから安全に確認できる状態を作る。全会話の複製ではなく、`work_id`中心の疎結合な作業台帳を作る。

初期段階では収集、正規化、保管、表示の4機能を分離し、1機能ずつ検証する。「作業中」「完了」「引継ぎ済み」「同期済み」は一次情報や担当者の明示入力がある場合のみ表示し、沈黙や最終観測時刻だけで確定しない。

**非ゴール（少なくとも初期3段階）**: 全チャット本文の自動収集、パスワード・APIキー・Cookieの取得、AIセッションの無人起動／終了／自動交代、claim強制解除、取引注文、証券口座操作、無承認のリポジトリ変更・Actions起動、追加の有料API利用。

## 2. 確認済みの土台と不足

| 構成 | 現状（2026-10-17時点で確認した文書・コードの範囲） | 初回作業 |
|---|---|---|
| Session Deck | `index.html` / `styles.css` / `app.js` の公開可能な架空デモ。デモの書込み先は`localStorage`。 | 実データ用の読み取り経路を**別**に設ける |
| GitHub Pages | 静的配信。GitHub ActionsでUI配信ワークフローは存在し、ユーザーから公開確認の報告あり。 | 実データをデプロイ成果物に含めない |
| TradingSystem | `scripts/session_lifecycle_monitor.py`。Claude CodeのStop hook、引継ぎ・claim・resume-check、Codexの手動`scan --codex`が既存Runbookに記載。 | アダプターから既存出力を読取り。停止・変更しない |
| ChatGPT | 通常のチャットを公式APIで網羅取得／改名できる前提は置けない。 | 最初はURL＋正式名を手動登録。後に任意拡張を検証 |
| 他プロジェクト | 対応する監視状態の存在は未確認。 | プロジェクトを自動検出済みと見なさない |

TradingSystemで参照した`MASTER.md`は版`2026-10-14b`、更新日`2026-10-15`。最新版の規則・証跡と矛盾したときは収集処理の導入を止めて確認する。

## 3. 設計上の最重要な区別

- **Project**: リポジトリや業務のまとまり。
- **Work**: 固定の`work_id`を持つ仕事。担当AIが交代しても同一ID。
- **Session**: プラットフォーム固有の作業セッション。1 Workに複数Session、1 Sessionに複数Workを許容。
- **Claim**: 1 Workへの書込み担当権。元システムのclaimを**観測**するだけで、Session Deckが代理で取得・解除しない。
- **Evidence**: コミットSHA、PR、CI結果、観測ログ、検証記録、引継ぎファイルへの参照。説明文と証拠を混同しない。
- **Event**: 非破壊で追記する状態変化の記録。観測値とUI用の派生状態を分離する。
- **Handoff**: 引継ぎ情報。次セッションでGit状態・テスト・更新日を再確認するまで「確認済み」としない。

正本識別子はサービス側のチャットIDでなく`work_id`。サービス別IDは`platform + source_scope + native_session_id`を内部で対応づける。ネイティブIDが取得不能な場合は別のローカル内部IDを作成し、`unverified`とする。タイトル一致だけでは同一セッション・同一作業に統合しない。

## 4. データ分類・公開境界

| 区分 | 例 | 保存・配信方針 |
|---|---|---|
| A: 公開可能 | UI、公開スキーマ、架空のデモ、一般設計 | 公開GitHubリポジトリとPages可 |
| B: 非公開業務メタデータ | 実Work/Session ID、実会話URL、プロジェクトの内部名、作業進捗、引継ぎ要旨 | 認証付き非公開層のみ。必要最小限 |
| C: 高機密の業務・個人情報 | 非公開Issue本文、口座・市場の実データ、私的な会話本文、未コミット差分 | **デフォルトでは取り込まない**。別途データ分類と権限審査が必要 |
| D: 認証情報 | PIN、パスワード、APIキー、OAuthトークン、Cookie、MFA | **収集・保存・共有禁止** |

重要: 公開PagesのJSコードは誰でも取得できる。匿名閲覧可能なAPIのレスポンス、画面HTML、公開ビルド、Actionsログ、公開IssueにB〜Dを出さない。`localStorage`は認証境界ではなく、公開デモ用と実データ用のキー／オリジンを分離する。ブラウザからのJSON出力には入力内容が含まれる。

## 5. 保存構成の候補と決定ゲート

| 選択肢 | 利点 | 制約 | 採用条件 |
|---|---|---|---|
| A. ローカル私設API＋Tailscale | 既存常時起動PCを活用し費用を抑えやすい | PC停止・スマホネットワーク・Tailscale認証に依存 | 初期の**非公開パイロット**に推奨。UIも私設オリジンで配信すると安全設計が単純 |
| B. 公開Pages＋認証付きクラウドAPI/DB | PC停止時もスマホ表示ができる。UI配信をGitHubに維持 | 認証、ユーザー単位のアクセス制御、CORS、無料枠・維持費の確認が必須 | リアルタイム同期を一般提供するときに評価 |
| C. 非公開JSONを公開リポジトリへpush | 構成が簡単そうに見える | 内容・履歴・配信で情報漏洩を防げない | **不採用** |

**暫定提案**: ①まずローカルで非公開のインポート検証 → ②Tailscale上の非公開Webでユーザー本人が確認 → ③将来、必要になれば認証付きクラウドへ切替。GitHub Pagesのデモサイトは公開状態を保ち、実データを表示しない。公開Pagesから私設APIへアクセスできるとは前提にしない（CORS、ネットワーク分離、ブラウザのPrivate Network Access制限等を検証する）。

選定ゲート: 本人認証、権限取消、バックアップ、復元、ログ、コスト、スマホからのHTTPS接続、失敗時の安全な停止が実測・実証できること。いずれも未確認のまま「接続済み」としない。

## 6. ソース別の収集仕様（初期はすべてREAD ONLY）

### 6.1 GitHub（最初に実データを試す候補）

- **対象**: ユーザーが許可したリポジトリの`repository_full_name`、Issue番号/状態、PR番号/状態、ブランチ/commit SHA、Actions workflow/runの`status`/`conclusion`/`updated_at`。
- **権限**: 公開リポジトリは匿名readを原則とする。非公開リポジトリにはバックエンド側の最小読取り権限が必要。認証情報はUIコードへ埋めない。
- **頻度案**: 手動更新を先に実装。続いて更新頻度10分を**候補**として計測し、レート制限／変更頻度に応じて調整。ページネーション、ETag/条件付き取得、429/5xxのバックオフを設計。
- **対応づけ**: Issue本文/PRラベルの明示`work_id`があれば関連づける。名称やブランチだけの類似性は「候補」として表示し、人間に承認を求める。
- **証拠**: リポジトリ、対象URL、取得時刻、`head_sha`、ワークフロー実行IDを記録。古いCIの成功を最新コミットの成功と混同しない。

### 6.2 Claude Code（既存機構の再利用が優先）

- **起点**: 既存`data/session_lifecycle/sessions/<source>_<id>.json`、`events.jsonl`、handoff参照。現在のファイル形式・更新頻度・所在を**実機で検証してから**アダプターを作る。
- **取得**: セッションID、モデル識別子、観測日時、段階、関連`work_id`、既存claimの観測状態、引継ぎ参照（ある場合）。
- **禁止**: トランスクリプト本文、プロンプト、秘密情報を収集しない。既存Stop hookや設定を無断で上書きしない。
- **拡張候補**: 公式`SessionStart`/`Stop` hookはイベントを扱え、`SessionStart`の`sessionTitle`で名前を設定できる。ただし既存カスタム名がある場合は保護する。既存監視との二重発火や遅延を試験してから導入する。
- **対象範囲**: TradingSystem以外のClaude Code作業は現時点で検出済みと扱わず、明示登録後に監視する。

### 6.3 Codex

- **起点**: 既存の`session_lifecycle_monitor.py scan --codex --no-write`など、読み取り診断を優先。実ファイル形式や提供機能を観測して契約化する。
- **取得**: ネイティブIDが得られれば利用。取得不能なら`unknown`を保持。コンテキスト消費・モデル・段階は実測のみ。
- **注意**: 既存Runbookでは定期scanとCodexへの警告経路は未実装と記録。導入済みと表示しない。ログ探索の範囲を全PCへ広げない。
- **動作**: 定期実行の登録、CLI再起動、ログ書込みはこの設計フェーズでは行わない。

### 6.4 ChatGPT

- **第1段階（手動）**: チャットURL、ユーザーが指定した正式名、対応`work_id`、表示名を本人操作で登録する。URLの形式を検証し、外部リンクを安全に表示する。
- **第2段階（任意拡張）**: ChatGPT Web版でユーザーが選択した会話からURL/ID/表示タイトルを取り込む。最小ホスト権限、明示操作、停止/削除機能が前提。
- **第3段階（独立機能）**: タイトル変更は別のwrite権限。手動命名の保護、改名前のプレビュー、再取得確認、失敗時復元を満たした場合にだけ実装。
- **非採用の前提**: OpenAIのAPI上のConversations/Agents SessionsとChatGPT通常チャットの履歴を同一APIで取得できるとは仮定しない。アカウントデータの一括エクスポートには機微情報が含まれうるため自動アップロードしない。
- **鮮度**: ブラウザ拡張からの最終観測日時と推測される「最終メッセージ時刻」を混同しない。

## 7. 正規化スキーマ（最初の案）

共通の`schema_version`を整数で持ち、ソースごとのrawを消さずに**非公開領域**に格納する。ダッシュボードには以下の最小レコードを投影する。

```json
{
  "schema_version": 1,
  "source": "github",
  "source_scope": "public-repo-example",
  "native_id": "issue:42",
  "event_type": "work_reference_observed",
  "event_id": "github:public-repo-example:issue:42:revision-3",
  "work_id": "SD-004",
  "observed_at": "2026-10-17T00:00:00Z",
  "source_updated_at": "2026-10-16T23:58:00Z",
  "verification": "source_observed",
  "source_ref": "https://github.com/example/example/issues/42",
  "state": "open",
  "redaction_profile": "metadata_only"
}
```

- `source_updated_at`（元の更新時刻）と`observed_at`（収集時刻）は必ず分離。
- `event_id`はソースID＋改訂番号／観測イベントIDから安定的に生成。重複取り込みは同一イベントとして処理。
- 同一sourceの更新順が逆転しても最新値を古い値で上書きしない。非単調な変化はEvent履歴に残す。
- `unknown`、`not_observed`、`blocked`、`stale`、`source_error`は明示し、nullを「待機中」と読み替えない。
- 形式違い・秘密の混入・巨大入力は検証で拒否。拒否ログに入力本文を残さない。
- 保存時は最小権限とデータ分類を維持。実URL等は公開サンプルへコピーしない。

## 8. 状態機械と鮮度の意味

**実行状態**: `observed_active / observed_idle / observed_ended / not_observed / unknown`。

**作業状態**: `planned / active / waiting_review / handoff_ready / blocked / completed / unknown`。元セッションの応答停止・利用量上限を理由に作業完了へ遷移させない。

**取り込みパイプライン状態**: `healthy / delayed / failed / permission_denied / paused / not_configured`。最終成功日時、最終試行日時、直近の失敗理由を持たせる。

鮮度閾値はソース別に設定し、**設計候補**として GitHub 15分、ローカルイベント 5分、ChatGPT手動登録は期限を設けず「手動・最終確認日時」を常時表示する。閾値は実測後に決定。古いレコードは灰色で「確認待ち」とし、勝手に停止・完了・未着手に変更しない。

## 9. パイプラインとエラー処理

`source adapter → validate → redact → normalize → dedupe → private store → derive projection → authenticated UI` の順で処理する。

1. **取得**: ソース毎に独立。権限不足・遅延・429・変更なしを区別する。
2. **検査**: schema、サイズ、日付、URL、scope、認証情報らしいパターンの混入を拒否。false positive/negativeの対策として「フィルタのみで安全」とは断定しない。
3. **秘匿化**: ホワイトリストでメタデータのみ抽出。生の会話・認証情報はログと保存を経由させない。
4. **同一性**: source_key + native_id + revision で冪等化。`work_id`との紐付けが未承認なら保留。
5. **保存**: 書込み失敗でイベントを失わないよう小さな一時キュー・再試行を設計。ただし一時キューも非公開領域に限り、サイズ/期限を制限。
6. **投影**: 認証済み閲覧者に必要なフィールドだけ返す。署名・認可のないリクエストは拒否。
7. **証跡**: インポートバッチID、件数、成功/拒否/重複、収集元、検証日時、元のバージョンを記録。秘密値は記録しない。

例外はソース毎に局所化。GitHub取得が失敗してもClaude Codeの既存監視を止めない。障害時は以前のデータを消さず、鮮度切れを表示。

## 10. ローカルデモからの移行

現在のデモ`localStorage`には架空データとユーザー入力が混在しうる。**自動移行しない**。まず`demo`と`private`をUI・保存先・URLで分離し、「実データモード」ではデモ投入を禁止する。ユーザーの意思による明示エクスポート／インポートのみを提供し、個人情報・機密情報の有無を確認する。バックアップ/復元/破損データ検出をテストしてから移行を提供する。

`schema_version`の変更時は旧レコードを読み取り可能な状態で保管し、移行ツールにDry Runと件数比較を付ける。初回移行の完了条件は「件数・ID・リンク・日付・権限と、元データへの復元」が一致すること。

## 11. 作業パッケージと依存関係

| ID | 作業内容 | 完了ゲート（証拠） |
|---|---|---|
| DATA-01 | 収集範囲・非公開情報の分類、実データ保管先を選定 | 脅威モデル、権限表、費用・停止時動作、スマホ接続の実測 |
| DATA-02 | `Work/Session/Event/Evidence`のJSON schema v1を確定 | 許容・拒否サンプルと自動バリデーション |
| DATA-03 | GitHubの公開リポジトリread-onlyアダプター | Issue/PR/CIの5件以上の取得例と`source_ref`/鮮度、rate-limitの試験 |
| DATA-04 | 非公開ストアと認証済みAPIの最小構成 | 本人は読める／未認証者は拒否、バックアップ・復元成功 |
| DATA-05 | TradingSystemの監視結果を読み取るアダプター | 現行JSONの形式と日時の読戻し、既存処理への副作用ゼロ |
| DATA-06 | Codex状態を読み取るアダプター | 手動scanの実測例、状態不明の正しい表示 |
| DATA-07 | ChatGPTの手動セッション登録 | URL/ID、命名差異、未確認、削除の試験 |
| DATA-08 | UIへ投影、同一Workのセッション統合 | 出所と最終観測日時、未確認、権限で非公開項目が漏れない |
| DATA-09 | 失敗復旧、重複・順不同・権限取消試験 | 二重登録ゼロ、旧状態の誤上書きゼロ、失敗表示 |
| DATA-10 | 任意ブラウザ拡張・自動改名PoC | ユーザー操作/同意、改名後読戻し、手動名の不変更、復元確認 |

**順序**: DATA-01 → DATA-02 → DATA-03（公開GitHubで安全に試験）→ DATA-04 → DATA-05/06/07 → DATA-08/09 → DATA-10。プライベート接続の前にDATA-04が必須。DATA-03は公開情報だけで非公開APIを使わず独立実験可。

## 12. 受入・性能・運用チェック

機能: WorkとSessionが多対多で対応、`work_id`でセッション切替を横断確認、名前差異が分かる、引継ぎの証拠が表示できる。安全: 匿名ユーザーが実データにアクセス不能、UIとGitHub Pagesの公開ビルド・ActionsログにB〜D情報がゼロ、ローカル・非公開データを誤って公開しない。

信頼性: 連続2回の同一取り込みでも重複なし、順序逆転でも古い状態に戻らない、ソースごと障害を独立表示、同期再開後に追いつける。性能: 代表100 Work / 500 Session / 3000 Eventの**架空データ**で操作と表示の応答時間を計測し、基準値を実測から確定する。スマホでの閲覧、PC停止時、時差、オフライン、ストレージ容量上限を試す。

リリース条件: 実作業名の無断公開がない、サービス別最小権限が確認できる、操作ログと拒否理由が追える、バックアップ/復元が成功し、ロールバック手順が検証されていること。状態の根拠が取れない場合は`未確認`と表示する。

## 13. リスク・未決定事項

- **最大リスク**: 公開静的UIと非公開データの混線。回避策はオリジン/保存先の分離、非公開APIの認証/認可、公開アセット検査。
- **仕様変化**: ChatGPTブラウザDOM・Claude Code/Codexログ形式は変わる。アダプターごとにversionと検証用fixtureを置き、破損時はそのアダプターだけ停止。
- **対象の曖昧さ**: 同じタイトルの複数セッションがある。ID優先、`work_id`紐付けは人間承認。
- **稼働の誤認**: 停止/無応答/未観測が混ざる。生の観測イベントとUI上の状態を分ける。
- **端末/費用**: Tailscale・PC常時稼働の信頼性と、認証クラウド導入時の費用は未評価。
- **権限**: 情報共有の包括的承認は、認証情報の取得、注文、無断削除、追加API課金、既存コード/CI/設定の変更の承認ではない。

## 14. 出典・読戻し時に再確認する参照

- GitHub Issues REST: https://docs.github.com/en/rest/issues/issues
- GitHub Actions workflow runs REST: https://docs.github.com/en/rest/actions/workflow-runs
- Claude Code Hooks（SessionStart/Stopとsession_id, sessionTitle）: https://code.claude.com/docs/en/hooks.md
- ChatGPTデータエクスポート: https://help.openai.com/ja-jp/articles/7260999-how-do-i-export-my-chatgpt-history-and-data
- GitHub Pages公式: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- TradingSystemの運用正本: https://github.com/moyashimisosoup/TradingSystem/blob/main/MASTER.md
- TradingSystemセッション寿命Runbook: https://github.com/moyashimisosoup/TradingSystem/blob/main/docs/runbooks/SESSION_LIFECYCLE.md

本書は設計と着手順を決める文書で、実データの収集・アカウント認証・同期・改名・注文を許可したり実施したりするものではない。
