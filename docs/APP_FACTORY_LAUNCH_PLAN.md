# App Factory / 新アプリ採用からGitHub作成まで（初期実装 v0.1）

策定: 2026-10-17 JST。担当: APP-001 / Session Deck管理基盤。
コード正本: [bootstrap/app-factory](../bootstrap/app-factory/README.md)。

## 意図した操作

| ChatGPTでの発言 | 既定の扱い | GitHub書込み |
| --- | --- | --- |
| 「新アプリ案：〇〇」 | 構想を整理し、APP_PORTFOLIOと既存Repoの重複を調べる | **なし**。採否未確定 |
| 「この新アプリ案を採用」 | slugと所有者（当面moyashimisosoup）とprivate既定を確認して非公開FactoryのIssueへ登録 | Issue作成のみ。新Repoはまだない |
| 「この案のRepo作成を承認」 | Issue内容と既存Repoを再照合し、本人承認に基づく `factory-approved` ラベル付与を実行 | GitHub ActionsがRepo作成。非公開だけ |
| 作成成功後 | GitHubからRepo実在・private・commitを読戻し、初期ファイル配置・台帳への登録 | 権限がある範囲だけ実行。失敗は未完了 |

ChatGPTがプロジェクト設定を自分で変更したり、ユーザー発言なしに承認ラベルを付けたり、新Repoへ自動接続できると仮定しない。

## 安全性を優先したv0.1境界

- **受付はprivateの専用 `moyashimisosoup/app-factory` Repo**。公開のSession DeckのIssuesには申請本文を残さない。
- Issue authorとapproval actorの双方が `moyashimisosoup` であり、専用Repoで `factory-approved` が付与されたときに限りWorkflowを実行。
- 新Repo作成APIは `POST /user/repos` に固定し、`private:true`、`auto_init:true`、所有者・認証主体の照合を必須にする。公開のフォールバックはない。
- `repo_name` の形式はサーバ側で検証。既存名は保存先の現在状態で照合し、衝突時は何も上書きしない。リトライ時は同じIssueの`homepage`を識別子として照合。
- 承認後にIssueを編集し再承認しても、別名のリポジトリを作成しない。Action botが非公開Issueへ`APP_FACTORY_APPROVAL_LOCK_V1`を事前保存し、確認したslugを固定。書込み・読戻し失敗時は**作成を中止**する。
- 新権限 `repository_creation:write`（2026-10-13追加）を持つ専用資格情報をAction Secretに保管する。既存Repoへの広い管理権限は初期段階で付与しない。
- 失敗時に別のRepo名へ自動変更しない。Issueへ秘密・実セッションURL・学校情報などを書かない。
- **空Repoの生成と初期コード配置は分ける**。最初はGitHubが用意する標準READMEのみ。追加ファイルはGithubコネクタの権限確認後に作成。
- **APP-IDはGitHub全体台帳へ登録できた時点で確定**。番号を推測で振らない。別リポジトリへの公開・Pagesデプロイは別件の承認が必要。

## 実際の導入段階

### M0：今回実施

公開Session Deckに**汎用的な、秘密を含まない**移植用コード・tests・Workflow・Issue template・導入手順を保存する。CIでofflineユニットテストを実行する。新Repoそのものはまだ作成しない。

### M1：ユーザーの一回限りの操作

1. ブラウザで [GitHub 新規リポジトリ作成](https://github.com/new) を開く。
2. Owner=`moyashimisosoup`、Repository name=`app-factory`、Visibility=**Private**、READMEを追加して作成する。
3. ChatGPTに作成したRepoのURLを伝える。
4. ChatGPTが[ブートストラップコード](../bootstrap/app-factory/README.md)をprivate Repoルートに配置。専用Repoの **Actions → App Factory offline readiness tests → Run workflow** を1回だけ実行してテスト成功を確認。**秘密鍵なしで検査可能**だが、private RepoのActions分が必要。すでに利用枠不足なら成功扱いせず、予算や実行環境を整えるまで停止する。既存TradingSystem用self-hostedランナーの勝手な転用は禁止。
5. ユーザーがGitHubの設定画面だけで専用fine-grained PATを作成し、Factory private Repoの`APP_FACTORY_REPO_CREATOR` Action Secretに登録する。必要なのはRepo作成の`repository_creation:write`権限であり、既存Repoの削除・移管権限は付けない。ChatGPTにtoken文字列を渡さない。`APP_FACTORY_ISSUE_TOKEN`はGitHub Actions標準の`github.token`から自動供給され、手動設定不要。
6. private Repoに`factory-approved`ラベルを一度用意する。

### M2：最初の実例

- 最初は **未承認** Issueを1件作り、Repoが生成されていないことを確認。Issueテンプレートの`example-learning-tool`は予約名なので誤って承認しても作成できない。
- 実際に採用するアプリ案を承認してIssueへラベルを付ける。
- Actionsログ・作成RepoのURLとprivate状態を検証する。
- 再実行しても同じIssueから重複生成されないことをテストする。
- 新Repoへの初期ファイル保存、Session Deck台帳への追加とreadbackは**次工程として明示的に実施**する。新Repoが接続プラグインから見えなければユーザーがアクセス範囲を確認。

## 実行料金とフォールバック

- private GitHub Actionsの`ubuntu-latest`はアカウントの無料分を使用し、超過は課金対象になり得る。無料枠枯渇時はWorkflowが実行不可の場合がある。[GitHub公式請求仕様](https://docs.github.com/en/actions/concepts/billing-and-usage)。
- 初回は`preflight.yml`を**手動1回だけ**起動し、作成実行は承認Issueの`factory-approved`を付けた時だけ。失敗時に自動再試行して利用分を浪費しない。
- 既存のTradingSystem用WSLセルフホストRunnerは別Repoに登録済みであり、App Factoryへ自動接続されない。別途安全に登録・承認されない限り使わない。
- Actionsが使えない場合は、設定復旧までRepo自動作成を保留し、ユーザーがGitHub UIで個別Repoを作る暫定運用に切り替えられる。公開Repo／Issueへ非公開アイデアを移さない。

## ChatGPTプロジェクト共通指示への短い追記案

既存のプロジェクト設定はユーザーが手動編集する。App Factory private Repoを立ち上げ、最初の実例を確認できた後に、次の1段落を追加する。

> 「新アプリ案：」は構想登録として扱い、既存のSession Deck台帳とGitHub Repoを先に照合する。この段階でRepoを勝手に作らない。「採用」「作成承認」が明確な場合のみ、専用の非公開App Factoryに申請し、本人承認のラベル操作を経てprivate Repo生成を進める。作成成功・初期ファイル配置・台帳登録・Web公開を別段階として実証し、未確認・未保存を完了と書かない。機密情報を公開GitHubのIssueへ投稿しない。

**現在はM0の導入途上であり、この指示を貼っただけではGitHubの自動作成機構は作動しない。**

## 外部仕様

- [GitHubリポジトリ生成REST API](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user)
- [2026-10-13 GitHubの新しい最小Repository creation権限](https://github.blog/changelog/2026-10-13-github-app-improvements-for-least-privilege-and-management/)
- [GitHub Actions Issue labeled event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issues)
