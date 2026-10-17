# 公開GitHubリポジトリの整理候補（初回監査）

監査日: **2026-10-17 JST**  
状態: **確認候補の棚卸しのみ**。GitHubのArchive/Delete/Repo移管や他リポジトリ編集は実施しない。  
対象: \`moyashimisosoup\` と \`yama-books\` の**公開**リポジトリ（GitHub APIの\`/users/{owner}/repos?per_page=100&type=owner\`で取得）。非公開のRepo名、会話URL、作業者情報はこの公開文書に含めない。

## 監査の事実

- GitHub連携で見えたリポジトリは2アカウント合計 **21件**。そのうち**公開17件、非公開4件**。このページは公開17件だけを記載。
- 確認範囲で **archived=true は0件**。
- 既存の[アプリ台帳](APP_PORTFOLIO.md) A節が管理するRepoは公開13件。残る公開4件は、アプリ以外の補助Repo、過去の別名、管理未登録などが含まれる可能性があるため、名前だけで追加しない。
- 更新時刻はAPIの\`pushed_at\`であり、**チャット最終発言・実機利用・公開サイトの稼働・GitHubのコミット日時ではない**。また、アーカイブの妥当性は日時だけで判断しない。
- この監査は非公開Repoの更新有無を網羅していない。

## 要照合の候補

| 区分 | 公開Repo | 根拠 | 暫定提案 |
| --- | --- | --- | --- |
| 同名・空に近い | [moyashimisosoup/soba-price](https://github.com/moyashimisosoup/soba-price) | 公開・サイズ0KB、READMEは\`# soba-price\`のみ。2026-10-11最終push | yama-books版の正本・参照先・Issue/PRを確認後、**アーカイブ候補**。現時点で操作しない |
| 継続する正本 | [yama-books/soba-price](https://github.com/yama-books/soba-price) | 2026-10-17最終push、研究計画・史料候補・READMEが存在 | 継続。古い同名Repoが正本に誤認されないよう相互リンクを検討 |
| 類似・README一致 | [moyashimisosoup/shukudai-kanri](https://github.com/moyashimisosoup/shukudai-kanri)、[moyashimisosoup/shukudai-notebook](https://github.com/moyashimisosoup/shukudai-notebook) | READMEの本文が完全一致。最終pushはそれぞれ2026-08-26／08-24、コミットSHAとRepoの大きさは異なる | 2Repoのコード、deploy元、Firebaseなどの運用経路・未移管Issueを確認。どちらかを**無条件に削除しない** |
| 長めの未更新 | [moyashimisosoup/word](https://github.com/moyashimisosoup/word) | 2026-08-01最終push | 完成・季節的保守・保留のいずれかを明示。停止と断定しない |
| 要用途確認 | [moyashimisosoup/power-balance](https://github.com/moyashimisosoup/power-balance) | 2026-09-23最終push。中央台帳の独立APP-IDなし | 継続予定／独立アプリ／実験のみを照合 |
| 安全点検 | [moyashimisosoup/trading-system-oauth-info](https://github.com/moyashimisosoup/trading-system-oauth-info) | 公開Repoで、名前から認証補助用途がうかがわれる（2026-10-10最終push） | 公開してよい情報だけか**安全監査**。名前だけで認証情報が含まれるとは断定しない |
| 公開後のフォロー | [yama-books/kaibun](https://github.com/yama-books/kaibun) | 2026-09-20最終push | 保守のみか次期版開発待ちかを確認。直ちにアーカイブ扱いはしない |

その他の公開リポジトリは、2026-09-30〜10-17の期間にpushが見られるか、現時点で別途整理の必要性を確認していない。最終pushの鮮度はアプリの成功率や完成度とは無関係。

## 重複判定の安全規則

| 信号 | 意味 | 自動処理 |
| --- | --- | --- |
| 同名Repoが複数 | 重複の**候補**。公開／非公開の役割分担・fork・移管後の別名を区別する | アーカイブしない |
| README本文の一致 | 同系統のアプリである可能性が上がる。**ソースの完全一致は示さない** | 変更差分と公開先を人が確認 |
| 公開Repoのサイズ0KB | 初期化だけの可能性。README・コミット・参照先を確認 | 保留表示 |
| \`pushed_at\`が30日超 | 「最近GitHubにpushされていない」。完成品／季節限定の可能性もある | **確認を提案** |
| \`pushed_at\`が60日超 | 優先確認対象。ただし放置・廃止を推定しない | **確認を提案** |
| \`pushed_at\`が90日超 | 長期無更新の可能性。最終手動確認日と突合 | **確認を提案** |
| 非公開Repo | 公開GitHub Pagesへ名前、時刻、セッション情報を出さない | 公開スキャナーでは対象外 |

**Archiveを採用する条件**：正本へのリンクがREADMEにある、Issue/PRと公開デプロイ元を照合済み、バックアップや復元経路が分かる、ユーザーの個別承認あり。GitHub公式のArchiveは削除ではなく**読み取り専用化**。作業するならアーカイブ前に残課題と参照先を整理する。

## 継続運用へ組み込む最小フロー

1. 毎週のGitHub観測と同時に**公開Repoのみ**の重複名・最終push・アーカイブ状態・中央台帳未登録を収集する。
2. 要確認候補の理由・検出日時を表示する。自動分類は \`possible_duplicate\` / \`needs_scope_decision\` / \`long_unobserved\` / \`already_archived\` / \`unknown\` などの**根拠ある候補**だけに限定。
3. 候補の扱いは「継続」「統合検討」「保守のみ」「アーカイブ提案」「除外」に人が分類する。何も変わらない場合は再通知を抑制。
4. アーカイブ等の操作はSession Deckの自動処理にせず、本人の明示承認後にのみ実施。
5. 非公開Repoの重複は**認証された非公開ビューのみ**で扱う。公開ページに非公開Repo名を持ち込まない。

### 出典

- GitHub公開API: [moyashimisosoup の公開Repo](https://api.github.com/users/moyashimisosoup/repos?per_page=100&type=owner)／[yama-books の公開Repo](https://api.github.com/users/yama-books/repos?per_page=100&type=owner)
- [GitHub公式: Archiving repositories](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories)
- 各RepoのREADMEとGitHub metadata。日付はUTCの\`pushed_at\`をJSTの暦日に換算し、正確な取得時刻・利用時刻とは区別した。
