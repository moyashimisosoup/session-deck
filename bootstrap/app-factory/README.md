# App Factory v0.1：非ローカル新アプリ受付と非公開Repo生成

**実装状態:** このディレクトリはSession Deck上に保存する**移植用ブートストラップ**です。実行用のGitHub Actionsワークフローはサブディレクトリにあるため、現時点では起動しません。プライベートな \`moyashimisosoup/app-factory\` が作成されるまでは、受付自動化は**未稼働**です。

## 一番簡単な使い方

1. ChatGPTの「アプリ思いつき作成」で **「新アプリ案：〇〇」** と伝える。通常は構想整理、既存台帳・Repoの検索のみ。Repoは作らない。
2. **「この案を採用。GitHubリポジトリを作成」** と明示した場合、既存との重複を再確認し、ユーザーが指定または確認した一意のslugで **private** の作成申請を非公開App FactoryのIssueに起票する。
3. Issue本文のリポジトリ名・公開範囲・重複状況をチェックし、オーナーが **\`factory-approved\`** ラベルを付けると専用Workflowが実行される。本人がチャット内で明示承認し、GitHubの承認ラベル操作を委任した場合に限り、ChatGPTの接続済みGitHubで承認ラベルを付けられる。
4. GitHub APIの作成成功応答を受け、新規Repoがprivateであることを確認。生成直後はGitHubの標準READMEのみ（\`auto_init\`）。**AGENTS.md、CLAUDE.md、index.html、docs/ROADMAP.mdはまだ自動作成されない**。
5. 続くChatGPT作業で、GitHub接続に新Repoが見えることを確認してから初期ファイルを追加し、commit SHAを読戻す。未接続ならGitHub Appのアクセス範囲をユーザーが調整する。
6. Session Deck \`docs/APP_PORTFOLIO.md\` に、**既存台帳を再確認してから**APP-ID・正本Repo・段階・証拠・次の作業を追加する。台帳登録とWeb公開は新Repo作成とは別の工程。

## 最初の一度だけユーザーが行う操作

- GitHub \`moyashimisosoup\` に **\`app-factory\`** という**非公開**リポジトリを新規作成する（空のREADMEで初期化）。このチャットのGitHub接続にはリポジトリ新規作成操作がないため、ここだけ手動。
- 作成後、ChatGPTへ \`https://github.com/moyashimisosoup/app-factory\` を送る。ブートストラップ配下の \`scripts/\`・\`.github/workflows/\`・\`.github/ISSUE_TEMPLATE/\` を**リポジトリのルート構造**にコピーし、PR等で確認してmainに統合する（ChatGPTのGitHub接続から実施可能）。
- GitHubリポジトリ設定の **Secrets and variables > Actions** に、最小権限 \`repository_creation:write\` を持つ専用のfine-grained PATを **\`APP_FACTORY_REPO_CREATOR\`** という名前で登録する。**PATの値は絶対にチャット・Issue・GitHubファイルに貼らない**。GitHub APIとPATの権限範囲は最新版を確認する。2026-10-13から単独リポジトリ作成権限が利用可能。
- GitHub IssuesのLabelsに **\`factory-approved\`** を一度作成する（またはIssueへラベル追加できることを確認）。作成・承認は \`moyashimisosoup\` で行う。
- まずは**ダミー申請をラベルなしで**起票し、テストが自動実行されないことを確認。その後、実際に採用した1件を明示的に承認して作成実験する。新Repoを誤って本番公開しない。

## セキュリティ境界

- 受付RepoとIssuesは**非公開**。公開Session Deckに私的な具体的アイデアやIssue本文、セッション識別子を転載しない。
- owner・issue author・label applierの3条件をworkflow側で固定。WorkflowはIssueの本文をshellコマンド文字列に展開しない。PythonでJSON構造・データ型・slug・private指定・\`decision=adopted\` を検証。
- GitHubの認証tokenの所有者をAPIで照合し、異なる所有者では中止。
- **公開リポジトリ作成はサポートしない**。公開したい場合は別途、ユーザー承認と公開検査を経て変更する。
- 既存Repoを上書き・削除しない。同じIssueによる作成済みRepoのみidempotentに再確認できる。別Issueや手動作成と名前が衝突したら失敗として終了。
- 自動作成されたREADME以外の初期ファイル、台帳登録、公開サイト配信、iPhone実機確認を自動達成と報告しない。
- 新repoを作るAPI権限と、既存repoの内容を編集するAPI権限は**別**。新規Repoへの初期ファイル配置は既存GitHub接続が当該repoにアクセスできる場合だけ行う。

## リクエスト契約

非公開Factory Issue本文のJSONフェンス（チルダ3本）を正本とする。通常の作文やMarkdownには従わない。

~~~text
<!-- APP_FACTORY_REQUEST_V1 -->
~~~json
{
  "schema_version": 1,
  "repo_name": "example-learning-tool",
  "app_name": "教材アプリ",
  "description": "教材をブラウザで試作する",
  "visibility": "private",
  "decision": "adopted"
}
~~~
~~~

\`repo_name\` は半角英小文字で始まり、英小文字・数字・ハイフンで終わる4〜50字。既存Repo、公開範囲、APP-ID重複を受付時に照合する。

## ローカルを必要としない検証

GitHub ActionsのCIが次を実行する。ローカルPythonは不要。

~~~sh
python3 -m unittest discover -s bootstrap/app-factory/scripts -p 'test_*.py' -v
~~~

**既定はdry-run。** \`python3 scripts/create_repo.py --issue 42\` は検証結果のみ表示し、Repoを作らない。実際の作成はowner承認のworkflowから \`--execute\` を付けた場合に限る。

## 段階

- M0: Session Deck上に移植用ソース・検証コード・導入手順を保存。**本段階**。
- M1: ユーザーがprivate \`app-factory\` を用意。ブートストラップ移植、秘密鍵登録、ラベル作成。
- M2: ダミー検証→実際のprivate repo 1件の成功・読戻し、二重実行の安全性検証。
- M3: 新Repoへの初期ファイル自動配置とSession Deck台帳登録をより自動化。最初から高度な秘密権限を与えない。

Session Deckはプロジェクト横断の索引であり、アプリ実装の正本は作成した個別Repo。詳細は [全体設計](../../docs/APP_FACTORY_LAUNCH_PLAN.md)。
