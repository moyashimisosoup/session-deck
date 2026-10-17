# アプリ・ポートフォリオ台帳

> **正本候補から正式採用**：本ファイルは「アプリ思いつき作成」プロジェクトのアプリ横断台帳です。  
> 初版：2026-10-17 ／ 最終台帳更新：2026-10-17  
> 管理先：`moyashimisosoup/session-deck/docs/APP_PORTFOLIO.md`  
> 運用規則：プロジェクト共通指示 v1.0（採用済み）

## 目的と読み方

- **目的**：どのアプリが存在し、どこまで進み、次に何をすれば再開できるかを短時間で把握する。
- **GitHubを正本**とする。各アプリの詳細仕様、Issue、コード、変更履歴は各リポジトリを優先する。この台帳は概要の索引であり、各リポジトリの仕様を複製しない。
- **確認の限界**：2026-10-17にGitHub上のREADME等を読み取った結果と、従来のプロジェクト内会話を整理した初期登録である。全リポジトリの最新コミット・CI・配信URL・実機動作を網羅的に検査したものではない。
- **「最終確認日」**は台帳作成のために根拠を確認した日であり、アプリがその日時に稼働した証拠ではない。未照合は未照合と書く。
- 個人情報、非公開の会話URL・セッションID・資格情報は公開台帳に載せない。

### 分類

| 開発段階 | 定義 |
| --- | --- |
| 構想 | 目的・体験・機能案を相談している。実装・公開は未確認 |
| 調査・設計 | 資料収集、仕様、データモデル、技術選定を進めている |
| 試作 | 試作品やソースを確認できるが、要求機能・実機検証が未完了 |
| 限定公開 | 公開版または試験公開の記載があり、品質改善を続けている |
| 運用・改善 | 実利用を伴う運用・保守が中心。最新の稼働状態は別途確認 |
| 保留 | 意識的な停止・重複整理・採否の再検討が必要 |

**作業状態**（未着手／進行中／検証待ち／保留）は開発段階とは別軸。会話やREADMEに「進行中」とあっても、AIセッションが今稼働中という意味ではない。

## A. リポジトリ確認済みのアプリ

