# Session Deck v0.1 検証計画

版: 0.1 / 更新: 2026-10-17
対象: 静的Webデモ。実際のAIサービスとの連携は検証対象外。

## 実装時に確認できたこと

- HTML/CSS/JSを静的ファイルとして配置できる構成。
- JavaScriptの構文チェックはローカルで実施済み。
- 公開するコードに外部APIへの送信処理は設けていない。
- 実ブラウザでの完走確認は未完了。ブラウザ起動テストはこの作業環境ではタイムアウトした。

## 手動受入試験

| ID | 確認事項 | 期待結果 |
|---|---|---|
| T-01 | PC Chrome/Edgeで`index.html`を開く | ダッシュボードが表示される |
| T-02 | iPhone Safariで開く | 横スクロールや操作不能がない |
| T-03 | 作業・セッション・引継ぎの切替 | 内容が画面ごとに切り替わる |
| T-04 | キーワード検索と状態・AI・プロジェクト絞込み | 対象件数と表示が一致する |
| T-05 | 作業を新規登録する | 画面に登録内容が表示される |
| T-06 | セッション追加と正式名生成 | 命名テンプレートに沿う |
| T-07 | 正式名をコピーする | 期待文字列がコピーできる（権限不可時は代替操作） |
| T-08 | 引継ぎメモを追加する | 正しい作業と結びつく |
| T-09 | 再読み込みする | ローカルに保存したデモ状態が復元する |
| T-10 | JSONを書き出す | JSONが保存でき、schema_versionとデータを含む |
| T-11 | 初期化する | 明示操作の後にデモの初期状態へ戻る |
| T-12 | 実サービスへの通信がないことを確認 | 外部サービスに接続しない |
| T-13 | 既存の`docs/CONCEPT.md`を開く | 文書が保持されている |
| T-14 | GitHub Pagesを有効化した場合 | 公開URLで再読込してデモが動作する |

## 入力の安全性とデータ品質

- HTML/JSを含む文字列を入力しても実行されず、画面に文字として表示される。
- 長い作業名、空欄、不明ステータス、欠損IDの扱いを確認する。
- JSONエクスポートはローカル入力値を含むので、公開前に内容確認を促す。
- 機密性が高い実データを使わない。テストは架空値のみとする。
- 利用端末、ブラウザ、バージョン、試験日時、結果、再現手順を記録する。

## 証跡の扱い

確認できた試験だけをPASSとする。実行していない操作は未実施。ブラウザ表示とGitHub Pagesの公開状態は、コミット成功だけを根拠にPASSにしない。

報告様式: `T-ID / 実行環境 / 実施時刻(JST) / 期待 / 実際 / PASS・FAIL・未実施 / 参考URLまたはスクリーンショット`。


## APP PORTFOLIO / 公開GitHub観測の受入記録（2026-10-17）

アプリ台帳部分は従来のデモとは分離し、公開RepoのGitHub RESTメタデータのみを読取り専用で取り込みます。

