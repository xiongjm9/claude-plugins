<#
git-guard installer (Windows PowerShell 5.1).
- Syncs the pre-push guard to %APPDATA%\git-guard and adds a pre-push stub to every repo found (submodules included).
- Installs the Antigravity plugin to ~/.gemini/config/plugins/git-guard: destructive git commands always ask first.
Usage:
  powershell -ExecutionPolicy Bypass -File install.ps1               # scan D:\code (1 level) and D:\workSpace (4 levels)
  powershell -ExecutionPolicy Bypass -File install.ps1 -DryRun       # list what would change
  powershell -ExecutionPolicy Bypass -File install.ps1 -Repos D:\x   # only these repos
  powershell -ExecutionPolicy Bypass -File install.ps1 -Uninstall    # undo using the install record
#>
param(
    [string[]]$Roots = @("D:\code", "D:\workSpace"),
    [string[]]$Repos,
    [switch]$Uninstall,
    [switch]$DryRun,
    [switch]$SkipAntigravity,
    [string]$StateDir = (Join-Path $env:APPDATA "git-guard"),
    [string]$PluginDir = (Join-Path $env:USERPROFILE ".gemini\config\plugins\git-guard")
)

$Src = $PSScriptRoot
$Marker = "git-guard pre-push stub"
$Manifest = Join-Path $StateDir "installed.json"
$GuardPath = Join-Path $StateDir "pre-push-guard.sh"
$Utf8 = New-Object System.Text.UTF8Encoding($false)
$Depth = @{ "D:\code" = 1; "D:\workSpace" = 4 }

function Write-Lf([string]$Path, [string]$Text) {
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n"), $Utf8)
}

function Read-Manifest {
    $list = New-Object System.Collections.ArrayList
    if (Test-Path -LiteralPath $Manifest) {
        $parsed = (Get-Content -LiteralPath $Manifest -Raw -Encoding UTF8) | ConvertFrom-Json
        foreach ($e in $parsed) { [void]$list.Add($e) }
    }
    return ,$list
}

function Save-Manifest($List) {
    Write-Lf $Manifest (ConvertTo-Json -InputObject @($List) -Depth 4)
}

function Find-Repos([string]$Root, [int]$MaxDepth) {
    $found = New-Object System.Collections.ArrayList
    if (-not (Test-Path -LiteralPath $Root)) { return ,$found }
    $skip = @("node_modules", ".git", ".svn", "dist", "build", "bin", "obj", "packages", ".husky")
    $queue = New-Object System.Collections.Queue
    $queue.Enqueue(@($Root, 0))
    while ($queue.Count -gt 0) {
        $item = $queue.Dequeue()
        $dir = $item[0]; $d = $item[1]
        if (Test-Path -LiteralPath (Join-Path $dir ".git")) {
            [void]$found.Add($dir)
            if ($d -gt 0) { continue }
        }
        if ($d -ge $MaxDepth) { continue }
        Get-ChildItem -LiteralPath $dir -Directory -Force -ErrorAction SilentlyContinue |
            Where-Object { ($skip -notcontains $_.Name) -and -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) } |
            ForEach-Object { $queue.Enqueue(@($_.FullName, ($d + 1))) }
    }
    return ,$found
}

function Get-Submodules([string]$Repo) {
    $out = New-Object System.Collections.ArrayList
    $gm = Join-Path $Repo ".gitmodules"
    if (-not (Test-Path -LiteralPath $gm)) { return ,$out }
    $lines = & git config --file $gm --get-regexp '^submodule\..*\.path$' 2>$null
    foreach ($line in $lines) {
        $rel = ($line -split '\s+', 2)[1]
        if (-not $rel) { continue }
        $p = Join-Path $Repo $rel
        if (Test-Path -LiteralPath (Join-Path $p ".git")) {
            [void]$out.Add($p)
            foreach ($s in (Get-Submodules $p)) { [void]$out.Add($s) }
        }
    }
    return ,$out
}

