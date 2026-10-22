# APP-001 Session Deck Namer — 開発引継ぎ CHECKPOINT

更新：2026-10-23 JST。ユーザーの拡張再読み込み完了後、専用会話で手動変更保護・対応解除・再登録後の保護を実機確認。登録直後の案内文不備を補修し、27件の回帰と追加監査を実施。表示修正の実機反映は再読み込み待ち。
コード完成・GitHub保存・CI・実機検収・Web公開は別の状態として扱う。

## 1. 正本・確定指示

- リポジトリ：https://github.com/moyashimisosoup/session-deck
- 作業場所：`D:\dev\local-env\session-deck`。
- Chromeの拡張読み込み元：同リポジトリの `extensions\chatgpt-namer`。v0.4.1。
- 正式形式：`【短い作業名】MMDD・作業番号・具体的内容`。別括弧への変更は撤回済み。記号だけの互換パーサー・形式版・移行を作らない。
- APP-001はアプリID。作業IDは既存値を使い、未確認時に再発番しない。
- 専用テスト会話のみ操作する。重要会話、本文、Cookie、認証トークン、他アプリ・TradingSystemのHooks/claim/CIは対象外。
- 本件のSlack報告は不要とのユーザー訂正があり、停止済み。
- 自動改名は未実装・OFF。現状は利用者の確認操作で1件だけ改名する。

## 2. 保存状態と担当ブランチ

| 対象 | 状態 |
|---|---|
| 実装ブランチ | `feat/namer-local-candidates`、履歴補修HEAD `5de15fc8daeca1c84880d2f0b4f541fc5cb289f5`。再開時HEADは指定の `c7a41f6317b5b1687d7522653d125d285a6b1603` と一致、作業ツリーはクリーンだった |
| メニュー修正ブランチ | `fix/namer-observed-menu`、HEAD `35bb95f` |
| 候補本体コミット | `faa5519` |
| データ移動機能コミット | `d6a5816` |
| 実機検収文書コミット | `56df792` |
| ロードマップ編集 | `D:\dev\local-env\session-deck-roadmap`、ローカルHEAD `8385d510e8d54544b7ff1b653350885986744642`。PR #36のリモートHEAD `8574503eeb0de20442e92b1c998d03312bb219fa` とツリー全体が一致。接続ツールで保存したため履歴は分岐しているが、未公開の文書差分はない。ローカルコミットは保持 |
| 最新取得main | `237db70a6e445892b0264d5e1ff7dd17d85301f7` |
| mainの追加差分 | 実装の基点 `37fd18e` 以降、命名関連に変更なし。最後の `0dbabbd` 以降も `docs/APP_PORTFOLIO.md` のみ |

この文書自身をコミットすると実装ブランチのHEADは変わる。再開時は `git status --short --branch` と `git rev-parse HEAD` で実値を確認する。GitHubへは既存のローカル履歴を変更せず、所有者接続から機能ごとにコミットした。ローカルとPR #40のコード・テスト・同期スクリプトは再取得後に差分なしを確認。

## 3. GitHub・PR・CI

