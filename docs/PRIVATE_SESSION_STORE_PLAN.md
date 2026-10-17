# Session Deck 非公開イベント保存PoC：運用と検証

版：v0.1 / 2026-10-17  
状態：**Google Driveの所有者限定フォルダと試験用Google Docで、作成・書込・読戻し・権限読取りが成功。実チャット自動同期は未実装。**

## 非公開ストアの用途と構造

- 専用保存先：接続済みGoogle Driveの **「Session Deck - Private Session Vault」** フォルダ。
- 現在の保存形式：配下の **「Session Deck | Private Event Journal | Pilot」** Google DocにイベントJSON文字列を1行ずつ保存する小規模PoC。
- **重要：フォルダID・文書ID・リアルな会話URL・実session_idはこの公開RepoやPagesには記載しない。** 保存先の実URLは認証済みのGoogle Driveで本人が確認する。
- 2026-10-17、フォルダと文書のメタデータ取得により **shared=false、権限に所有者1名のみ、文書はフォルダ配下** と検証。Google Docsの書込み・テキスト読戻しに成功。最初のレコードは「PROBE / not_a_real_session」と明記した試験用ダミー。
- 現状は**専用プライベート保存先の疎通試験に成功**した段階。ChatGPTの実セッションを自動検出・記録・検索するアダプタや、他端末の非公開管理UIは未実装。Google Docは大量イベント向けDBではない。

## 書込みの必要条件

