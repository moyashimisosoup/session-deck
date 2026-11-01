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

## 出典と安全上の範囲

- 上流`emilkowalski/skills`、固定コミット`a81dbca07f2217b7103e510c0f13f8d5b017afc9`、MITライセンス。
- 対象は固定スナップショットのMarkdownだけです。外部パッケージの自動インストール、端末の常駐処理、GitHubリポジトリのコード変更は行いません。
- バージョンアップは差分監査を経て別途実施し、自動追従させません。
- PowerShellの実行ポリシーでブロックされる場合、原因を確認してから対処してください。恒久的なポリシー緩和や管理者権限は要りません。

公式仕様：[Codex local skills](https://learn.chatgpt.com/docs/build-skills) / [Claude Code Skills](https://code.claude.com/docs/en/skills)