- PR #35：OPEN、`fix/namer-implicit-text-input`、`b390a2b810daa81815de4912a10775606008077e`。入力欄type省略の修正を再利用済み。
- #35のnaming CIはSUCCESS：[実行](https://github.com/moyashimisosoup/session-deck/actions/runs/39743877610/job/119707444367)。今回の追加コードを検証したCIではない。
- [PR #36](https://github.com/moyashimisosoup/session-deck/pull/36)：既存ロードマップの簡素化・正式括弧維持を保存し、PR説明も訂正。HEAD `8574503`。文書のみなのでnaming CIのpaths対象外、当該HEADの追加runなし。
- GitHub CLIは `yama-books` のまま。今回は接続済みの所有者 `moyashimisosoup` のGitHubツールで保存経路を解消した。認証情報・Cookieの抽出や転用は行わない。
- 実装は以下のDraft PRへ分割。各PRは直前のブランチをbaseとし、統合順は #37 → #38 → #39 → #40。#37は未マージの#35の入力欄修正を含むため、統合前に重複を整理する。

| PR | 範囲・コードHEAD | 当該コードHEADの命名CI |
|---|---|---|
| [#37](https://github.com/moyashimisosoup/session-deck/pull/37) | メニュー限定起動、`ceb8bc422902e0c8bee44fe8e4338c85bbb3c044` | [success](https://github.com/moyashimisosoup/session-deck/actions/runs/39845014718) |
| [#38](https://github.com/moyashimisosoup/session-deck/pull/38) | 作業候補・確認型改名、`02db161c402db0edbbf741614a3cbff704832344` | [success](https://github.com/moyashimisosoup/session-deck/actions/runs/39845103137) |
| [#39](https://github.com/moyashimisosoup/session-deck/pull/39) | 保存・読込み、`237a773cadc9ba9aa0a3c0826dad1c9ff83035bc` | [success](https://github.com/moyashimisosoup/session-deck/actions/runs/39845186026) |
| [#40](https://github.com/moyashimisosoup/session-deck/pull/40) | 同一会話の旧レコード履歴保全、`6f79697b9d0a4d6c839e0c359f5d422c50362819` | [success](https://github.com/moyashimisosoup/session-deck/actions/runs/39845285522) |

#40の文書保存後HEAD `33f63ecac79282e75e3c3b1e866534113d2d4eb9` でも[命名CI成功](https://github.com/moyashimisosoup/session-deck/actions/runs/39845614086)を確認済み。コード・テスト・CHECKPOINT・runbookは再取得後にローカル保存内容と一致。マージ・Web公開は未実施。

## 4. 実装と検証済み範囲

- 対象行の会話リンクが1件であることをボタン探索より先に確認。観測した `data-sidebar-cycle-item` と起動ボタン・メニューのARIA関連で対象を限定する。
- ArrowDownイベントでメニューを起動し、当該メニューの改名項目だけを選択。入力欄の現在値と対象名も照合する。#35の入力欄修正を維持。
- `naming-core.js` で生成・検査を共通化。コンソールへ同じ処理を埋め込む同期スクリプトは `scripts/sync_naming_core.mjs`。テストで完全一致を検査する。拡張フォルダをPagesへ配信する必要はない。
- 既存作業の明示選択・登録、会話との対応、登録日の固定、候補生成、再訪問時の候補表示。
- popupとページ内パネルに確認ボタンと対応解除。会話ID・期待名を再確認し、別作業・手動変更を保護する。生成や登録だけで改名しない。
- 現在URLと対象行の定期照合で切替等に追従。本文を読まない。
- ローカルファイルで保存データの書出し・読戻し。競合する記録は上書きせず停止。

ローカル検証：補修後の `node --test tests/naming.test.mjs` は26 passed / 0 failed、終了0。naming-core / backup / content / popupの構文検査、`node scripts/sync_naming_core.mjs --check`、`git diff --check` も終了0。新しい回帰2件は、リポジトリ外へコピーした補修前コードでは2件とも失敗・終了1で欠落を再現した。文書保存で同じ検査を再実行したとは扱わない。

### 実機成功（v0.4.1・日本語UI・専用会話1件）

1. ユーザーがD側へ保存データを読み込み、成功表示を報告。
2. 専用会話の再読み込みでパネル1個を確認。未登録時は作業選択要求。
3. 既存テスト作業番号を画面から明示登録し、正式名を生成。登録だけでは無変更。
4. 改名ダイアログを事前に開かず、拡張の確認ボタン1回でメニュー起動→入力→保存。画面確認成功を観測。
5. ページ再読み込み後もサイドバーの名前を保持し、候補との一致を観測。
6. 新規画面を経由して同じ専用会話へ再訪問。候補が自動再表示され、同名の再適用ボタンは無効。日付跨ぎでも登録日のMMDDを維持。

目標A・B・Cはこの範囲で実機確認済み。継続検収では、手動変更後・対応解除後・同じ作業への再登録後の保護も専用会話で確認した（下記）。他言語・複数タブは未検収。履歴保全の追記内容と不正な保存ファイル拒否は自動テストで確認した範囲であり、実保存データを使った実機検収とは区別する。

実ID・非公開URL・実タイトル・本文・実画面画像をGitHubやCIへ入れない。パネルだけの証跡はリポジトリ外の `D:\dev\local-env\app001-audit\private\namer-revisit-confirmed.jpg` に保存。公開しない。

## 5. 履歴補修・追加監査と次の作業

同一会話の旧レコードを追加履歴へ保存してから新レコードへ更新する補修を実施。旧レコードとJSONが一致する履歴があれば追加しない。日時・検証情報・未知の追加項目をそのまま保全し、既存履歴と別会話の記録も維持する。再読み込み後に同名を再確認しても履歴を増やさない。補修後の実機確認はまだ行っていない。

- Jevはtypesafeを維持。メニュー修正監査は3 verified、候補本体は4 verified、いずれも矛盾・未支持0。
- 候補本体の約42KB差分は自動審査で一度拒否された後、ユーザーの具体的差分承認により送信・監査済み。
- 保存/読込み機能の過去の送信は自動審査が追加ソースとして拒否した。今回、具体的な追加差分・テスト出力への明示承認を受領し、その後に本件確認に必要な範囲への包括承認も受領した。実会話情報・秘密は送信しない。
- 追加監査：保存/読込みと履歴補修の実差分151変更行・12,618文字、26件の実テスト出力を使用。パックの `send_allowed=true`、秘密検知0、切詰めなしを確認して `jev_verify` を1回実行。応答providerは `typesafe`、4 verified / 0 contradicted / 0 unsupported / 0 needs_review。`jev_gate` は使用していない。
- 今回のパック：`D:\dev\local-env\app001-audit\transfer-and-history.json`。応答そのもの：`additional-verify-result.json`。以前の `menu.json`、`candidates.json`、`transfer.json` も保持。パックは監査結果そのものではない。
- 元のopsヘルパーとユーザーのallowlistは変更していない。作業用ヘルパーは同フォルダへコピーし、当該タスクの明示承認をpreflightへ渡すよう調整したもの。機密データや許可外の新差分を送る権限はない。

GitHub所有者接続による保存・PR分割・Codex添付は実施済み。#35の修正は#37に含まれるため、統合前に重複を整理する。他言語・複数タブ、履歴内容・不正バックアップ読込みの実機検収は未完了。マージ・Web公開は実施していない。

### 継続レビュー：保存ファイルの型検査と実機経路

- `backup.decode` が記録・作業・会話対応に配列、履歴にオブジェクトを受け付けていた。後続処理と型が合わないため、記録・作業・対応はオブジェクト、履歴は配列に限定し、保存前に拒否する補修を追加した。旧レコード内部の未知フィールドは維持する。
- ローカル補修コミット `a567f6f`。追加回帰は補修前に失敗（終了1）、補修後の全27件は成功（終了0）。backup.jsの構文とdiff検査も成功。TypeSafe/Jevの `jev_verify` は3 verified / 0 contradicted / 0 unsupported / 0 needs_review。監査パックは `app001-audit\backup-container-review.json`、応答は `backup-container-verify-result.json`。本件確認の包括承認の範囲で、コード差分と架空テスト出力のみ送信した。
- 専用テスト会話の拡張パネルだけを読取り、パネル1個・現在名と候補の一致を確認。本文・他会話の内容は検査しない。
- 拡張を確実に再読み込みするためWindows操作を試したが、現在のブラウザURLをポリシー上十分な確度で判定できないという理由でツールが停止。入力・設定変更・改名は行っていない。拡張一覧の内部タブもブラウザ接続からは操作できない。
- 利用者が既存拡張と専用会話の再読み込み完了を報告し、通常のChromeブラウザ接続で下記の検収を再開できた。停止したWindows操作を迂回して拡張管理画面を操作したものではない。Slack報告はユーザー指示により行わない。
- 保存ファイル型検査の [PR #41](https://github.com/moyashimisosoup/session-deck/pull/41) はHEAD `e4bcdd7cfab10a6d7774de010022697cae21b55a` の[命名CI成功](https://github.com/moyashimisosoup/session-deck/actions/runs/39846355160)を確認。依存は#40、Draftのまま。

### 継続実機検収と登録直後の案内文

- 対象は許可済みの専用会話1件のみ。本文、他会話、Cookie、認証情報は読まない。実ID・実タイトル・画像をGitHubやJevへ送らない。
- 再読み込み後もパネル1個、候補と現在名の一致、再適用無効、元の登録日保持を確認。
- 本体UIで一時的に名前を変更すると手動保護表示・改名ボタン無効になる。対応解除後は候補なし・改名ボタン無効、再読み込み後も作業未登録を維持。同じ既存作業に元の日付で再登録しても手動変更を上書きせず、再読み込み後も保護を維持した。
- 本体UIで元の名前へ戻し、元の名前を基準に既存作業と元の登録日で対応を登録し直した。検収用の一時タイトルは残していない。実機確認は確認型操作の保護であり、自動改名の有効化ではない。
- 登録直後だけ案内文が無条件に確認ボタンを勧める不備を観測。ボタン自体の無効化は正しかった。`bindWork`の戻り値に保護理由があれば、その理由を案内文へ表示する小修正を追加。ローカルコードコミット `c8f0ee3`。27テスト成功・終了0、content.js構文・diff検査成功。TypeSafe/Jevは3 verified / 0 contradicted / 0 unsupported / 0 needs_review。監査資料は `protected-registration-notice.json` と `protected-registration-notice-verify.json`。
- ページ再読み込みだけでは古い案内文が残ることを確認したため、新しい表示修正の実機確認には拡張自体の再読み込みを利用者へ依頼済み。その修正を実機合格とは扱わない。
- パネルだけの非公開証跡は `app001-audit\private\namer-manual-protection-confirmed.png` と `namer-restored-after-protection.png`。公開しない。

確認型の安定性を確認した後に、1作業・1会話へ限定した自動許可の最小設計へ進む。現段階で有効化しない。

## 6. 配置整理・データ移行（完了）

- 本体・編集用worktree・検証ファイル・退避データは `D:\dev\local-env` 配下へ集約。途中で作成した `D:\App\Session-Deck-Namer` は、正本と全6ファイルのハッシュ一致を確認して削除済み。
- 元の非Gitコピー：`app001-backups\pre-existing-session-deck`。元の拡張ソース4ファイル：`app001-audit\old-extension-source`。
- ユーザー指定のOneDrive旧フォルダは、D側導入と読戻し成功・実機確認後、全6ファイルを正本とハッシュ照合し `app001-backups\retired-onedrive-namer-source` へ退避して削除。不在を確認済み。
- ブラウザ内の旧保存データと、ユーザーが書き出した非公開JSONは削除していない。これらを公開しない。