1. 本人が **START / MILESTONE / CHECKPOINT / HANDOFF / END** を必要とするタイミングで指示するか、各チャットの共通規則に従い重要な状態変化が確認できる。
2. **公開Repoのコード・中央台帳に実イベントを置かず**、非公開Docを接続経由で読んでから更新する。
3. event_idの重複が無いことを確認。イベントは削除・上書きせず追記とする。誤記は訂正イベントとその理由で管理する。
4. \`scripts/validate_private_event.py\`のスキーマに従う。未知のキー、トランスクリプト全文、認証情報、長すぎる本文を受理しない。ローカル検証／CIテストは**ダミーの架空イベントだけ**で実施。
5. \`recorded_at\`は**実際に書込完了した時刻**と区別できる値、\`event_at\`は**確認できた時刻**のみ。未確認ならnullと\`time_verification=not_observed\`を使い、開始・終了時刻を生成しない。
6. 競合リスクがあるため、Google Docsの\`requiredRevisionId\`で前回読取時のrevisionを条件にして追記する。更新が競合したら再読取・event_id検査・再計画を行い、無条件リトライしない。
7. 更新後にGoogle Docの本文を読戻し、該当event_idが正しく1件だけ存在することを確認してから「保存済み」を宣言する。
8. 記録は短いメタデータに限定。秘密、口座・金融取引、学校の個人記録、非公開ソース全文を含めない。

## イベント例：完全な架空データ

\`\`\`json
{
  "schema_version": 1,
  "event_id": "EXAMPLE_EVENT_001",
  "event_type": "CHECKPOINT",
  "app_id": "APP-001",
  "work_id": "APP-001-W0003",
  "session_id": "demo_not_a_real_session",
  "platform": "chatgpt",
  "event_at": null,
  "recorded_at": "2026-10-17T00:54:52Z",
  "time_verification": "not_observed",
  "native_id_verified": false,
  "privacy_classification": "private_session_metadata",
  "summary": "試験用架空データ。実際の引継ぎではない。",
  "next_action": "テスト結果を確認する",
  "evidence_urls": []
}
\`\`\`

**この例を実イベントとして保存しない。** このドキュメントも公開GitHubの一部なので、記載は架空例のみ。

## 本番運用の前に必要なゲート

| Gate | いまの状態 |
| --- | --- |
| Google Driveが非公開であること | 2026-10-17、所有者限定権限・shared=false確認 |
| Docにダミーを書いて読戻し | 成功 |
| イベント形式・キーの検証 | Python標準ライブラリによるオフライン検査とCIを追加 |
| 実イベントの二重登録防止 | 手順を規定、複数AIの同時書込み実機テストは未実施 |
| セッションごとの開始時刻自動検知 | **未実装** |
| ChatGPT/Codex/Claude Codeのセッション本文・メタデータ自動収集 | **未実装** |
| 非公開管理UIからの検索・編集 | **未実装** |
| 権限取消、バックアップ・復元、監査ログ | **未検証** |
| 公開ページとの隔離 | 公開Actionsの配信許可リストにGoogle DriveのID・本文を含まない。公開の依存関係なし |
| 無人での全リポジトリ・全セッション同期 | **未実装**。運用状況の事実を過大表示しない |

将来的にイベント数が増えたら、Google Docの追記方式は破綻しやすいので、非公開DB／アクセス制御付きAPIへ移す。Google Docsは小規模な保存・復元PoCに限定する。認証トークンを公開静的HTML・クライアントJavaScript・GitHub Actionsシークレットとして無断転記しない。

## 操作手順

- 開始は[公開アプリ台帳](../portfolio.html)のアプリ詳細「開始指示をコピー」、引継ぎは同画面下のテンプレートを使う。実イベントの機微情報は**公開画面に貼り付けない**。
- 保存するチャットに対しては「今回のAPP-ID / work_idと確認した事実に基づき、非公開Google DriveのSession Deckイベント台帳へCHECKPOINTを保存し、読戻し確認して」と依頼できる。
- 保存できなかった場合は、チャットに **未保存の引継ぎメモ** を出す。「保存済み」と偽らず、手動対応を明示。
- 複数AIの並行セッション間では、同一work_idを別AIが同時に書込むと競合するため、GitHubブランチ・PRの一担当原則を優先し、Driveイベントの書込みも楽観的revision照合を行う。


## v0.2: スナップショット復元と競合検知の実証（2026-10-17）

- [private_journal.py](../scripts/private_journal.py)で **Doc段落の`SD_EVENT_V1 `接頭辞を持つJSON行**からイベントを復元するオフライン処理を実装した。従来の人間向け説明・歴史的な`PROBE`はイベントに混ぜない。
- 同じ`event_id`＋同一ペイロードは**追記不要**。同じIDで内容が違えば失敗として停止し、既存イベントを上書きしない。
- 保存時は、現在のGoogle Docのリビジョンを読んだうえで`requiredRevisionId`を指定し、**他者の更新後に古い状態で追記することを防ぐ**。更新後のDocの内容を読み、同一イベントを**ちょうど1件**確認して成功と判定する。
- Work単位でSTART、CHECKPOINT、HANDOFF、ENDを読み直して、直近の記録上の状態・次の一手・Git証拠・開始／終了の**確認された時刻だけ**を復元する。HANDOFFから無条件にENDを推測せず、観測できない`event_at`はnull。
- IDの重複、壊れたJSON、意図しないEND後の追記、複数セッションIDの混同を回帰テストで防ぐ。

### 実際に完了したPoC操作

1. 所有者限定の既存**試験用**Google Docに、架空の `START → CHECKPOINT → HANDOFF` の3イベントを**順次条件付きで追記**。
2. 各回、Docの**最新revisionを読み、requiredRevisionIdを指定し、保存後に読戻し**。3件すべて1回ずつ保存成功。
3. 古いrevisionを指定した追記を意図的に実行したところGoogle Docsが**拒否**し、記録の本文・revisionが変化しないことを確認。
4. 所有者限定の別のGoogle Docへ、この3件の記録から**手動生成した「Work Resume View | Pilot」**を保存。HANDOFF／次の一手／開始終了未確認の区別を読み戻し、フォルダ配下・所有者のみの権限を検証。
5. これらはすべて架空の`APP-001-W9999`と`synthetic-session-never-actual`であり、**実ユーザーのセッションや実際のAI活動を記録したものではない**。公開Repoには個別の保存先ID・リンクを埋め込まない。

### 操作上の限界

- **衝突を防ぐ設計は確認済み**。一方、複数のAIが同時に書き込む高負荷テスト、ネットワーク断からの復旧、バックアップ・長期運用を保証するものではない。
- `recorded_at`はイベントメタデータ上の作成・記録準備時刻。Google Drive上の**書込成功日時**は保存後にメタデータから区別して取得する。書込み前の時刻を「永続化された時刻」と偽らない。
- この試験の再開ビューは**手動更新**。Drive内のDocを見られることと、Session Deckの認証済み統合Web UI・自動イベント収集の実装完了は別。
- 公開GitHub Actionsには架空イベントのオフライン単体テストのみを渡し、Google DocsのID・トークン・実イベントの取込を行わない。
- 1000イベント／50万文字などの境界を超えたら無理に追記せず、認証済みDBへの移行を検討する。

**次のPoC**：読戻し済み実イベントを`work_id`で照合し、他のセッションから**認証済みのDriveコネクタ**で読んで再開可能かの運用を確認する。実イベント・実ユーザーチャットURLは必要最小限の同意・権限を満たすまでは取り込まない。
