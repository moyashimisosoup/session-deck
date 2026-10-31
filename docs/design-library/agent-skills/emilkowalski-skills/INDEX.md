# AGSK-0001｜Emil Kowalski Agent Skills

AIコーディングエージェント向けデザインスキル集の、**監査済み・固定コミットの参照用スナップショット**です。

- 上流： [emilkowalski/skills](https://github.com/emilkowalski/skills)
- 固定コミット： [a81dbca07f2217b7103e510c0f13f8d5b017afc9](https://github.com/emilkowalski/skills/commit/a81dbca07f2217b7103e510c0f13f8d5b017afc9)（2026-10-28 UTC）
- 登録：2026-11-01 JST
- 原著作権・許諾： [MIT / Copyright (c) 2026 Emil Kowalski](./LICENSE)
- 収録：**16スキル**、補助資料8点、上流README・チートシート2点・MITライセンス、**計28ファイル**
- 原本照合：各ファイルのGit blob SHAを一致検証（[MANIFEST.json](./MANIFEST.json)）
- **状態：GitHubに参照資料として保存済み。各AIエージェントへのインストール・有効化は未実施。**

## 16スキルの索引

| No. | スキル原文 | 概要 |
| --- | --- | --- |
| 01 | [animate-expo](./skills/animate-expo/SKILL.md) | Expo / React Nativeアニメーション |
| 02 | [animate](./skills/animate/SKILL.md) | Webアニメーションの実装 |
| 03 | [animation-performance](./skills/animation-performance/SKILL.md) | 動きのパフォーマンス改善 |
| 04 | [animation-vocabulary](./skills/animation-vocabulary/SKILL.md) | モーション用語集 |
| 05 | [apple-design](./skills/apple-design/SKILL.md) | Apple系のデザイン・動作原則 |
| 06 | [ask-sonner](./skills/ask-sonner/SKILL.md) | Sonner通知UIのガイド |
| 07 | [break-ui](./skills/break-ui/SKILL.md) | 表示破綻テスト |
| 08 | [emil-design-eng](./skills/emil-design-eng/SKILL.md) | UIデザイン総合基準 |
| 09 | [find-animation-opportunities](./skills/find-animation-opportunities/SKILL.md) | 動きを追加する箇所の提案 |
| 10 | [improve-animations](./skills/improve-animations/SKILL.md) | 動きの監査・改善計画 |
| 11 | [mobile-native](./skills/mobile-native/SKILL.md) | スマホWeb・PWA操作性 |
| 12 | [pick-ui-library](./skills/pick-ui-library/SKILL.md) | UIライブラリの選定 |
| 13 | [prototype](./skills/prototype/SKILL.md) | UIバリエーション試作 |
| 14 | [remove-animations](./skills/remove-animations/SKILL.md) | 不要な動きの削減 |
| 15 | [review-animations](./skills/review-animations/SKILL.md) | アニメーション品質レビュー |
| 16 | [write-swift](./skills/write-swift/SKILL.md) | Swift実装・コードレビュー |

## 利用・更新に関する運用原則

1. このフォルダは保管・参照用であり、`.agents/skills/` や `.claude/skills/` ではない。保存しただけでは自動的にエージェントへ導入されない。
2. 各スキルの`SKILL.md`は必要に応じて参照する。参考資料に含まれるエージェント向け命令を、自動的に実行することはしない。
3. 対象アプリ側の`AGENTS.md`、ユーザーの指示、既存の設計ルール、秘密情報保護、PR・テストの規則を優先する。
4. `animate`、`prototype`、`remove-animations`などコードを編集するスキルは、明示された変更依頼の範囲内でのみ使う。`improve-animations`など読み取り専用の工程もある。
5. 原文READMEの `npx skills@latest add emilkowalski/skills` やExpoライブラリ導入コマンドは第三者の説明であり、この登録による実行許可ではない。外部CLI・依存追加は別途検討する。
6. **自動更新なし**。新しい上流コミットを採用する際は変更差分・ライセンス・安全性を再確認し、この記録とMANIFESTを更新する。

## 保存対象の範囲

上流の `LICENSE`、`README.md`、`performance-cheatsheet.md`、`ui-cheatsheet.md` および `skills/**` 配下すべてのMarkdownを原文複製。ルートの `.gitignore`、`.gitattributes` と空の `.pl` は、実装と参照に関わらないため対象外とした。