function Resolve-Target([string]$Repo) {
    $top = & git -C $Repo rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $top) { return $null }
    $top = [IO.Path]::GetFullPath($top)
    $abs = {
        param($p)
        if ([IO.Path]::IsPathRooted($p)) { [IO.Path]::GetFullPath($p) } else { [IO.Path]::GetFullPath((Join-Path $top $p)) }
    }
    $hooksDir = & $abs (& git -C $Repo rev-parse --git-path hooks 2>$null)
    $exclude = & $abs (& git -C $Repo rev-parse --git-path info/exclude 2>$null)
    $hooksPath = & git -C $Repo config --get core.hooksPath 2>$null
    $t = [PSCustomObject]@{ Repo = $top; Mode = "git"; Target = (Join-Path $hooksDir "pre-push"); Exclude = $exclude; Skip = $null }
    if ($hooksPath) {
        $huskyDir = $null
        if ((Split-Path -Leaf $hooksDir) -eq "_" -and (Test-Path -LiteralPath (Join-Path $hooksDir "h"))) {
            $huskyDir = Split-Path -Parent $hooksDir
        } elseif ((Split-Path -Leaf $hooksDir) -eq ".husky") {
            $huskyDir = $hooksDir
        }
        if (-not $huskyDir) { $t.Skip = "core.hooksPath=$hooksPath is not husky; left alone"; return $t }
        $t.Mode = "husky"
        $t.Target = Join-Path $huskyDir "pre-push"
        $rel = $t.Target.Substring($top.Length).TrimStart('\', '/') -replace '\\', '/'
        & git -C $top ls-files --error-unmatch -- $rel 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $t.Skip = "$rel is tracked by the repo; left alone" }
    }
    return $t
}

function Add-Exclude([string]$File, [string[]]$Patterns) {
    $text = ""
    if (Test-Path -LiteralPath $File) { $text = [IO.File]::ReadAllText($File) }
    if ($text -match '# >>> git-guard') { return }
    if ($text.Length -gt 0 -and -not $text.EndsWith("`n")) { $text += "`n" }
    $text += "# >>> git-guard`n" + (($Patterns | ForEach-Object { "/$_" }) -join "`n") + "`n# <<< git-guard`n"
    $dir = Split-Path -Parent $File
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [IO.File]::WriteAllText($File, $text, $Utf8)
}

function Remove-Exclude([string]$File) {
    if (-not (Test-Path -LiteralPath $File)) { return }
    $text = [IO.File]::ReadAllText($File)
    $new = [regex]::Replace($text, '(?s)# >>> git-guard\r?\n.*?# <<< git-guard\r?\n?', '')
    if ($new -ne $text) { [IO.File]::WriteAllText($File, $new, $Utf8) }
}

function Install-One($T, [string]$Stub, $Records) {
    $orig = "$($T.Target).git-guard-orig"
    $hasFile = Test-Path -LiteralPath $T.Target
    $isOurs = $hasFile -and ((Get-Content -LiteralPath $T.Target -Raw -ErrorAction SilentlyContinue) -match [regex]::Escape($Marker))
    $action = "installed"
    if ($isOurs) { $action = "updated" }
    elseif ($hasFile) {
        if (Test-Path -LiteralPath $orig) { return "skipped: $orig already exists" }
        $action = "installed, chained old pre-push"
    }
    if ($DryRun) { return "would be $action" }
    if ($hasFile -and -not $isOurs) { Move-Item -LiteralPath $T.Target -Destination $orig }
    Write-Lf $T.Target $Stub
    if ($T.Mode -eq "husky") {
        $rel = $T.Target.Substring($T.Repo.Length).TrimStart('\', '/') -replace '\\', '/'
        Add-Exclude $T.Exclude @($rel, "$rel.git-guard-orig")
    }
    if (-not ($Records | Where-Object { $_.Target -eq $T.Target })) {
        [void]$Records.Add([PSCustomObject]@{ Repo = $T.Repo; Mode = $T.Mode; Target = $T.Target; Orig = $orig; Exclude = $T.Exclude })
    }
    return $action
}

function Install-Antigravity {
    $guardJs = (Join-Path $PluginDir "guard.js") -replace '\\', '/'
    if ($guardJs -match '\s') { Write-Warning "plugin path contains spaces, hooks.json may not run: $guardJs" }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Warning "node is not on PATH; the Antigravity hook needs it" }
    if ($DryRun) { "Antigravity plugin -> $PluginDir (dry run)"; return }
    foreach ($f in @("plugin.json", "guard.js")) {
        Write-Lf (Join-Path $PluginDir $f) ([IO.File]::ReadAllText((Join-Path $Src "antigravity\$f")))
    }
    $hooks = ([IO.File]::ReadAllText((Join-Path $Src "antigravity\hooks.json.tmpl"))).Replace("__GUARD_JS__", $guardJs)
    Write-Lf (Join-Path $PluginDir "hooks.json") $hooks
    Write-Lf (Join-Path $PluginDir ".git-guard-installed") "installed by D:\claude-plugins\git-guard\install.ps1`n"
    "Antigravity plugin -> $PluginDir"
}

