# Session Deck

**ChatGPT・Claude Code・Codexの作業とセッションを横断して俯瞰するWebダッシュボード。**

> v0.1.0 は操作可能な**デモ試作版**です。同梱されているプロジェクト・作業・セッション・引継ぎは架空の情報で、実際のAIサービスやGitHubには接続しません。

## デモを動かす

リポジトリの `index.html` を、`styles.css`・`app.js` と同じフォルダに置いて開きます。ブラウザで動く静的アプリで、パッケージのインストールやサーバー側の処理は不要です。

ローカルHTTPサーバーを利用する場合:

```sh
python -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。

GitHub Pagesの公開方式は `Settings → Pages → Build and deployment → Source: GitHub Actions` を使用します。`main` のWebアプリ本体（`index.html` / `styles.css` / `app.js`）または `.github/workflows/deploy-pages.yml` を更新すると、[Deploy Session Deck to GitHub Pages](../../actions/workflows/deploy-pages.yml) がGitHubホストのUbuntu上で走り、**静的デモの3ファイルだけ**をPagesに配信します。手動実行（workflow_dispatch）も可能です。公開URL: https://moyashimisosoup.github.io/session-deck/ 。**ワークフローの成功と実URLでの読み戻しの両方で配信を検証してください。**

## v0.1で試せること

- ダッシュボード、作業一覧、セッション一覧、引継ぎ記録の切替
- 作業/セッションの検索、AI・プロジェクト・状態による絞込み
- 作業・セッションの詳細、正式名と実表示名の差異の可視化
- デモ作業の登録・状態変更、セッション追加、引継ぎメモ登録
- 正式名 `【短い作業名】MMDD・作業番号・具体的内容` の作成・コピー
- ブラウザ内保存（localStorage）、JSONエクスポート、初期化
- PC・モバイル対応レイアウト（実機検証はこれから）

## 現状と制約

- **GitHubへ保存済み**: HTML・CSS・JavaScriptと設計文書。
- **未確認**: GitHub Pages配信状態、iPhone実機での動作、ブラウザE2Eテスト。
- **未実装**: 実サービスのセッション自動取得、オンライン同期、実チャット名の自動改名、認証付きデータベース。
- ブラウザ上のデモ編集は実際のセッション・GitHub・Claude Code / Codexの作業には影響しません。
- このデモに入力したデータはブラウザのlocalStorageに保存されます。会話本文、実セッションID、内部URL、口座情報、認証情報など**実データを入力しない**でください。JSONエクスポートにも入力内容が入ります。
- ブラウザストレージは端末間同期されず、消去・プライベートブラウズなどで失われ得ます。
- デモに表示される「進行中」や「最終更新」は架空データであり、実際の稼働確認を意味しません。

## 構成

| ファイル | 役割 |
|---|---|
| [index.html](index.html) | 画面のHTML |
| [styles.css](styles.css) | レスポンシブな外観 |
| [app.js](app.js) | 架空データ、画面操作、ローカル保存 |
| [docs/CONCEPT.md](docs/CONCEPT.md) | 初期構想、原則、データモデル |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 今後の優先順位、実装フェーズと完了条件 |
| [docs/INTEGRATION_PLAN.md](docs/INTEGRATION_PLAN.md) | 外部連携、安全境界、データの公開・非公開 |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | 実機・ブラウザ・安全性の検証計画 |

## 次の段階

1. PCとiPhoneでの表示・操作テストを実施し、必要なUI修正を行う。
2. GitHub Pagesで公開する場合は設定と実URLを確認する。
3. 非公開データ管理の方式を決め、作業IDとセッションIDのスキーマを確定する。
4. GitHub読取り連携、Claude Code / Codexの既存監視出力との接続、ChatGPT拡張連携を順次検証する。

より詳しくは[開発ロードマップ](docs/ROADMAP.md)を参照してください。TradingSystemの運用正本や権限境界を、このリポジトリが変更することはありません。
