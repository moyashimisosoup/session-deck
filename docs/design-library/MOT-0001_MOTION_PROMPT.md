# MOT-0001｜Motion Prompt データベース索引

最終照合：2026-10-30 JST。共通索引 [motion-db.json](./motion-db.json) に **192件** を登録。上流の公開 JSON のバージョンは `1.6950972783`、取得したGitHub blob SHAは `3285e62996797411ddb1db865cf57f31512423a0`。

- 出典：[Motion Prompt](https://showheyohtaki.github.io/motion-prompt/) / [GitHub](https://github.com/showheyohtaki/motion-prompt)
- 著作者：Shohei Ohtaki（大滝昇平）© 2026
- ライセンス：MIT。[ライセンス全文](./MOTION_THIRD_PARTY_NOTICES.md)
- 元のカタログは 8パック×24件。**Canvas 2D実装コードは本リポジトリへ複製せず、元の仕様・コード・プロンプトへURLで参照**する。
- 各索引の `cycleSec` はループの長さであり、UI遷移の推奨実行時間ではない。

## 収録カテゴリ

- `motion`：モーショングラフィックスの動き（24件、#001–#024）
- `camera`：カメラワークと切り替え（24件、#025–#048）
- `ui`：UIパーツの名前（24件、#049–#072）
- `lp`：LP・Webサイトの演出（24件、#073–#096）
- `photo`：写真の表現・光と画風（24件、#097–#120）
- `motion2`：モーショングラフィックスの演出 第2弾（24件、#121–#144）
- `lp2`：LP・Webサイトの演出 第2弾（24件、#145–#168）
- `camera2`：カメラワークと切り替え 第2弾（24件、#169–#192）

## 開発での呼び出し

> 共通デザインライブラリ MOT-0001 の `MOT-MP-001` のデモ・仕様を確認し、現在のアプリのUI構造に合わせて実装してください。素材や色・テキストは現行デザインに合わせ、アニメーションの種類だけを参照してください。

元の動画・実装・全文仕様を利用する場合は、元のライセンスと著作権表示を維持します。元の製品には `npx skills add showheyohtaki/motion-prompt` という公式スキル導入方法もありますが、**この登録ではインストールしていません**。

検索は [search-motion.mjs](./search-motion.mjs) を使います。例：`node docs/design-library/search-motion.mjs スライド`。
