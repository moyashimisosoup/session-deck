# App Factory 運用・稼働計画（公開受付版）

最終更新：2026-10-17 JST。担当：APP-001 / Session Deck管理基盤。

## 正本と現在の状態

- **稼働用リポジトリ正本：** [moyashimisosoup/app-factory](https://github.com/moyashimisosoup/app-factory)（**Public**）
- **初期実装：** [PR #1](https://github.com/moyashimisosoup/app-factory/pull/1)（Public向けスキーマ、作成Worker、GitHub Actions、CI、Issueテンプレート）
- **構文修正：** [PR #2](https://github.com/moyashimisosoup/app-factory/pull/2)（GitHub Actions YAMLエラー修正と回帰対策）
- **検証済み：** [最新main CI](https://github.com/moyashimisosoup/app-factory/actions/runs/39022930675) および [事前検査・承認ラベル準備](https://github.com/moyashimisosoup/app-factory/actions/runs/39022930717) が成功。
- **未完了：** 所有者によるGitHub Actions Secret `APP_FACTORY_REPO_CREATOR`の設定と、**実際の新Private Repo作成の疎通確認**。Secretの存在は接続GitHubツールでは照合できないため、実生成を確認するまでは稼働完了とはしない。
- この文書よりも**稼働リポジトリの[README](https://github.com/moyashimisosoup/app-factory/blob/main/README.md)**を優先する。Session Deckの[旧Privateブートストラップ](../bootstrap/app-factory/README.md)は履歴資料であり、現在の公開Factoryへ再導入しない。

## ChatGPTからの操作経路

| 依頼 | 操作・制約 |
| --- | --- |
| 「新アプリ案：〇〇」 | 構想整理、既存Repo・台帳との照合。書込みはしない |
| 「この案を採用してApp Factoryに申請」 | **公開して問題ない名前・一般的な説明のみ**を[公開Issue](https://github.com/moyashimisosoup/app-factory/issues/new/choose)へ登録。本人の申請意思を確認する |
| 「Issue #NNのRepo作成を承認」 | 当該Issue内容、既存Repo、承認先アカウントを再確認。本人の承認が明確なときのみ`factory-approved`ラベルを付ける |
| 承認済みIssueのActions成功 | 新RepoをPrivateで作成。**URLを公開Issueやログには表示しない**。所有者が認証済みGitHubでprivate状態を確認 |
| Repo生成後 | 接続されたGitHubの権限があれば、初期README/AGENTS.md/CLAUDE.md/Web試作/計画を作り、commitを読戻す。Session Deck全体台帳へのAPP-ID登録は別操作 |

## 公開と非公開の境界

1. Factoryのソース・Issue・コメント・Actionsログは**Public**。申請に含めた名称・slug・説明は誰でも読める。学校関連、個人情報、非公開構想、会話URL、資格情報を**投稿しない**。
2. Issueには`schema_version:2`、`public_intake_ack:true`を必須とする。これは同意表示であり、自動の個人情報漏洩防止保証ではない。機密性のある案は公開Issueへ登録せず、非公開の管理方法を別途用意する。
3. Workerは`private:true`の新Repoのみを作成し、失敗時のPublic作成や既存Repoの上書き・削除は行わない。
4. `moyashimisosoup`によるIssue作成と承認ラベル付与の両方が必要。ラベル前はRepoを作らない。
5. 承認したslugをIssue botコメントに固定。作成前に読戻し、後から編集して別名を生成しようとする場合は中止する。
6. Creator用fine-grained PATは `repository_creation:write` の最小権限で**GitHub Actions Secret**にのみ保管。ChatGPTへトークンの値を渡さない。作成専用トークンと既存Repo編集権限は別。
7. 新Repo作成、初期ファイル配置、台帳登録、Pages公開は別マイルストーン。作成済みの根拠を取得するまでは完了扱いにしない。

## 最後の有効化手順

1. `moyashimisosoup`で[GitHub fine-grained PAT設定](https://github.com/settings/personal-access-tokens)を開き、**Repository creation: Read and write**だけを中心にした期限付きトークンを発行する。不要なAdministration/Deletion/Transfer系の権限は付けない。
2. [App FactoryのActions Secrets設定](https://github.com/moyashimisosoup/app-factory/settings/secrets/actions)から `APP_FACTORY_REPO_CREATOR` を登録する。**値をチャットに貼らない**。
3. 非機密で新規名の実際の採用案件を公開Issueで登録し、重複がないことを確認する。
4. 本人承認により`factory-approved`ラベルを付け、[Actions](https://github.com/moyashimisosoup/app-factory/actions)の`App Factory private repository creation`結果を確認する。
5. 作成先Repoを所有者の認証済みGitHubで開き、Visibility Private、デフォルトREADME、重複がないことを確認する。その後、必要なスターター構成やAPP-ID登録を進める。

`factory-approved`ラベルは[main事前検査](https://github.com/moyashimisosoup/app-factory/actions/runs/39022930717)で準備するので、通常は手動作成不要。

GitHubの公式仕様：[repository_creation権限追加](https://github.blog/changelog/2026-10-13-github-app-improvements-for-least-privilege-and-management/) / [REST APIの作成権限](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user)

## 過去の設計と整合

2026-10-17の初期案では専用受付RepoもPrivateとする設計だったが、**ユーザーがApp FactoryのPublic運用を明示承認**したため更新した。旧ブートストラップ・文書にある「private Factory」「schema_version 1」「Secret未導入でもRepo作成可能」と読める文面は**現行運用には適用しない**。

専用Secret登録前に、接続GitHubからのアプリ案登録・承認までを実験する場合は、**発行したIssueに承認ラベルを付けない**ことで書込みなしの確認ができる。ただし公開Issueの作成自体は公開投稿であるため、非機密情報のみ。