function Uninstall-All {
    foreach ($e in (Read-Manifest)) {
        $state = "removed"
        if (Test-Path -LiteralPath $e.Target) {
            $c = Get-Content -LiteralPath $e.Target -Raw -ErrorAction SilentlyContinue
            if ($c -match [regex]::Escape($Marker)) {
                if (-not $DryRun) { Remove-Item -LiteralPath $e.Target -Force }
            } else {
                $state = "kept (changed since install)"
            }
        }
        if ($state -eq "removed" -and (Test-Path -LiteralPath $e.Orig)) {
            if (-not $DryRun) { Move-Item -LiteralPath $e.Orig -Destination $e.Target }
            $state = "restored old pre-push"
        }
        if ($e.Mode -eq "husky" -and -not $DryRun) { Remove-Exclude $e.Exclude }
        "{0,-30} {1}" -f $state, $e.Repo
    }
    if (-not $DryRun) {
        foreach ($f in @($Manifest, $GuardPath)) { if (Test-Path -LiteralPath $f) { Remove-Item -LiteralPath $f -Force } }
    }
    if (-not $SkipAntigravity -and (Test-Path -LiteralPath (Join-Path $PluginDir ".git-guard-installed"))) {
        if (-not $DryRun) { Remove-Item -LiteralPath $PluginDir -Recurse -Force }
        "Antigravity plugin removed: $PluginDir"
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "git not found on PATH" }
if ($Uninstall) { Uninstall-All; return }

$guardUnix = $GuardPath -replace '\\', '/'
if ($guardUnix -match '\s') { throw "StateDir must not contain spaces: $StateDir" }
$stub = ([IO.File]::ReadAllText((Join-Path $Src "hooks\pre-push-stub.sh"))).Replace("__GUARD_PATH__", $guardUnix)
if (-not $DryRun) { Write-Lf $GuardPath ([IO.File]::ReadAllText((Join-Path $Src "hooks\pre-push-guard.sh"))) }
"guard script: $GuardPath"

$candidates = New-Object System.Collections.ArrayList
if ($Repos) {
    foreach ($r in $Repos) {
        try { [void]$candidates.Add((Resolve-Path -LiteralPath $r -ErrorAction Stop).Path) } catch { "not found: $r" }
    }
} else {
    foreach ($root in $Roots) {
        $max = 2
        if ($Depth.ContainsKey($root)) { $max = $Depth[$root] }
        foreach ($r in (Find-Repos $root $max)) { [void]$candidates.Add($r) }
    }
}
$all = New-Object System.Collections.ArrayList
foreach ($r in $candidates) {
    [void]$all.Add($r)
    foreach ($s in (Get-Submodules $r)) { [void]$all.Add($s) }
}

$records = Read-Manifest
$seen = @{}
foreach ($r in $all) {
    $t = Resolve-Target $r
    if (-not $t) { "{0,-34} {1}" -f "skipped: not a git repo", $r; continue }
    if ($seen.ContainsKey($t.Target)) { continue }
    $seen[$t.Target] = $true
    if ($t.Skip) { "{0,-34} {1}" -f "skipped: $($t.Skip)", $t.Repo; continue }
    $res = Install-One $t $stub $records
    "{0,-34} {1} [{2}]" -f $res, $t.Repo, $t.Mode
}
if (-not $DryRun) { Save-Manifest $records }
if (-not $SkipAntigravity) { Install-Antigravity }