| ID | アプリ・概要 | 段階／作業状態 | 開発正本 | 確認済みの成果・現在の課題 | 次の作業 |
| --- | --- | --- | --- | --- | --- |
| APP-001 | **Session Deck**：ChatGPT・Claude Code・Codexの作業横断管理 | 公開台帳・Repo監査運用／非公開セッション引継ぎPoC | [session-deck](https://github.com/moyashimisosoup/session-deck) | 公開21アプリ・GitHub対象13 Repo観測・整理候補7件の確認UIが運用中。[PR #7](https://github.com/moyashimisosoup/session-deck/pull/7)で非公開イベントの冪等追記計画、重複ID衝突検知、START/CHECKPOINT/HANDOFF/ENDの`work_id`別復元、開始・終了時刻の未確認区別を追加。所有者限定のGoogle Driveで**架空3イベント**をrevision条件付き書込み・読戻し、古いrevisionによる追記拒否を確認。非公開の手動更新型「作業再開ビュー」も作成し、所有者のみの権限を確認（実Drive IDは公開しない）。[PR CI](https://github.com/moyashimisosoup/session-deck/actions/runs/38990565902)成功、[Pages実装](https://github.com/moyashimisosoup/session-deck/actions/runs/38990599928)で配信成功。公開UIの「再開・復元をコピー」／アプリ詳細の引継ぎ復元ボタンの表示・21件・Repo候補7件を実ブラウザで確認。[PR #9](https://github.com/moyashimisosoup/session-deck/pull/9)で[ChatGPT早期CHECKPOINT／HANDOFF_READY規則](https://github.com/moyashimisosoup/session-deck/blob/main/docs/CHATGPT_EARLY_ROTATION_POLICY.md)と[手動プロジェクト設定用の追記文](https://github.com/moyashimisosoup/session-deck/blob/main/docs/CHATGPT_PROJECT_INSTRUCTIONS.md)をmainへ統合。コンテキスト残量は推定しない。**実チャットの自動取込・非公開の自動同期／独立認証UIは未実装** | ユーザーがプロジェクト共通指示を手動更新後、実チャット1件で早期CHECKPOINTと非公開読戻しを検証、Doc revisionの複数AI競合テスト、復元画面の自動更新・認証UIとバックアップ設計、iPhone Safariでコピー動作確認 |
| APP-002 | **クロスワード工房**：日本語クロスワードの制作・編集・教材化 | 試作／進行中（M3a 単語指定型・配置案生成まで公開、実機検証待ち） | [crossword-maker](https://github.com/yama-books/crossword-maker) | M1：6×6・14問のプレイ、カナ正規化・盤面検証。M2：手動編集、Undo/Redo、JSON保存・読込、8bit調ボタンと盤面演出。M3a：[PR #3](https://github.com/yama-books/crossword-maker/pull/3)で単語指定型の配置案生成、未配置語の表示・保存を導入。[PR CI](https://github.com/yama-books/crossword-maker/actions/runs/39009071317)27テスト成功、[最新main](https://github.com/yama-books/crossword-maker/commit/1049aef11b6da599e42b4532994c67175482518a)、[Pages](https://github.com/yama-books/crossword-maker/actions/runs/39009186811)成功。2026-10-17に[編集画面](https://yama-books.github.io/crossword-maker/editor.html)・生成モジュール・[プレイ版](https://yama-books.github.io/crossword-maker/)のHTTP 200確認。実際のブラウザ操作・iPhone日本語IME・ファイル保存・印刷は未検証。配置案は完成問題の保証なし | [M3a実装記録](https://github.com/yama-books/crossword-maker/blob/main/docs/M3A_WORDS_FIRST.md)を参照し、実機で「入力→配置→編集→Undo→JSON保存」を検証。その後、辞書による盤面先行補完と固定語を守る部分再生成を設計・実装 |
| APP-003 | **POÈME / ESTATE**：地図の任意地点から高級マンション広告風ポエムを生成 | 公開運用中／POEM-01 630フック＋LOCATION-01 117PR文セット公開、最終CI69件・ブラウザ確認済／実機・取得網羅性未確認 | [mansion-poet](https://github.com/yama-books/mansion-poet) | 30物件・90ページの一次広告調査を収録（[研究総括](https://github.com/yama-books/mansion-poet/blob/main/docs/CORPUS_30_SYNTHESIS.md)）。2026-10-17、STB-04〜06に続き[STB-07 PR #7](https://github.com/yama-books/mansion-poet/pull/7)をmainへマージ。外部APIの429・タイムアウト・部分成功・全取得失敗を区別し、部分取得を活用／失敗後に再試行。[Node29テスト全合格](https://github.com/yama-books/mansion-poet/actions/runs/38991873254)、[Pages公開成功](https://github.com/yama-books/mansion-poet/actions/runs/38991967295)、公開HTML HTTP 200と新処理反映を確認。**実ブラウザの地点選択→POI取得→ポエム生成とiPhone等実機は今回未確認**。2026-10-17に[LIFE-00仕様PR #8](https://github.com/yama-books/mansion-poet/pull/8)をmainへマージ（[commit 1855936](https://github.com/yama-books/mansion-poet/commit/1855936d168640c01468d13d73751d6f5d4be983)）。[生活5分類のデータ契約](https://github.com/yama-books/mansion-poet/blob/main/docs/LIFE00_DATA_CONTRACT.md)と14件の**未実施**テスト案を保存・読み戻し確認。LIFE-00は文書のみ。続いて[LIFE-01 PR #9](https://github.com/yama-books/mansion-poet/pull/9)をmainにマージ（[354d302](https://github.com/yama-books/mansion-poet/commit/354d302273216527aa7d6b61678cf00711136e14)）。[PR CI 36件全合格](https://github.com/yama-books/mansion-poet/actions/runs/38997692932)・[Pages配信36件全合格/SUCCESS](https://github.com/yama-books/mansion-poet/actions/runs/38997804769)・公開HTML HTTP 200と新機能反映確認。実ブラウザで中野プリセット→生成→THE REALITY開閉・5分類見出しを確認。ただし中野の今回の実施設カードは0件（取得元一部失敗）、施設表示の実地検証とiPhone/Android実機は未完了。2026-10-17、[POEM-SUBJECT-01 PR #10](https://github.com/yama-books/mansion-poet/pull/10)をmainへマージ（[e16964e](https://github.com/yama-books/mansion-poet/commit/e16964e0641084b647001d3779b52fb52771c824)）。[採用判定の仕様書](https://github.com/yama-books/mansion-poet/blob/main/docs/POEM_SUBJECT_POLICY.md)に自然・神社寺院等の文化建築・学校・一般行政・ポストを採用、福祉等の保護的除外・宗教建築の文脈判定と**未実施28テスト案**を確定。PR #10時点では仕様のみ。続いて[POEM-01 PR #11](https://github.com/yama-books/mansion-poet/pull/11)をmainにマージ（[472a9db](https://github.com/yama-books/mansion-poet/commit/472a9db86dec0a3da65200d6780182fb06a4a75f)）。**63ジャンル×10案＝630の短いポエム着眼点（初稿）**を実装・画面接続。 [PR CI 51件成功](https://github.com/yama-books/mansion-poet/actions/runs/39009039453)／[Pages 51件成功・配信SUCCESS](https://github.com/yama-books/mansion-poet/actions/runs/39009079478)。[POEM-01分類精度修正PR #12](https://github.com/yama-books/mansion-poet/pull/12)をmainへマージ（[commit da22323](https://github.com/yama-books/mansion-poet/commit/da2232307ef035f643a1dbf7935a2c55f15cbe80)）。学校/教育一般・池/水域一般・カレー/インド料理を誤同定しないための選択規則とテストを追加。[PR CI 53件成功](https://github.com/yama-books/mansion-poet/actions/runs/39009236878)、[最終Pages SUCCESS](https://github.com/yama-books/mansion-poet/actions/runs/39009274361)。公開ブラウザで中野→ポエム生成・ジャンル一般文教へ安全にフォールバックすることを確認。[LOCATION-01 PR #13](https://github.com/yama-books/mansion-poet/pull/13)をmainへマージ（[105ef6f](https://github.com/yama-books/mansion-poet/commit/105ef6f28bc6ee0ce09eb89b7cb35614fa01fc13)）、ポエム直下に**施設名・登録所在地・直線距離・広告専用PR文**を最大3件表示。29細分類×3=87PR組＋一般10テーマ×3=30PR組の合計**117組**。データ未確認時は所在地・徒歩分数を捏造しない。中野公開ブラウザで実施設カード3枚表示・再生成・地点変更消去を確認。洋菓子店をスーパーと誤分類してしまった問題と説明調文章を[PR #14](https://github.com/yama-books/mansion-poet/pull/14)で修正（[ea25c23](https://github.com/yama-books/mansion-poet/commit/ea25c23d0ddce5b397ece4f7e8928451edc7cfea)）、一般テーマの再生成変化を[PR #15](https://github.com/yama-books/mansion-poet/pull/15)で修正（[a879580](https://github.com/yama-books/mansion-poet/commit/a879580b8d951a675c56930237dbf697b4753302)）。[最終PR CI 69件成功](https://github.com/yama-books/mansion-poet/actions/runs/39014087499)・[最終Pages SUCCESS](https://github.com/yama-books/mansion-poet/actions/runs/39014131376)、最終公開ブラウザで中野3カードの見出しが再生成で全件変化、業態誤断定と徒歩時刻捏造がないことを確認。[実装CHECKPOINT](https://github.com/yama-books/mansion-poet/blob/main/docs/LOCATION01_AD_HIGHLIGHTS.md)。全630案の人手校閲とiPhone等実機受入、微細地物の取得網羅性は未完了。ユーザー指示で文言大量制作を一時停止し、[文言専用HANDOFF_READY](https://github.com/yama-books/mansion-poet/blob/main/docs/handoff/POEM01_COPY_HANDOFF_20261017.md)を保存 | [STB-07引継ぎ](https://github.com/yama-books/mansion-poet/blob/main/docs/STB07_HANDOFF_20261017.md)／[ROADMAP](https://github.com/yama-books/mansion-poet/blob/main/docs/ROADMAP.md)。次：LOCATION-02のPR文品質校閲とGEO-POIの暗渠・側溝・ポスト取得拡充を個別の新ブランチで検証。徒歩経路(WALK-01)は入口・経路精度を検証してから。POEM-01 630文言の推敲は文言専用HANDOFF_READYを正本として並行編集回避。実機受入は残件 |
| APP-004 | **Reverse Planner**：時刻・締切日から生活／学習タスクを逆算 | 限定公開／v0.2進行中・検証待ち | [reverse-planner](https://github.com/yama-books/reverse-planner) | **v0.1**：時刻・日割り逆算、編集・完了、タイマー、端末保存/JSON出力。Pages HTML・JSのHTTP 200を確認。[公開CI成功](https://github.com/yama-books/reverse-planner/actions/runs/38941776421)。**v0.2**：4画面のSOFT PIXEL UI・旧4シートの再開導線を[Draft PR #1](https://github.com/yama-books/reverse-planner/pull/1)に保存。[最新PR CI](https://github.com/yama-books/reverse-planner/actions/runs/38976041678)で単体19件＋Chromium実ブラウザ34チェック成功、画面キャプチャあり。未マージ・未公開、iPhone等の実機未検証。**SOFT PIXELアイコン**：[196件・12シート](https://github.com/yama-books/reverse-planner/tree/main/docs/icons)を登録し、PNG切り出し候補196件と検品タイル196件を生成。座標・再生成スクリプトはGitHubへ保存。画像バイナリは配布ZIPのみでGitHub未保存、目視検品・本採用未完了。[アイコン検品v2](https://github.com/yama-books/reverse-planner/blob/main/docs/icons/README.md)ではS12最下段6件の上下座標とS11/S12計96件の横幅・拡大表示を修正、196件の再切り出しと64px確認画像を作成。[ネコ116件の検品表](https://github.com/yama-books/reverse-planner/blob/main/docs/icons/REVIEW_QUEUE_V2.csv)を登録、目視完了はまだ0件。[アイコン検品Draft PR #2](https://github.com/yama-books/reverse-planner/pull/2)にv3座標修正・116件検品台帳を分離保存。32件優先確認、透過16件試作のうち7件に品質課題。本採用0件。さらに[高品質候補12点v5](https://github.com/yama-books/reverse-planner/blob/feature/icon-qc-v03-20261017/docs/icons/HQ_V5_STATUS.md)を選抜し、透過PNGの4サイズと3背景比較・操作検品HTMLをZIPで作成。Chromiumで検索・表示・PNG保存を確認。12点とも本採用前、PNG本体はGitHub未保存。[同PR #2](https://github.com/yama-books/reverse-planner/pull/2)へv4座標補正26件・優先32件の一次検品・透過16件の再試作を追記。ネコ116件の管理を継続（追加精査16件）、画像実体はZIPで保管、UI本採用0件。[配置検証v6](https://github.com/yama-books/reverse-planner/blob/feature/icon-qc-v03-20261017/docs/icons/HQ_V6_SCREEN_REVIEW.md)：第一候補5点をHOME/SETUP/PLAN/FOCUS/DONEの独立HTMLモックに配置、Chromium 320/390/1280pxなど31チェック成功・画面キャプチャ作成。HTML/PNGは会話ZIP、GitHubは管理台帳と検証記録のみ。実機Safari・本採用・本番統合は未実施。[ロゴ設計書v1](https://github.com/yama-books/reverse-planner/blob/main/docs/brand/LOGO_DESIGN_V1.md)をmainに保存：Reverse Planner＋ギャクサンプランナー、英日8bit風書体、深青緑、4種のロゴA〜Dの画像化前ドラフト。画像生成・正式採用・本番実装は未実施。[ロゴ比較A1〜A3](https://github.com/yama-books/reverse-planner/blob/main/docs/brand/LOGO_A_COMPARISON_V1.md)を文字正本からSVG/PNGで作成。A2第一候補、320/390pxヘッダー試作を確認。画像本体は会話ZIPのみ、正式採用・実機検証・アプリ統合は未実施 | UIキャプチャと実機Safari操作・保存互換・アクセシビリティのレビュー→PRマージ判断→v0.2公開・実機確認 |
| APP-005 | **PDF Works**：Windows向け軽量PDF編集・全ページ共通領域切り出し | 試作／alpha実機確認済・beta編集機能はDraft PRでWindows検証待ち | [pdf-works](https://github.com/moyashimisosoup/pdf-works) | [main alpha](https://github.com/moyashimisosoup/pdf-works/commit/601baa9ab5bf00ceafbf9eb205e6e4465d8f3567)：Qt独立ウィンドウ、40ページ読込・ページ送り・300%拡大を2026-10-17利用者申告で実機確認。新規[Draft PR #1](https://github.com/moyashimisosoup/pdf-works/pull/1)は90°回転・削除・上下移動・Undo・別名保存（元PDF/既存ファイル保護）を別ブランチに実装。[バックエンドCI成功（フォント変更後）](https://github.com/moyashimisosoup/pdf-works/actions/runs/38981031286)。[Zen Maru Gothicのアプリ専用取得・400/500/700切替](https://github.com/moyashimisosoup/pdf-works/blob/feature/native-page-edit-20261017/docs/TYPOGRAPHY_EVALUATION.md)もDraft PRに追加済み（起動時は選択ウェイトのみ読み込み）。書体のWindows実機表示・視認性比較は未検証。[浅い立体ボタン実装](https://github.com/moyashimisosoup/pdf-works/commit/06d8d0d971687709ff0ad3775c683d9f32787689)（下辺3px/押下1px、主操作・削除の区別）をbetaへ追加。[Windows Qtの画面描画・通常/押下スクショCI成功](https://github.com/moyashimisosoup/pdf-works/actions/runs/38990848351)、[バックエンドCI成功](https://github.com/moyashimisosoup/pdf-works/actions/runs/38990848431)。スクショはCI仮想Windowsでの実描画、利用者PCの実機操作とは区別。[共通SoftComboBox](https://github.com/moyashimisosoup/pdf-works/blob/feature/native-page-edit-20261017/src/pdf_works/ui/widgets/combo_box.py)を表示倍率・文字ウェイトへ適用し、Qt Fusion・選択行チェック・丸みのあるポップアップを実装。[Windows Qt展開メニューCI成功](https://github.com/moyashimisosoup/pdf-works/actions/runs/38992968296)、[バックエンドCI成功](https://github.com/moyashimisosoup/pdf-works/actions/runs/38992968193)。Windows実機のDPI・キーボード・マウス操作は未確認。[HTML UI試作・機能追加計画](https://github.com/moyashimisosoup/pdf-works/blob/feature/native-page-edit-20261017/docs/FEATURE_EXPANSION.md)を策定。HTMLデモは人工24ページでCtrl/Shiftとスマホ選択操作をブラウザテスト済みだが**HTML本体はGitHub未保存・Web未公開**。複数選択→共通ROI・抽出/分割→容量表示・圧縮→文字入れの順に検討。ただしbetaのWindows GUI、別端末長時間の安定性、EXEは未確認。Web公開なし・PR未マージ | [beta実機手順](https://github.com/moyashimisosoup/pdf-works/blob/feature/native-page-edit-20261017/docs/BETA_RUN.md)に従いWindowsで編集・保存・40ページ負荷を確認後、PR統合を判断。続いて共通領域切り出し・一覧化へ |
| APP-006 | **soba-price**：古代から現代の品目別物価史・為替・購買力比較 | 史料調査・設計＋UI試作／操作検証待ち | [soba-price](https://github.com/yama-books/soba-price) | 2026-10-17、[基礎設計](https://github.com/yama-books/soba-price/blob/main/docs/BASIC_DESIGN.md)と[出典台帳16件](https://github.com/yama-books/soba-price/blob/main/sources/catalog.csv)、[未検証の調査リード6件](https://github.com/yama-books/soba-price/blob/main/sources/price_leads.csv)を保存。[画面モデル図](https://github.com/yama-books/soba-price/blob/main/docs/UI_WIREFRAME.md)、[Motion Prompt採用案20件](https://github.com/yama-books/soba-price/blob/main/docs/UI_MOTION_PLAN.md)、[HTML操作試作](https://github.com/yama-books/soba-price/blob/main/app/prototype/index.html)と[UI検証計画](https://github.com/yama-books/soba-price/blob/main/docs/UI_TEST_PLAN.md)を追加。HTMLのJS構文とGitHub読戻しは確認、実機ブラウザ操作は未検証。表示カード7件は架空で、実価格・為替計算なし。史料検証済み0件、CI・Web配信なし | iPhone/PCでUI試作の実操作確認後、歴博DBの700〜1299年の検索件数を実測し、原史料照合・公開条件確認を経た価格データの収集へ進む |
| APP-007 | **古典学習帳／koten**：百人一首・活用ドリル・変体仮名・Checkpointの教材群 | 限定公開・並行開発／運用規則を整備 | [koten](https://github.com/yama-books/koten) | 公開Repoには`packages/hyakunin`・`conj`・`vintage-kana`・`checkpoint`が同居。README上は百人一首テスト公開版、実装・校正・実機・公開状態の個別検証は未完了。2026-10-17最新確認では[PR #118](https://github.com/yama-books/koten/pull/118)（conj）と[#98](https://github.com/yama-books/koten/pull/98)・[#77](https://github.com/yama-books/koten/pull/77)（変体仮名関連）の**未マージ3件はDraft**。[PR #108](https://github.com/yama-books/koten/pull/108)は追加12行が現行mainに同一内容で存在することを再確認し、[理由をコメント](https://github.com/yama-books/koten/pull/108#issuecomment-6228891172)して**未マージのままクローズ（2026-10-17）**。巨大な過去引継ぎを毎回読み込まない[公開Safe版のAGENTS/CLAUDE導入PR #119](https://github.com/yama-books/koten/pull/119)はCI成功・main統合済み。[公開koten PR #120](https://github.com/yama-books/koten/pull/120)に、実測できないコンテキスト％を捏造せず進捗の節目で引き継ぐ短い規則を追加（[CI成功](https://github.com/yama-books/koten/actions/runs/38995713124)を確認して[mainへマージ](https://github.com/yama-books/koten/commit/afa98f3e192015ab8b07d3abd9c8bc5a4ad4a003)、[Pages配信成功](https://github.com/yama-books/koten/actions/runs/38997489194)。マージ後main CIは確認時実行中）。権限付きの内部運用正本で担当領域、同一work_idの単一書込み、1行進捗表示、節目のCHECKPOINT、古い資料の取扱をmainに導入。[Session Deck共通進捗表示](https://github.com/moyashimisosoup/session-deck/blob/main/docs/CHAT_PROGRESS_BAR.md)と[4作業領域一覧](https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_007_KOTEN_WORKSTREAMS.md)を追加。実チャットの時刻・コンテキスト利用率は未取得 | [PR #118](https://github.com/yama-books/koten/pull/118)は[CI SUCCESS](https://github.com/yama-books/koten/actions/runs/38750210309)（Chromium/WebKit含む）を確認、現行main側の後続変更はAGENTS/CLAUDEのみで編集ファイル重複なし。PR本文に5項目のiPhone実機検収ゲートを追記したが、実機は未確認のためDraft・未公開を維持。検収後にDraft解除・マージ可否を判断。#108は重複確認後クローズ済み。#98・#77は研究用Draftを維持し、無断統合・クローズは行わない。新チャットでは領域別にGitHub HEAD/CIを再確認し、各回答末尾の1行進捗を適用。校正正本や実機検証を継続 |
| APP-008 | **怪文回文メーカー**：自然文の回文生成・段階的長文化 | 限定公開／改善中 | [kaibun](https://github.com/yama-books/kaibun) | 多段階の回文生成・DNA辞書・公開UIをREADMEで確認。公開URL記載あり | 最新版の機能・回文検証CI・スマホ表示を再確認 |
| APP-009 | **Japanese Flash**：日本語学習者向けかな・基礎語彙練習 | 試作／検証待ち | [nihongo-apps](https://github.com/yama-books/nihongo-apps) | ひらがな・カタカナ・あいさつ・名詞の練習と公開URLをREADMEで確認 | 現行画面・学習課題・スマホ操作を確認 |
| APP-010 | **しゅくだいノート**：家庭向け宿題管理と記録 | 運用・改善／現況要確認 | [shukudai-notebook](https://github.com/moyashimisosoup/shukudai-notebook) | 子ども用・保護者用の画面、GitHub Pages配布手順、共有機能のREADMEを確認 | 最新公開版と運用の課題を確認。Reverse Plannerとの重複は避ける |
| APP-011 | **今日のことば**：名言・格言を閲覧するWebアプリ | 試作／検証待ち | [word](https://github.com/moyashimisosoup/word) | Pages向け静的ファイル・語句データの生成手順をREADMEで確認 | 公開URL・データ整合性・画面の動作を再確認 |
| APP-012 | **源平箱庭**：史実と地理を使う源平合戦シミュレーション | 調査・設計／進行中 | [genpei-sandbox](https://github.com/yama-books/genpei-sandbox) | 基礎設計、典拠調査計画、人物台帳。アプリ本体はREADME上未実装 | 屋島を対象とする限定試作の人物・地点データを検証 |
| APP-013 | **芭蕉アトラス**：芭蕉の足跡を現代地図でたどる | 構想／未着手 | [basho-atlas](https://github.com/yama-books/basho-atlas) | 簡単なコンセプトをREADMEで確認。試作・出典整備は未確認 | 基本体験、俳諧史料、地図・行程データの範囲を定める |

**上記の最終根拠確認日：2026-10-17（主に各リポジトリのREADMEを読取）。** 公開URLがREADMEに記載されていても、今回の台帳作成作業で各サイトのHTTP応答・操作を再検証したわけではない。

**APP-004 個別照合（2026-10-17）**：[PR #1](https://github.com/yama-books/reverse-planner/pull/1)／[開発先頭コミット `a69e79c`](https://github.com/yama-books/reverse-planner/commit/a69e79c35357f59dab1dd4258600faab97fb5a4b)／[CI実行](https://github.com/yama-books/reverse-planner/actions/runs/38976041678)／[実装記録](https://github.com/yama-books/reverse-planner/blob/feature/soft-pixel-v02-20261017/docs/V02_IMPLEMENTATION_STATUS.md)／[UI計画](https://github.com/yama-books/reverse-planner/blob/main/docs/UI_V02_PLAN.md)／[モーション仕様](https://github.com/yama-books/reverse-planner/blob/main/docs/MOTION_SPEC_V02.md)。Chromiumのビューポート試験はスマートフォン実機試験ではない。

### 公開先・試験公開先（特記のないものは今回のアクセス再検証なし。APP-004は2026-10-17に再確認）

- APP-001: [Session DeckのPages候補](https://moyashimisosoup.github.io/session-deck/)（README上の実URL確認は未完了）
- APP-002: [クロスワードを解く](https://yama-books.github.io/crossword-maker/)／[つくる（M3a配置案生成）](https://yama-books.github.io/crossword-maker/editor.html)（2026-10-17：HTTP 200・Pages CI成功。実機操作は未確認）
- APP-003: [マンションポエム](https://yama-books.github.io/mansion-poet/)（READMEに公開URLでの確認記載あり）
- APP-004: [Reverse Planner v0.1 公開中](https://yama-books.github.io/reverse-planner/)（2026-10-17にHTML・JS HTTP 200とv0.1画面を確認。v0.2は未公開）
- APP-008: [怪文回文メーカー](https://yama-books.github.io/kaibun/)
- APP-009: [Japanese Flash](https://yama-books.github.io/nihongo-apps/)
- APP-010: [しゅくだいノート](https://moyashimisosoup.github.io/shukudai-notebook/)

## B. 会話で扱った構想・試作（GitHub正本は未照合）

> この節の「未照合」は「リポジトリが存在しない」の意味ではない。名称変更・別Repo格納・チャット内試作の可能性があるため、重複リポジトリの作成前に必ず調査する。

| ID | アプリ・概要 | 段階／作業状態 | 成果・未確認事項 | 次の作業 |
| --- | --- | --- | --- | --- |
| APP-014 | **かなぐらむ**：ひらがなの文字を使い切る日本語アナグラム | 試作（会話ベース）／検証待ち | 辞書探索型v0.2試作の会話記録あり。文章らしい出力は未実装。Repo未照合 | 実装の保存先を特定し、辞書ライセンスと品質を検査 |
| APP-015 | **古語Wordle**：古語の文字推理・語彙学習Webゲーム | 調査・設計／進行中 | 2026-10-17に純粋推理・古典学習の2モード、3〜5文字・6回推理、歴史的仮名遣い・重複文字判定、正解候補100語／入力語500語以上の目標を仕様案として整理。初期50語は会話上の未校閲候補。正本Repo・コード実装・動作検証・CI・Web公開は未確認 | 語彙50語の出典・語形・語義を校閲し、辞書利用条件を確認。その後、正本Repo候補を再確認して試作判断 |
| APP-016 | **簡単ペアリングの端末入力共有**：LAN内検出・双方承認でPC間の操作を共有 | 構想／未着手 | Mouse Without Bordersの設定を簡略化する案。Repo未照合 | OSS調査、認証・アクセス制御、Windows間の試験設計 |
| APP-017 | **iPhone→PCクリップボード共有**：コピーした文字列等をPCにすぐ貼る | 構想／保留（独立採用未決） | APP-016派生案。iOS権限と実現方式は未検証 | 既存機能・ショートカット・専用アプリ方式を比較 |
| APP-018 | **UIテーマ変換ツール**：画像や既存UIにパレットを当てて変換 | 構想／未照合 | スクリーンショットから色抽出し反映する案。会話内の試作・保存先を未確認 | 画像編集とWeb UIテーマ変換を分離して小さく試作 |
| APP-019 | **学内IDリセット申請フォーム**：学校Google認証で申請 | 調査・設計／保留 | 対象service=library、理由=password、補足なしの画面設計を検討。送信未実装 | 認証基盤の利用可否・申請データの扱い・管理者確認を設計 |
| APP-020 | **主系列星の一生インタラクティブ図**：段階切替と質量別比較 | 構想／未照合 | 太陽型と大質量星の進化を操作で比較する教材案。保存済み試作の有無は未確認 | 科学的な進化分岐と操作モデルを決める |
| APP-021 | **vintage-kana**：変体仮名の翻字学習 | 設計・改善検討／現況未照合 | 5段階程度の習熟・字母範囲・語長による難易度設計を会話で検討。Repo所在未照合 | 既存実装・データ正本を特定し、教材上の表記注記を整える |

**会話情報の整理日：2026-10-17。** 試作記録を確認できてもGitHub保存、デプロイ、実機検証は別の証拠とする。

## C. 重複・範囲確認が必要なもの

- 古典学習帳の**旧設計リポジトリ（非公開）**：APP-007の現行公開実装先は[yama-books/koten](https://github.com/yama-books/koten)。旧設計の存在だけを中央台帳に記録し、実体名や閲覧URLは非公開管理先でのみ扱う。二重集計しない。
- [moyashimisosoup/soba-price](https://github.com/moyashimisosoup/soba-price)：READMEはタイトルのみ。APP-006はユーザー指定の `yama-books/soba-price` を優先し、旧Repoは重複候補。
- [moyashimisosoup/shukudai-kanri](https://github.com/moyashimisosoup/shukudai-kanri)：READMEの内容が「しゅくだいノート」と重なる。APP-010と一体かを確認し、当面別のAPP-IDを発行しない。
- その他確認できたRepo（`desktop-tutorial`、`power-balance`、`seiseki-shukei-tool`、`TradingSystem` 等）は、今回の「アイデア出しアプリ」台帳へ自動的に組み入れない。ユーザーの運用範囲を確認後、必要なら追加する。特にTradingSystemの既存管理・安全規則を本台帳で置換しない。

## 更新ルール（最小運用）

1. **登録**：アイデア採用、既存Repoの正本特定、新規Repo作成時に1行追加。IDは `APP-001` 形式で連番、一度発行したIDは再利用しない。
2. **更新**：重要な仕様決定、試作完成、マージ、公開、検証、保留、再開、引継ぎのときだけ該当行を更新する。毎チャット・毎応答の一括書き直しは禁止。
3. **確認**：更新前に対象RepoのREADME・仕様・PR・CI等を読み直す。会話上の申告とツールでの確認結果は区別する。「成功」の根拠が無ければ未確認とする。
4. **記録**：変えた欄に加え、最終根拠確認日、参照URL（コミット・PR・Issue・README等）を残す。詳細なログ・Issueは個別Repo側で管理する。
5. **公開**：ソースがmainにあること、CIが通ったこと、Pagesが配信されたこと、実機で動いたことはそれぞれ別に確認する。推測で完了扱いにしない。
6. **競合防止**：複数のAI/チャットが同じ行・ファイルを編集する場合は最新内容を取得し直し、他の行の更新を消さない。作業ID・担当・ブランチはSession Deckに紐づける。
7. **書込不能**：台帳が更新できなかった場合、保存済みとは報告せず、次の短いメモを提示する。

```text
進捗更新メモ
APP-ID:
変更内容:
確認した成果と根拠URL:
未確認・残課題:
次の作業:
GitHub台帳への保存: 未実施
```

## 次の整備（優先順）

1. APP-001のSession Deckから、このMarkdownを読めるポートフォリオ一覧画面を検討する（最初は手動読込みでも可）。
2. APP-014・APP-018・APP-020・APP-021などの実際の試作保管場所を確認し、重複を解消する。
3. APP-002の別セッション試作とGitHub上のプレイ版の関係を整理する。
4. アプリごとの根拠（最終コミット、PR、Pages実URL、実機結果）を必要なときだけ補完する。
5. 将来データ件数が増えたら、Markdownを索引として残したまま機械可読なJSON/YAMLを導入する。現時点で複雑なDBは不要。
