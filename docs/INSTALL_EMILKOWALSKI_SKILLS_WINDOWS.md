# AGSK-0001｜Windowsへの導入手順（Codex / Claude Code）

このガイドは、[監査済みEmil Kowalski Skills 16種類](./design-library/agent-skills/emilkowalski-skills/INDEX.md)を、Windowsネイティブで使うためのものです。

## 保存先

- Codex：`%USERPROFILE%\.agents\skills\`（全プロジェクト共通）
- Claude Code：`%USERPROFILE%\.claude\skills\`（全プロジェクト共通）

管理者権限やnpm、npxは不要です。両AIの設定ファイルは編集しません。WindowsとWSLはホームディレクトリが異なるため、WSL側には別途導入してください。

## 導入方法A：session-deckをローカルに持っている場合

GitHubから入手済みのリポジトリ内にいる場合は、ネットワークを使わず固定スナップショットから導入します。

```powershell
cd "C:\path\to\session-deck"
pwsh -NoProfile -File .\scripts\install-emilkowalski-skills.ps1
pwsh -NoProfile -File .\scripts\install-emilkowalski-skills.ps1 -Status
```

リポジトリを最新版に更新し、スクリプトとMANIFESTがあることを確認してください。cdのパスは自分のPCの実際のパスに置き換えます。

### `Checksum mismatch` で止まる場合（改行コード）

Git for Windowsの既定（`core.autocrlf=true`）では、チェックアウト時にLFがCRLFへ変換され、SHA照合が失敗します。現在は `.gitattributes` でこのフォルダを `-text`（バイト列そのまま）に固定していますが、固定前にチェックアウトしたクローンはファイルが変換済みのままです。リポジトリ直下で次を実行して取り直してください（このフォルダの未コミット変更は消えます）。

```powershell
Remove-Item -Recurse -Force .\docs\design-library\agent-skills\emilkowalski-skills
git checkout -- docs/design-library/agent-skills/emilkowalski-skills
```

照合に失敗した場合、スクリプトはスキル配置先に何も書き込まずに終了します。

## 導入方法B：ローカルにリポジトリがない場合

まずスクリプトをファイルに保存して中身を確認してから実行してください。スクリプトは固定したGitHubコミットのZIPのみを取得し、28ファイルすべてをGit blob SHAで検証してからコピーします。

```powershell
$installer = Join-Path $env:TEMP 'install-emilkowalski-skills.ps1'
Invoke-WebRequest 'https://raw.githubusercontent.com/moyashimisosoup/session-deck/main/scripts/install-emilkowalski-skills.ps1' -OutFile $installer
notepad $installer
pwsh -NoProfile -File $installer
pwsh -NoProfile -File $installer -Status
```

**注意：** 上記はscript本体の取得URLがmainを参照します。インストールするスキル資料の取得先はスクリプト内でコミット `6bd88c9d65d039f1948058579d26122f7305c01e` に固定しています。スクリプトは実行前に確認してください。

## 引数

```powershell
pwsh -NoProfile -File .\scripts\install-emilkowalski-skills.ps1 -Target Codex
pwsh -NoProfile -File .\scripts\install-emilkowalski-skills.ps1 -Target Claude
pwsh -NoProfile -File .\scripts\install-emilkowalski-skills.ps1 -Status
```

- `-Target Codex` はCodexのみ、`-Target Claude` はClaude Codeのみ。省略時は両方です。
- `-Status` は現在の16スキルの配置状況だけを表示し、外部通信やファイル変更を行いません。
- 同名の既存フォルダがある場合は**上書き・削除せずスキップ**します。既存のスキルの中身は変わりません。
- エラーが発生しても、コピー途中の一時ディレクトリを削除します。導入済みのスキルを勝手に消したり上書きしたりはしません。

## 動作確認

- Codexの新しいセッションで`/skills`を開き、`mobile-native` などが使えるか確認します。必要なら`$mobile-native`と明示します。
- Claude Codeの新しいセッションで`/mobile-native`などを呼び出します。
- ツールにスキルが表示されない場合、Codex / Claude Codeを再起動して確認します。
- 本スクリプトのGitHubへの保存と、ユーザーPCでの実行・読み込み確認は別工程です。PC実機の成功は実行結果が得られるまで未確認とします。
- `pick-ui-library`、`prototype`、`review-animations` の3つは上流で `disable-model-invocation: true` が指定されています。Claude Codeではモデルが自動で選ぶ一覧には出ず、`/pick-ui-library` のように明示的に呼び出したときだけ動きます（スラッシュコマンド一覧には16種類すべて出ます）。不具合ではありません。
- Codexは `disable-model-invocation` を解釈しないため、16種類すべてがスキル一覧に出ます。

### 実機検証記録（2026-11-01、Windows 11・PowerShell 7.6・Codex CLI 0.157・Claude Code 2.1）

- 導入：Codex 16/16、Claude Code 16/16（付属資料を含む24ファイル×2をSHA照合で一致）。既存スキル・設定ファイルのハッシュは導入前後で不変。
- 再実行：32件すべて「Skipped existing path」となり、内容は不変。
- 認識：Codexの新規 `codex exec` セッションのスキル一覧に16/16。Claude Codeの新規プロセスの初期化情報（skills / slash_commands）に16/16。
- 呼び出し：`mobile-native`、`break-ui`、`animate` を両エージェントで呼び出し、各 `SKILL.md` 固有の内容で回答することを確認。

## スキルの更新方法

スクリプトは既存フォルダを上書きしないため、更新は「差分監査 → 固定値の更新 → 退避して再導入」の順で行います。

1. 上流 `emilkowalski/skills` の新しいコミットとの差分を確認し、取り込む内容を監査します。
2. スナップショット（スキル資料・`MANIFEST.json` のSHA）を更新するPRを作り、mainへ統合します。
3. スクリプトの `$UpstreamCommit` を新しい上流コミットに、`$SnapshotCommit` を手順2の統合コミットに更新するPRを作ります。ファイル数やスキル数が変わる場合は検証値も合わせて更新します。
4. 各PCで、導入済みの16フォルダを配置先の外（例：`%USERPROFILE%\skills-backup\日付\`）へ移動してからスクリプトを再実行します。動作確認後に退避分を削除します。

`npx skills@latest` などによる無条件の最新版導入は使いません。

## 出典と安全上の範囲

- 上流`emilkowalski/skills`、固定コミット`a81dbca07f2217b7103e510c0f13f8d5b017afc9`、MITライセンス。
- 対象は固定スナップショットのMarkdownだけです。外部パッケージの自動インストール、端末の常駐処理、GitHubリポジトリのコード変更は行いません。
- バージョンアップは差分監査を経て別途実施し、自動追従させません。
- PowerShellの実行ポリシーでブロックされる場合、原因を確認してから対処してください。恒久的なポリシー緩和や管理者権限は要りません。

公式仕様：[Codex local skills](https://learn.chatgpt.com/docs/build-skills) / [Claude Code Skills](https://code.claude.com/docs/en/skills)
