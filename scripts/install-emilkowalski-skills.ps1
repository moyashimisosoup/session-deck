# Audited Emil Kowalski Skills installer for native Windows Codex and Claude Code.
[CmdletBinding()]
param(
    [ValidateSet('Both', 'Codex', 'Claude')]
    [string]$Target = 'Both',
    [switch]$Status
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$SnapshotCommit = '6bd88c9d65d039f1948058579d26122f7305c01e'
$UpstreamCommit = 'a81dbca07f2217b7103e510c0f13f8d5b017afc9'
$RelativeSource = 'docs/design-library/agent-skills/emilkowalski-skills'
$SkillNames = @(
    'animate-expo', 'animate', 'animation-performance', 'animation-vocabulary',
    'apple-design', 'ask-sonner', 'break-ui', 'emil-design-eng',
    'find-animation-opportunities', 'improve-animations', 'mobile-native',
    'pick-ui-library', 'prototype', 'remove-animations', 'review-animations',
    'write-swift'
)

$Destinations = @()
if ($Target -in @('Both', 'Codex')) {
    $Destinations += [pscustomobject]@{
        Agent = 'Codex'
        Root  = (Join-Path $HOME '.agents/skills')
    }
}
if ($Target -in @('Both', 'Claude')) {
    $Destinations += [pscustomobject]@{
        Agent = 'Claude Code'
        Root  = (Join-Path $HOME '.claude/skills')
    }
}

function Show-SkillStatus {
    param([object[]]$SelectedDestinations, [string[]]$Names)
    foreach ($item in $SelectedDestinations) {
        $count = 0
        foreach ($name in $Names) {
            $path = Join-Path (Join-Path $item.Root $name) 'SKILL.md'
            if (Test-Path -LiteralPath $path -PathType Leaf) {
                $count++
            }
        }
        Write-Host ('{0}: {1}/{2} SKILL.md files in {3}' -f $item.Agent, $count, $Names.Count, $item.Root)
    }
}

if ($Status) {
    Show-SkillStatus -SelectedDestinations $Destinations -Names $SkillNames
    return
}

function Get-GitBlobSha {
    param([Parameter(Mandatory)][string]$Path)
    $data = [System.IO.File]::ReadAllBytes($Path)
    $header = [System.Text.Encoding]::ASCII.GetBytes('blob ' + $data.Length + [char]0)
    $buffer = [byte[]]::new($header.Length + $data.Length)
    [System.Array]::Copy($header, 0, $buffer, 0, $header.Length)
    [System.Array]::Copy($data, 0, $buffer, $header.Length, $data.Length)
    $hasher = [System.Security.Cryptography.SHA1]::Create()
    try {
        return [System.BitConverter]::ToString($hasher.ComputeHash($buffer)).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $hasher.Dispose()
    }
}

$TempDirectory = $null
try {
    # Prefer a verified checked-out snapshot when this script is run from this repository.
    $SourceRoot = $null
    if ($PSScriptRoot) {
        $repoRoot = Split-Path -Parent $PSScriptRoot
        $candidate = Join-Path $repoRoot $RelativeSource
        if (Test-Path -LiteralPath (Join-Path $candidate 'MANIFEST.json') -PathType Leaf) {
            $SourceRoot = $candidate
            Write-Host 'Using the local repository snapshot.'
        }
    }

    if (-not $SourceRoot) {
        $TempDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('emil-skills-' + [guid]::NewGuid().ToString('N'))
        $null = New-Item -ItemType Directory -Path $TempDirectory -ErrorAction Stop
        $archive = Join-Path $TempDirectory 'snapshot.zip'
        $expanded = Join-Path $TempDirectory 'extracted'
        $url = 'https://github.com/moyashimisosoup/session-deck/archive/' + $SnapshotCommit + '.zip'
        Write-Host ('Downloading fixed GitHub commit {0} ...' -f $SnapshotCommit.Substring(0, 12))
        Invoke-WebRequest -Uri $url -OutFile $archive -ErrorAction Stop
        Expand-Archive -LiteralPath $archive -DestinationPath $expanded -ErrorAction Stop
        $roots = @(Get-ChildItem -LiteralPath $expanded -Directory)
        if ($roots.Count -ne 1) {
            throw 'The downloaded archive has an unexpected directory structure.'
        }
        $SourceRoot = Join-Path $roots[0].FullName $RelativeSource
    }

    $manifestPath = Join-Path $SourceRoot 'MANIFEST.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        throw ('Missing manifest: {0}' -f $manifestPath)
    }
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($manifest.id -ne 'AGSK-0001' -or $manifest.source_commit -ne $UpstreamCommit -or
        [int]$manifest.file_count -ne 28 -or [int]$manifest.skill_count -ne 16) {
        throw 'Snapshot manifest does not match the audited version.'
    }
    $files = @($manifest.files)
    if ($files.Count -ne 28) {
        throw 'Unexpected number of source files.'
    }

    $namesFromManifest = @(
        $files |
            Where-Object { $_.path -match '^skills/[a-z0-9-]+/SKILL\.md$' } |
            ForEach-Object { $_.path.Split('/')[1] } |
            Sort-Object -Unique
    )
    if ($namesFromManifest.Count -ne $SkillNames.Count) {
        throw 'Skill count does not match the audited catalog.'
    }
    foreach ($name in $SkillNames) {
        if ($namesFromManifest -notcontains $name) {
            throw ('Missing audited skill: {0}' -f $name)
        }
    }

    # Validate every file's Git blob SHA. Copy only the explicitly listed Markdown files.
    $seen = @{}
    foreach ($entry in $files) {
        $path = [string]$entry.path
        if ($path -notmatch '^(LICENSE|README\.md|performance-cheatsheet\.md|ui-cheatsheet\.md|skills/[a-z0-9-]+/[A-Za-z0-9.-]+\.md)$') {
            throw ('Unexpected manifest path: {0}' -f $path)
        }
        if ($seen.ContainsKey($path)) {
            throw ('Duplicate manifest path: {0}' -f $path)
        }
        $seen[$path] = $true
        $sourceFile = Join-Path $SourceRoot $path
        if (-not (Test-Path -LiteralPath $sourceFile -PathType Leaf)) {
            throw ('Missing source file: {0}' -f $path)
        }
        if ((Get-GitBlobSha -Path $sourceFile) -ne [string]$entry.upstream_git_blob_sha) {
            if (-not $TempDirectory) {
                # A checkout made with core.autocrlf=true before .gitattributes pinned this folder has CRLF line endings.
                throw ('Checksum mismatch: {0}. If this clone uses core.autocrlf=true, re-check out {1} (see docs/INSTALL_EMILKOWALSKI_SKILLS_WINDOWS.md).' -f $path, $RelativeSource)
            }
            throw ('Checksum mismatch: {0}' -f $path)
        }
    }
    Write-Host 'Validated 28 source files against the audited manifest.'

    $installed = 0
    $skipped = 0
    foreach ($destination in $Destinations) {
        $null = New-Item -ItemType Directory -Path $destination.Root -Force -ErrorAction Stop
        foreach ($name in $SkillNames) {
            $targetPath = Join-Path $destination.Root $name
            if (Test-Path -LiteralPath $targetPath) {
                Write-Warning ('Skipped existing path: {0}' -f $targetPath)
                $skipped++
                continue
            }

            $stagePath = Join-Path $destination.Root ('.emil-install-' + $name + '-' + [guid]::NewGuid().ToString('N'))
            $null = New-Item -ItemType Directory -Path $stagePath -ErrorAction Stop
            try {
                $skillFiles = @($files | Where-Object { $_.path -like ('skills/' + $name + '/*') })
                foreach ($file in $skillFiles) {
                    $fileName = $file.path.Split('/')[-1]
                    $from = Join-Path $SourceRoot $file.path
                    $to = Join-Path $stagePath $fileName
                    Copy-Item -LiteralPath $from -Destination $to -ErrorAction Stop
                    if ((Get-GitBlobSha -Path $to) -ne [string]$file.upstream_git_blob_sha) {
                        throw ('Copy verification failed: {0}' -f $file.path)
                    }
                }
                if (-not (Test-Path -LiteralPath (Join-Path $stagePath 'SKILL.md') -PathType Leaf)) {
                    throw ('Missing SKILL.md for {0}' -f $name)
                }
                if (Test-Path -LiteralPath $targetPath) {
                    Write-Warning ('Skipped concurrently created path: {0}' -f $targetPath)
                    $skipped++
                    continue
                }
                Move-Item -LiteralPath $stagePath -Destination $targetPath -ErrorAction Stop
                $installed++
            }
            finally {
                if (Test-Path -LiteralPath $stagePath) {
                    Remove-Item -LiteralPath $stagePath -Recurse -Force
                }
            }
        }
    }
    Write-Host ('Installed: {0}; skipped existing: {1}.' -f $installed, $skipped)
    Show-SkillStatus -SelectedDestinations $Destinations -Names $SkillNames
    Write-Host 'Restart Codex / Claude Code and invoke a skill by name.'
}
finally {
    if ($TempDirectory -and (Test-Path -LiteralPath $TempDirectory)) {
        Remove-Item -LiteralPath $TempDirectory -Recurse -Force
    }
}
