---
name: 新アプリ採用申請
about: 採用された新アプリ用の非公開GitHubリポジトリを作成する申請（承認ラベルを付けるまでは作成しません）
title: "APP FACTORY: "
labels: []
assignees: []
---

<!-- APP_FACTORY_REQUEST_V1 -->
~~~json
{
  "schema_version": 1,
  "repo_name": "example-learning-tool",
  "app_name": "学習アプリの仮称",
  "description": "中学生向けのWeb教材を試作する",
  "visibility": "private",
  "decision": "adopted"
}
~~~

## 承認前の確認

- [ ] Session Deckの台帳と既存GitHubリポジトリを照合し、重複作成でないことを確認した
- [ ] リポジトリ名は半角英小文字・数字・ハイフンのみで、既存Repoと競合しない
- [ ] 非公開で作成してよく、公開は別途承認する
- [ ] アイデアだけでなく、この案件を開発へ採用した

**注意：** Issueを開いただけでは作成しません。上のJSONを書き換えたあと、オーナーが一度だけ承認ラベル \`factory-approved\` を付けると作成ジョブが起動します。

GitHub Actionsが成功して新規Repoの非公開状態とURLを返すまで「作成済み」と報告しません。初期ファイルの整備とSession Deck台帳へのAPP-ID登録は次工程です。
