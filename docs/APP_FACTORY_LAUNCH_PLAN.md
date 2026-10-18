# App Factory 運用・稼働計画（公開受付版）

最終更新：2026-10-18 JST。担当：APP-001 / Session Deck管理基盤。

## 正本と現在の状態

- **稼働用リポジトリ正本：** [moyashimisosoup/app-factory](https://github.com/moyashimisosoup/app-factory)（**Public**）
- **初期実装：** [PR #1](https://github.com/moyashimisosoup/app-factory/pull/1)（公開受付スキーマ、作成Worker、GitHub Actions、CI、Issueテンプレート）
- **構文修正：** [PR #2](https://github.com/moyashimisosoup/app-factory/pull/2)（GitHub Actions YAMLエラー修正と回帰対策）
- **Public作成:** [PR #6](https://github.com/moyashimisosoup/app-factory/pull/6)で明示オプトインのschema v3を追加。Privateのschema v2をPublicへ自動変更しない。
- **運用保護・初期化:** [PR #9](https://github.com/moyashimisosoup/app-factory/pull/9)でRuleset設定手順、障害対応、トークン更新、Webスターター、台帳登録手順を追加。[main CI](https://github.com/moyashimisosoup/app-factory/actions/runs/39088721245)・[事前検査](https://github.com/moyashimisosoup/app-factory/actions/runs/39088721332)は成功。
- **検証済み：** [最新main CI](https://github.com/moyashimisosoup/app-factory/actions/runs/39022930675) および [事前検査・承認ラベル準備](https://github.com/moyashimisosoup/app-factory/actions/runs/39022930717) が成功。
- **初回の実生成成功（2026-10-17）：** ユーザーがGitHub Actions Secret `APP_FACTORY_REPO_CREATOR`を登録後、[公開Issue #4](https://github.com/moyashimisosoup/app-factory/issues/4)に本人承認ラベルを付与。[Actions #39026244548](https://github.com/moyashimisosoup/app-factory/actions/runs/39026244548)がsuccess、本人GitHub接続で新Repoの実在・Private設定・main/READMEを確認した。公開IssueへPrivate Repo URLは出さない。Secret値・有効期限は取得していない。
- この文書よりも**稼働リポジトリの[README](https://github.com/moyashimisosoup/app-factory/blob/main/README.md)**を優先する。Session Deckの[旧Privateブートストラップ](../bootstrap/app-factory/README.md)は履歴資料であり、現在の公開Factoryへ再導入しない。

## ChatGPTからの操作経路

| 依頼 | 操作・制約 |
| --- | --- |
| 「新アプリ案：〇〇」 | 構想整理、既存Repo・台帳との照合。書込みはしない |
| 「この案を採用してApp Factoryに申請」 | **公開して問題ない名前・一般的な説明のみ**を[公開Issue](https://github.com/moyashimisosoup/app-factory/issues/new/choose)へ登録。本人の申請意思を確認する |
| 「Issue #NNのRepo作成を承認」 | 当該Issue内容、既存Repo、承認先アカウントを再確認。本人の承認が明確なときのみ`factory-approved`ラベルを付ける |
| 承認済みIssueのActions成功 | 標準はPrivate（schema v2）、Publicは明示的公開承認付き（schema v3）。**URLを公開Issueやログには表示しない**。所有者がGitHubで申請どおりの可視性を確認 |
| Repo生成後 | 接続されたGitHubの権限があれば、初期README/AGENTS.md/CLAUDE.md/Web試作/計画を作り、commitを読戻す。Session Deck全体台帳へのAPP-ID登録は別操作 |

## 公開と非公開の境界

1. Factoryのソース・Issue・コメント・Actionsログは**Public**。申請に含めた名称・slug・説明は誰でも読める。学校関連、個人情報、非公開構想、会話URL、資格情報を**投稿しない**。
2. Issue本文の公開には`public_intake_ack:true`を必須とし、Private作成には`schema_version:2`、Public作成には`schema_version:3`・`public_repo_ack:true`が必要。公開申請への同意表示は自動機密検出の保証ではない。非公開の案は公開Issueに登録しない。
3. Workerは標準Privateで、**本人がPublicを明示承認したschema v3の場合だけPublicを作成**する。Private失敗時にPublicへ切り替えることはなく、既存Repoの上書き・削除も行わない。
4. `moyashimisosoup`によるIssue作成と承認ラベル付与の両方が必要。ラベル前はRepoを作らない。
5. 承認したslugをIssue botコメントに固定。作成前に読戻し、後から編集して別名を生成しようとする場合は中止する。
6. Creator用fine-grained PATは `repository_creation:write` の最小権限で**GitHub Actions Secret**にのみ保管。ChatGPTへトークンの値を渡さない。作成専用トークンと既存Repo編集権限は別。
7. 新Repo作成、初期ファイル配置、台帳登録、Pages公開は別マイルストーン。作成済みの根拠を取得するまでは完了扱いにしない。

## 次の採用案でも使う手順（初回生成は実証済み）

1. `moyashimisosoup`で[GitHub fine-grained PAT設定](https://github.com/settings/personal-access-tokens)を開き、**Repository creation: Read and write**だけを中心にした期限付きトークンを発行する。不要なAdministration/Deletion/Transfer系の権限は付けない。
2. [App FactoryのActions Secrets設定](https://github.com/moyashimisosoup/app-factory/settings/secrets/actions)から `APP_FACTORY_REPO_CREATOR` を登録する。**値をチャットに貼らない**。
3. 非機密で新規名の実際の採用案件を公開Issueで登録し、重複がないことを確認する。
4. 本人承認により`factory-approved`ラベルを付け、[Actions](https://github.com/moyashimisosoup/app-factory/actions)の`App Factory repository creation`結果を確認する。 2026-10-17にはこれをIssue #4で実施・成功した。
5. 作成先Repoを所有者の認証済みGitHubで開き、申請どおりのVisibility、デフォルトREADME、重複がないことを確認する。その後、[初期化・台帳連携手順](https://github.com/moyashimisosoup/app-factory/blob/main/docs/REPO_INITIALIZATION.md)に従い必要なスターターを配置し、APP-ID登録を**別に**検証する。

`factory-approved`ラベルは[main事前検査](https://github.com/moyashimisosoup/app-factory/actions/runs/39022930717)で準備するので、通常は手動作成不要。

GitHubの公式仕様：[repository_creation権限追加](https://github.blog/changelog/2026-10-13-github-app-improvements-for-least-privilege-and-management/) / [REST APIの作成権限](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user)

## 2026-10-18の運用保護チェックポイント

- 適用済み: App Factoryの[PR #9](https://github.com/moyashimisosoup/app-factory/pull/9)で初期化テンプレートと[復旧手順](https://github.com/moyashimisosoup/app-factory/blob/main/docs/INCIDENT_RUNBOOK.md)をmainへ保存し、CIを確認。
- 未適用: [main Ruleset推奨設定](https://github.com/moyashimisosoup/app-factory/blob/main/docs/BRANCH_PROTECTION.md)。2026-10-18のGETではRulesetなし。GitHub接続に新規Ruleset設定操作がないため、所有者によるSettingsでの設定・読戻しが残る。
- 未自動化: 別Repoへの初期ファイル書込み、Session DeckのAPP-ID台帳登録、Web公開は独立作業。作成専用PATにこれらの書込み権限を追加しない。
- **次の1操作**: app-factoryのmain用Rulesetを設定し、有効化・CI必須・force-push禁止を読戻し確認。

## 過去の設計と整合

2026-10-17の初期案では専用受付RepoもPrivateとする設計だったが、**ユーザーがApp FactoryのPublic運用を明示承認**したため更新した。旧ブートストラップ・文書にある「private Factory」「schema_version 1」「Secret未導入でもRepo作成可能」と読める文面は**現行運用には適用しない**。

専用Secret登録前に、接続GitHubからのアプリ案登録・承認までを実験する場合は、**発行したIssueに承認ラベルを付けない**ことで書込みなしの確認ができる。ただし公開Issueの作成自体は公開投稿であるため、非機密情報のみ。
