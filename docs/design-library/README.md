# 共通デザインライブラリ

アプリ・画像・資料の制作で参照する、**プロジェクト横断のデザイン資料台帳**。個別アプリの本番アセット置き場とは分離する。

| ID | 分類 | 資料 | 出典 | 保存状態 |
|---|---|---|---|---|
| COL-0001 | 配色・カラーパレット | [AI配色の名前100選](./COL-0001_AI_COLOR_NAMES_100.md) | [CodeX実践塾（X）](https://x.com/Codex_jisen/status/2111065217006473664) | 画像4件の外部URL・出典を登録済み。色名/HEXの100件個別抽出・画像バイナリの内製保存は未実施 |

| MOT-0001 | モーション・AI指示 | [Motion Prompt索引](./MOT-0001_MOTION_PROMPT.md) | [Motion Prompt](https://showheyohtaki.github.io/motion-prompt/) | MIT、192件を番号付きでデータベース化 |
| MOT-0002 | モーション・イージング | [TakayuStudio研究索引](./MOT-0002_TAKAYU_REFERENCE.md) | [モーションリファレンス](https://motion-reference.takayustudio.jp/) | 782件掲載中の代表40件。参照情報のみ、素材・コード転載なし |
| MOT-CUSTOM-001 | 独立した動きの実装レシピ | [右端列から列内ランダムスライドイン](./MOT-CUSTOM-001_RIGHT_TO_LEFT_GRID.md) | オリジナル | 実装レシピ・検証条件を登録済み |

## モーションデータベース

- [motion-db.json](./motion-db.json)：全233件（Motion Prompt 192＋TakayuStudio代表40＋独自レシピ1）の機械可読索引。出典・ライセンス・元デモ・タグ・時間・イージング等を分離記録。
- [search-motion.mjs](./search-motion.mjs)：Node.jsによるローカル検索（外部通信なし）。例：`node docs/design-library/search-motion.mjs グリッド`。
- [MOTION_THIRD_PARTY_NOTICES.md](./MOTION_THIRD_PARTY_NOTICES.md)：第三者資料の権利・出典・利用条件。
- 呼出し例：`共通デザインライブラリの MOT-0002 から、タイルが順に現れる動きを探して。` / `MOT-CUSTOM-001を実装して。`

## 運用原則

- 各参考資料をIDで参照し、出典URL、登録日、利用目的、データの確認状況を残す。
- 「参考資料」「許諾・検証済み本番素材」「アプリ専用ART」を混同しない。
- 第三者の画像は権利を確認せず自分の制作素材としてコピーしない。
- 配色・構図は特定アプリへ強制適用せず、実画面の可読性・アクセシビリティを優先する。
- [APP-003広告参考画像ライブラリ](https://github.com/yama-books/mansion-poet/blob/main/docs/APP003_REFERENCE_IMAGE_LIBRARY_SPEC.md)は目的と権利フローの異なる独立ライブラリとして管理する。