| ID | 試験と確認した事実 | 結果・根拠 |
| --- | --- | --- |
| PF-01 | 台帳21件（公開Repo13／チャット由来8）をWeb画面が表示 | PASS: [アプリ台帳](https://moyashimisosoup.github.io/session-deck/portfolio.html) で21件表示の読戻し |
| PF-02 | 公開Repoメタデータの取得とPages JSON配信 | PASS: [生成JSON](https://moyashimisosoup.github.io/session-deck/data/portfolio-observations.json) で13/13件成功、取得不能0件を確認 |
| PF-03 | GitHub Actionsのオフラインテストと全手順 | PASS: [Actions run #38949332176](https://github.com/moyashimisosoup/session-deck/actions/runs/38949332176)、tests / GitHub観測 / artifact upload / Pages deploy の各ステップ成功 |
| PF-04 | 最新コミットSHAと直近Actionsのhead_shaを別扱いにする | PASS: 観測JSONで一致/不一致フラグを含むことを確認。ただし全アプリのCI品質を検証した意味ではない |
| PF-05 | API失敗・非公開Repo・重複・無許可Owner・PR/Issueのタイトル非出力 | PASS: Pythonオフライン単体試験（PF-03のテストステップ）と公開JSONのスキーマを確認 |
| PF-06 | 変更ありのみの絞り込み、日本時間表示、10日経過時の警告 | 公開画面へ実装済み。PC・iPhone実機の手動UI操作は未実施 |
| PF-07 | 毎週月曜10:17 JSTのschedule起動と通知 | cron設定済み。**次回の実際の定期起動は未検証**。メール・プッシュ通知は未実装 |
| PF-08 | 各AIの既存チャットやGitHub未保存成果の自動収集 | **未実装**。棚卸し指示をコピーする手動運用のみ |
| PF-09 | 公開Pagesの秘密・個人情報・会話URLなど | 出力を公開Repoメタデータの許可リストに限定。網羅的な機密監査は未実施 |

- 観測JSONは**デプロイ時のスナップショット**です。画面が開いている間、継続的にGitHubをポーリングしません。
- GitHubリポジトリの「何かが更新された」ことと「そのアプリの仕様やテストが完成した」ことは異なります。
- GitHub Actions本体の実行中に収集するため、当該スナップショットで自身のCIが`in_progress`となることがあります。公開されたJSONは実行後に自動で書き換わるライブ状態ではありません。

## 未レビュー保持機能のテスト項目（2026-10-17追加）

- RV-01：同じHEADを何度収集しても、チェックポイントが古ければ未レビューが保持される（オフラインユニット試験）。
- RV-02：初期観測と明示レビュー完了を区別でき、根拠日時・証跡が無いレビュー済み登録を拒否する（オフラインユニット試験）。
- RV-03：チェックポイントの重複・Repo誤対応・不正SHAを拒否し、無断で最新HEADへ変更しない（オフラインユニット試験）。
- RV-04：対象Repoの取得失敗時は未レビュー消去・確認済み化を行わない（オフラインユニット試験）。
- RV-05：UIの絞込・件数・差分比較リンク・コピー操作をブラウザで確認する（PC・iPhone実機は未実施なら未確認）。
- RV-06：公開PagesにGitHubの本文・秘密・認証トークンが無いことを確認する（配信後の公開JSON検査）。

**注意**：PRのオフライン試験PASSとPagesの公開・iPhone動作の確認を混同しない。


## 視認性重視ポートフォリオUI（2026-10-17）

出典と選定理由は [PORTFOLIO_UI_RESEARCH.md](PORTFOLIO_UI_RESEARCH.md) を参照。

| ID | 判定 | 根拠・不足 |
| --- | --- | --- |
| UI-01 | PASS | [PR #3](https://github.com/moyashimisosoup/session-deck/pull/3) をマージ。GitHub Actions [#38974925783](https://github.com/moyashimisosoup/session-deck/actions/runs/38974925783) でGitHub観測の回帰テスト・新UIのJS構文・必須表示フック検査が成功 |
| UI-02 | PASS | [Pages配信 #38974977545](https://github.com/moyashimisosoup/session-deck/actions/runs/38974977545) が成功。公開 [portfolio.html](https://moyashimisosoup.github.io/session-deck/portfolio.html) がHTTP 200、見出し「アプリの現在地」と21件・13/13件の公開観測・各行の現在地・コミット日時・次の作業のレンダリングを確認 |
| UI-03 | PASS（実機操作とは別） | 小画面指定でのスクリーンショット取得HTTP 200。CSSに390px/320px向けレイアウトとモーション低減を実装 |
| UI-04 | 未確認 | 自動ブラウザでのモバイル絞り込み・詳細開閉の操作テストはタイムアウト。検索・並び替え・コピー・タップ操作の完走を確認できていない |
| UI-05 | 未確認 | ユーザー所有のiPhone/Safariでの操作、横方向オーバーフロー、VoiceOver・キーボード操作、縮小文字の可読性 |
| UI-06 | PASS（設計・ソース） | コミット日時と「最終AIセッション活動時刻」を混同しないラベル、GitHub未照合と取得失敗を未確認表示、レビュー状態を変更しない読み取り専用UI |

**検証の区別**：PagesのHTTP 200やブラウザ上の描画成功は、iPhone実機のタップ／コピー成功を意味しない。端末で確認した場合は端末、ブラウザ、日時、PASS/FAIL、再現情報を追記する。


## Linear設計原則に基づくキーボードUI（2026-10-17）

| ID | 判定 | 根拠 |
| --- | --- | --- |
| LX-01 | PASS | [PR #4](https://github.com/moyashimisosoup/session-deck/pull/4)マージ。PR [Actions #38978306119](https://github.com/moyashimisosoup/session-deck/actions/runs/38978306119)で観測Pythonの回帰テスト・2つのJavaScript構文・HTML/UI必須要素チェック成功 |
| LX-02 | PASS | [Pages #38978343901](https://github.com/moyashimisosoup/session-deck/actions/runs/38978343901)のファイルステージング、公開GitHub13件の観測、Pagesデプロイが成功。公開URLのHTML・新CSS・新JS取得がHTTP 200 |
| LX-03 | PASS | 公開Webの実操作テストでヘッダーの検索ボタンを押すとコマンドダイアログが開き、`PDF`入力に対して`APP-005 PDF Works`が1件の結果として表示された |
| LX-04 | 部分的確認 | デスクトップ相当の公開Webでアプリ21件、GitHub13/13件、主要3情報の表示を確認。アイコン・全表示幅・全状態の視覚的レイアウトは人間による追加点検が必要 |
| LX-05 | 未確認 | 390px相当モバイルでの自動連続操作テストはタイムアウト。横スクロール有無、タップ展開、ダーク／ライト切替の操作完走、実機iPhone Safariの画面確認は未検証 |
| LX-06 | 未確認 | ハードウェアキーボードのJ/K、Enter、Esc、Ctrl/⌘Kの連続操作・焦点移動・入力欄での保護を、独立した実ブラウザE2Eとして完走していない |
| LX-07 | PASS（設計・静的CI） | UIスクリプトはGitHubへの自動書込みを持たず、台帳の開発段階とGitHubの最終コミット日時を独立して表示。テーマ設定は端末内の文字列のみ |

確認範囲を越えて「スマートフォンでも全操作が動作確認済み」とは報告しない。未確認の試験は次回のテスト記録で更新する。


## Repo衛生監査と非ローカルSession運用テンプレート（2026-10-17）

| ID | チェック内容 | 結果 |
| --- | --- | --- |
| HY-01 | GitHub公開Repo17件の整理候補を確認、非公開4Repoの実名を公開文書へ持ち込まない | 文書作成・接続GitHubと公開API照合。自動アーカイブは未実装 |
| HY-02 | soba-priceの空に近い旧Repo、宿題管理README一致、更新時刻の古いRepoを候補分類 | GitHub Repo metadata・README読戻しで検出。**コード全一致・依存関係・移管安全性は未検証** |
| SE-01 | TradingSystem runbookの3段階のCHECKPOINT・HANDOFF_READY・ROTATION_DUEを読み、非ローカルに適した運用を文章化 | [CLOUD_SESSION_PROTOCOL.md](CLOUD_SESSION_PROTOCOL.md)を追加。ChatGPT通常チャットの利用率は取得不能として扱う |
| SE-02 | セッション開始／チェックポイント／終了引継ぎのコピー用UIと、各APP-IDの開始用テンプレート | ソースに追加。PR自動テストでJS構文・テンプレートの必須UIフックを確認 |
| SE-03 | 実セッションID・URL・本文を公開Pagesへ同期しない | 公開UIはテンプレートを**ローカルクリップボードへコピーするだけ**。認証付き非公開保存は未実装 |
| SE-04 | iPhone Safari実機でのコピー、専用アプリの起動時刻自動収集、他AIとの継続同期 | **未実装または未確認**。自動記録できたとは報告しない |

**更新方針**：PR CI、mainマージ、Pages再配信は別々に検証し、成功した項目だけ記録する。Repoの整理候補は自動Archive/Deleteしない。


## 定期公開Repo衛生監査＋非公開イベントPoC（2026-10-17）

| ID | 判定 | 証拠 |
| --- | --- | --- |
| HY2-01 | PASS | [PR #6](https://github.com/moyashimisosoup/session-deck/pull/6) をmainへマージ。PR CIで既存GitHub観測の回帰試験・新しいRepo衛生監査のプライバシーテスト・非公開イベントバリデーション・UIのJS構文が成功 |
| HY2-02 | PASS | [Pages Actions #38988905429](https://github.com/moyashimisosoup/session-deck/actions/runs/38988905429)：既存収集・新監査・非公開イベントのオフラインテスト・Pages配信すべて成功 |
| HY2-03 | PASS | 公開 [repo-hygiene.json](https://moyashimisosoup.github.io/session-deck/data/repo-hygiene.json) を読戻し。公開17Repo・要確認候補7件を検出。非公開Repoの項目や名前は出力対象に含めず、GitHubのArchive/Deleteを実施しない |
| HY2-04 | PASS | 公開UIのブラウザ操作で「整理候補7件」→「全17件」の切替に成功。旧soba-priceに「同名Repo」「台帳未登録」が表示 |
| HY2-05 | PARTIAL | GitHub Actions定期cronは設定済み。2026-10-17時点で**後日の定期実行と通知配信を継続的に確認したものではない** |
| PV-01 | PASS | 接続Google Driveに所有者限定のSession Deck専用フォルダとGoogle Docを作成、shared=false・permission owner 1件を読戻し確認。**Driveの実IDは公開GitHub・Pagesに書かない** |
| PV-02 | PASS | 非公開DocにPROBEダミーイベントを追記後、本文を読戻し。実セッションや機密情報は未保存 |
| PV-03 | PASS | Pythonオフラインイベント検証でAPP-IDとwork_idの対応、捏造日時の拒否、未知フィールド拒否、重複event_id拒否を確認 |
| PV-04 | NOT IMPLEMENTED | 非公開Docへの**本当のAIセッション**の自動記録、ChatGPT開始／終了時刻の自動取得、Session Deckからの認証付き閲覧 |
| PV-05 | NOT VERIFIED | 複数AIの同時追記、更新衝突の検知・復旧、Google Drive権限取消、バックアップ／復元、iPhone Safariの非公開UI操作 |

**証跡の区別**：ダミーのprivate store保存成功と、ChatGPT/Codex/Claude Codeの実セッション連携成功は別。Repoの最終pushから開発停止を推測しない。検出された候補は人の判断が必要。
