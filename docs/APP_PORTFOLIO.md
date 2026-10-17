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
| APP-001 | **Session Deck**：ChatGPT・Claude Code・Codexの作業横断管理 | 公開台帳・Repo監査運用／非公開セッション引継ぎPoC | [session-deck](https://github.com/moyashimisosoup/session-deck) | 公開21アプリ・GitHub対象13 Repo観測・整理候補7件の確認UIが運用中。[PR #7](https://github.com/moyashimisosoup/session-deck/pull/7)で非公開イベントの冪等追記計画、重複ID衝突検知、START/CHECKPOINT/HANDOFF/ENDの`work_id`別復元、開始・終了時刻の未確認区別を追加。所有者限定のGoogle Driveで**架空3イベント**をrevision条件付き書込み・読戻し、古いrevisionによる追記拒否を確認。非公開の手動更新型「作業再開ビュー」も作成し、所有者のみの権限を確認（実Drive IDは公開しない）。[PR CI](https://github.com/moyashimisosoup/session-deck/actions/runs/38990565902)成功、[Pages実装](https://github.com/moyashimisosoup/session-deck/actions/runs/38990599928)で配信成功。公開UIの「再開・復元をコピー」／アプリ詳細の引継ぎ復元ボタンの表示・21件・Repo候補7件を実ブラウザで確認。**実チャットの自動取込・非公開の自動同期／独立認証UIは未実装** | 非公開Driveイベントの運用プロンプトを実セッション1件で検証、Doc revisionの複数AI競合テスト、復元画面の自動更新・認証UIとバックアップ設計、iPhone Safariでコピー動作確認 |
| APP-002 | **クロスワード工房**：日本語クロスワード制作・編集・学習教材化 | 試作／進行中（M2編集画面の第1段階を公開・実機検証待ち） | [crossword-maker](https://github.com/yama-books/crossword-maker) | 既存6×6・14問のプレイ機能、カナ正規化・盤面検証・単一JSON正本化（M1）に加え、編集画面（5〜15マス、黒マス・文字・カギ、Undo/Redo、端末内自動保存、作業JSON・完成問題JSON、マットなブロック型ボタン、6種類の盤面登場演出）を[M2 PR #2](https://github.com/yama-books/crossword-maker/pull/2)で[mainへマージ](https://github.com/yama-books/crossword-maker/commit/d8a7092fcf8d59cf9c0feb55331ec8813e3661e7)。[PR CI](https://github.com/yama-books/crossword-maker/actions/runs/38974861527)で21テスト成功、[Pages](https://github.com/yama-books/crossword-maker/actions/runs/38974946350)成功。[編集画面](https://yama-books.github.io/crossword-maker/editor.html)のHTTP 200・初期盤面表示は2026-10-17確認。モバイルIME、実機タップ、ブラウザでの一連の編集・JSONダウンロード・印刷は未検証。旧セッションの自動生成・辞書補完は未統合 | [M2実装記録](https://github.com/yama-books/crossword-maker/blob/main/docs/M2_IMPLEMENTATION.md)・[UI計画](https://github.com/yama-books/crossword-maker/blob/main/docs/UI_MOTION_PLAN.md)を基に、まずiPhone実機で編集・保存を検証。次に生成候補比較、必須語、固定語保持、盤面先行辞書補完を段階的に統合 |
| APP-003 | **POÈME / ESTATE**：地図の任意地点から高級マンション広告風ポエムを生成 | 公開運用中／v0.1.2のPOI安定化継続 | [mansion-poet](https://github.com/yama-books/mansion-poet) | 30物件・90ページの一次広告研究は収録済み（[総括](https://github.com/yama-books/mansion-poet/blob/main/docs/CORPUS_30_SYNTHESIS.md)）。2026-10-17、[STB-04 PR #4](https://github.com/yama-books/mansion-poet/pull/4)でOpenPOI/OSM共通型を、[STB-05 PR #5](https://github.com/yama-books/mansion-poet/pull/5)で近接同名施設の重複防止と住所確認フラグをmainにマージ。[Node16テスト成功](https://github.com/yama-books/mansion-poet/actions/runs/38988821248)、[Pages公開SUCCESS](https://github.com/yama-books/mansion-poet/actions/runs/38988895125)、公開HTML HTTP 200と新処理の配信を確認。**公開ブラウザでの地点選択→生成、iPhone実機、モーション実操作は今回未確認** | [最新ROADMAP](https://github.com/yama-books/mansion-poet/blob/main/docs/ROADMAP.md)と[STB-05引継ぎ](https://github.com/yama-books/mansion-poet/blob/main/docs/STB05_HANDOFF_20261017.md)を参照。次はSTB-06：OpenPOIのバー・飲食店と「美術館」など名称の語を混同しない分類信頼度テスト、その後STB-07障害時フォールバック。独立実ブラウザ/実機確認も残る |
| APP-004 | **Reverse Planner**：時刻・締切日から生活／学習タスクを逆算 | 限定公開／v0.2進行中・検証待ち | [reverse-planner](https://github.com/yama-books/reverse-planner) | **v0.1**：時刻・日割り逆算、編集・完了、タイマー、端末保存/JSON出力。Pages HTML・JSのHTTP 200を確認。[公開CI成功](https://github.com/yama-books/reverse-planner/actions/runs/38941776421)。**v0.2**：4画面のSOFT PIXEL UI・旧4シートの再開導線を[Draft PR #1](https://github.com/yama-books/reverse-planner/pull/1)に保存。[最新PR CI](https://github.com/yama-books/reverse-planner/actions/runs/38976041678)で単体19件＋Chromium実ブラウザ34チェック成功、画面キャプチャあり。未マージ・未公開、iPhone等の実機未検証。**SOFT PIXELアイコン**：[196件・12シート](https://github.com/yama-books/reverse-planner/tree/main/docs/icons)を登録し、PNG切り出し候補196件と検品タイル196件を生成。座標・再生成スクリプトはGitHubへ保存。画像バイナリは配布ZIPのみでGitHub未保存、目視検品・本採用未完了 | UIキャプチャと実機Safari操作・保存互換・アクセシビリティのレビュー→PRマージ判断→v0.2公開・実機確認 |
| APP-005 | **PDF Works**：Windows向け軽量PDF編集・全ページ共通領域切り出し | 試作／alpha実機確認済・beta編集機能はDraft PRでWindows検証待ち | [pdf-works](https://github.com/moyashimisosoup/pdf-works) | [main alpha](https://github.com/moyashimisosoup/pdf-works/commit/601baa9ab5bf00ceafbf9eb205e6e4465d8f3567)：Qt独立ウィンドウ、40ページ読込・ページ送り・300%拡大を2026-10-17利用者申告で実機確認。新規[Draft PR #1](https://github.com/moyashimisosoup/pdf-works/pull/1)は90°回転・削除・上下移動・Undo・別名保存（元PDF/既存ファイル保護）を別ブランチに実装。[バックエンドCI成功（フォント変更後）](https://github.com/moyashimisosoup/pdf-works/actions/runs/38981031286)。[Zen Maru Gothicのアプリ専用取得・400/500/700切替](https://github.com/moyashimisosoup/pdf-works/blob/feature/native-page-edit-20261017/docs/TYPOGRAPHY_EVALUATION.md)もDraft PRに追加済み（起動時は選択ウェイトのみ読み込み）。書体のWindows実機表示・視認性比較は未検証。ただしbetaのWindows GUI、別端末長時間の安定性、EXEは未確認。Web公開なし・PR未マージ | [beta実機手順](https://github.com/moyashimisosoup/pdf-works/blob/feature/native-page-edit-20261017/docs/BETA_RUN.md)に従いWindowsで編集・保存・40ページ負荷を確認後、PR統合を判断。続いて共通領域切り出し・一覧化へ |
| APP-006 | **soba-price**：奈良・平安〜現代の品目別物価史・為替・購買力比較 | 調査・設計／M0史料予備調査進行 | [soba-price](https://github.com/yama-books/soba-price) | [基本設計](https://github.com/yama-books/soba-price/blob/main/docs/BASIC_DESIGN.md)・[収集計画](https://github.com/yama-books/soba-price/blob/main/docs/DATA_COLLECTION_PLAN.md)・[公開方針](https://github.com/yama-books/soba-price/blob/main/docs/DATA_POLICY.md)を保存。2026-10-17、[出典台帳16件](https://github.com/yama-books/soba-price/blob/main/sources/catalog.csv)・[奈良/平安の価格賃金リード6件](https://github.com/yama-books/soba-price/blob/main/sources/price_leads.csv)・[調査ログ](https://github.com/yama-books/soba-price/blob/main/docs/RESEARCH_LOG_20261017.md)を追加し公開GitHubで確認。6件は博物館解説レベル、元史料未照合で本番データ扱いせず。歴博DBの年代別件数・再利用許諾未確認。検証済み観測0件。CI・アプリ・Web公開・実機検証なし | 歴博DBの利用条件・700〜1299年検索件数の実測、996年史料などの原翻刻照合、公開可能な小規模サンプルの整理 |
| APP-007 | **古典学習帳／百人一首練習帳**：範囲別・段階式の古典学習 | 限定公開／検証待ち | [koten](https://github.com/yama-books/koten) | v0.1.0テスト公開版の説明、穴埋め・作者問題と端末内学習履歴。史料校正・実機検証が残る。旧設計Repoは下記参照 | 異同・読みの校正、実機試験、助動詞問題の設計 |
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
- APP-002: [クロスワードを解く](https://yama-books.github.io/crossword-maker/)／[つくる（M2）](https://yama-books.github.io/crossword-maker/editor.html)（Pagesデプロイ成功、編集画面HTTP 200・初期表示確認。iPhone・PC実機操作未確認）
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

- [moyashimisosoup/koten](https://github.com/moyashimisosoup/koten)：古典学習帳の先行設計Repo。APP-007の**現行実装先は yama-books/koten** とし、二重集計しない。移行済みかの最終整理は別途確認。
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
