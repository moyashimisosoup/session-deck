# APP-007 koten：複数アプリの作業入口

確認日時：2026-10-17 10:42 JST。これは**公開GitHubを読んだ時点のスナップショット**であり、AIセッションの最終操作や担当claimを示さない。最新のPR・ブランチ・CIは都度取得する。

| 領域 | 公開Repo内の主な場所 | 先に読む資料 | 進行の見方 |
|---|---|---|---|
| 百人一首練習帳 | `packages/hyakunin/`、`packages/shared/` | [README](https://github.com/yama-books/koten/blob/main/README.md)、[新しいAgentの入口](https://github.com/yama-books/koten/blob/main/AGENTS.md) | 主Repo `main`のコミット・テスト・配信と実機検証は別 |
| 活用判別・古典活用 | `conj/` | [conj README](https://github.com/yama-books/koten/blob/main/conj/README.md) ／ [HANDOFF](https://github.com/yama-books/koten/blob/main/conj/HANDOFF.md) | [PR #118](https://github.com/yama-books/koten/pull/118)（Draft）、担当者やCIは都度確認 |
| 変体仮名 | `vintage-kana/` | [vintage-kana README](https://github.com/yama-books/koten/blob/main/vintage-kana/README.md) ／ [HANDOFF](https://github.com/yama-books/koten/blob/main/vintage-kana/HANDOFF.md) | [PR #108](https://github.com/yama-books/koten/pull/108)（Open）、[#98](https://github.com/yama-books/koten/pull/98)・[#77](https://github.com/yama-books/koten/pull/77)（Draft） |
| Checkpoint | `checkpoint/` | [checkpoint README](https://github.com/yama-books/koten/blob/main/checkpoint/README.md) ／ [HANDOFF](https://github.com/yama-books/koten/blob/main/checkpoint/HANDOFF.md) | 専用 `checkpoint-main`の統合ルールを優先 |

**資料の問題点**：`docs/HANDOFF.md` は2026-10-17確認時に約38万文字。古い「次にやること」が多く、全文を新セッションへ渡すのは誤判断とコンテキスト浪費の原因。今後は領域を指定して新しい関連節だけ参照し、古い全文は履歴として保持する。

**安全境界**：公開コードの正本は [yama-books/koten](https://github.com/yama-books/koten)；内部の作業調整や非公開設計資料は権限付きの別保管先に置く。公開Repo上の現行 `docs/` には歴史的な内部資料も混在しており、**公開GitHub上に書いたメモは非公開ではない**。

新しいAIが作業するときの順序：`APP-007／領域／登録済みwork_id確認 → 最新HEAD/PR/CI・競合を確認 → 局所資料を読む → 作業 → 証拠を記録 → 次の一手`。未登録のwork_idや古い出力を稼働中と誤認しない。

**毎回答の省スペース表示例**：

`◦ APP-007/koten:conj｜状態:レビュー待ち｜確認:10:42 JST（観測）｜根拠:PR #118｜次:差分・CI確認`

設定方法：[Chat Progress Bar](CHAT_PROGRESS_BAR.md)。Session Deckの公開台帳はアプリ単位の要約だけ。各Workの実セッション情報やロックは認証された非公開ストアが扱う。内部の詳細運用文書は公開URLへ転載しない。
