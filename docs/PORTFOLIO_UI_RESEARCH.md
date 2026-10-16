# Session Deck アプリ台帳UIレビュー（2026-10-17）

## 目的

21件以上のアプリについて、一覧を開いて数秒以内に **①いまの開発段階・作業状態 ②最後に確認できたGitHubコミット日時 ③次の作業** を特定できる画面とする。

情報の出どころを混同しないことが重要。

- **「いまの状態」**：`docs/APP_PORTFOLIO.md`に人間とAIが根拠を確認して記録した開発段階／作業状態。リアルタイムのAIセッション稼働状態ではない。
- **「最後の動き」**：GitHub REST APIの最新コミットに含まれる`commit.committer.date`。最終push日時、最終チャット発言時刻、最終UI操作時刻ではない。Repo未照合・API失敗時は明示的に「未照合」「未取得」。
- **「次にすること」**：台帳の次の一手。AIが勝手に推測したタスクに置換しない。
- **「要レビュー」**：確認基準SHAと現在の観測HEADが異なる事実。故障・作業失敗・未公開という判定ではない。
- **「最終収集」**：観測JSONの生成時刻。GitHub更新時刻と分けて日本時間で表示する。

## 先行UIの調査

| 製品 | 参考にした挙動 | Session Deckへの翻案 |
| --- | --- | --- |
| [Linear — Display options](https://linear.app/docs/display-options) | リストで状態・更新日時の並び替え、詳細密度の調整 | 初期値を読みやすい高密度一覧、一覧／ゆったり切替、最新コミット順とID順 |
| [Linear — Project status](https://linear.app/docs/project-status) | 各プロジェクト名の近くに状態を置き、全体から判断しやすくする | 名前と現在地を最上位に、開発段階と台帳上の作業状態を分離 |
| [Linear — Custom views](https://linear.app/docs/custom-views) | 重要な対象へ素早く移動できる集約ビュー | 未レビュー、進行中、全件、未照合を上部の選択可能な概要カードに |
| [GitHub Projects — Table/Board/Roadmap](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view) | 一覧の密度を上げ、列単位で情報比較 | 今回はリスト専用。ボード化せず「いま／最後／次」を固定の並びに |
| [GitHub Projects — Updated filter](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects) | 最終更新の時間軸で絞り込み・見直し | GitHubコミット日時でソート、出所を明記。会話だけの成果はGitHub時刻「未照合」 |
| [Plane — Your Work](https://docs.plane.so/your-work) | 確認すべき数字を概要に置き、詳細は下のリストで参照 | 4つの数字とタスクリストを同じ画面に表示 |
| [Plane — Project Overview](https://docs.plane.so/core-concepts/projects/project-overview) | 概況と活動履歴の階層化 | 長い成果・CI・比較リンクは行の詳細を開いて確認 |

いずれも**操作思想と情報階層を参考にしたもの**であり、外部製品のソースコード・アイコン・CSSを転載していない。

## 今回反映したUI

- **高密度リスト**：APP-ID／名称、現在地、GitHub最終コミット、次の一手を同じ行へ表示。
- **詳細開閉**：検証結果、長い作業内容、GitHubコミット、PR・CIの状況、レビュー比較リンクを閲覧できる。既存の検証導線を失わない。
- **最終更新の降順**：最も新しいコミットを上へ。GitHub未照合の構想は最後に置く。APP-ID・開発段階の並びも選択可能。
- **状態の絞り込み**：未レビュー、台帳上で進行中、構想・Repo未照合、すべて。検索や開発段階フィルタと併用できる。
- **レスポンシブ**：PCは列で比較。幅720px以下は同じ情報を縦に並べ、名称と次の一手を優先。
- **演出**：ホバー時のわずかな反応のみで、読み取りを妨げる強いモーションなし。`prefers-reduced-motion`を尊重。
- **アクセシビリティ**：実際に押せるボタン、`<details>/<summary>`、可視フォーカス、明確なラベル、テキストだけで読み取れる状態。

## 意図的に実装していないこと

- AIチャットやCodexセッションの**最終利用時刻**の推測
- 根拠のない「80%完了」のような数値
- 文字の切り詰めによる情報の削除（詳細展開で全文表示）
- GitHub未レビュー状態の自動承認や、台帳の無断書換え
- GitHub以外の非公開情報取得。公開Pagesに非公開セッション情報を流し込まない

## 受入観点

1. PCで21件が横並びの比較しやすい行になり、見出しが「現在・最後・次」を示す。
2. 390pxと320pxで水平スクロールなし。名称・状態・最後のGitHubコミット・次の一手がすべて読める。
3. 一覧から詳細を開くとソース、証拠、比較リンク、検証依頼が見られる。
4. Repo未照合の構想を架空の更新日時で並べない。API取得失敗時に「変更なし」と表示しない。
5. 絞り込み・解除・並び替え・キーボード操作・コピーの回帰がない。
6. Javascript構文検査、GitHub Actions、Pages上の配信・実画面がそれぞれ成功。スマホ**実機**確認は別途必要。

更新範囲：`portfolio.html`、`portfolio-ui.css`、`portfolio-ui.js`、Pages/PR-CI、README・設計文書。既存`index.html`、`motion.css`、`motion.js`、`app.js`は変更せず、並行UI作業との競合を避ける。
