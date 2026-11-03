param(
    [string]$Source = (Join-Path $env:USERPROFILE ".agents\skills"),
    [string[]]$Clients = @(
        (Join-Path $env:USERPROFILE ".claude\skills"),
        (Join-Path $env:USERPROFILE ".grok\skills")
    ),
    [switch]$Apply,
    [switch]$FixBroken,
    [switch]$SkipAntigravity
)

$ErrorActionPreference = "Stop"

function Normalize([string]$p) {
    if (-not $p) { return "" }
    try { return ([IO.Path]::GetFullPath($p)).TrimEnd('\', '/').ToLowerInvariant() }
    catch { return $p.TrimEnd('\', '/').ToLowerInvariant() }
}

function Get-PathInfo([string]$path) {
    $info = [PSCustomObject]@{ Exists = $false; IsLink = $false; Target = ""; TargetExists = $false }
    $item = Get-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
    if (-not $item) { return $info }
    $info.Exists = $true
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        $info.IsLink = $true
        $t = $item.Target
        if ($t -is [array]) { $t = $t[0] }
        $info.Target = [string]$t
        if ($info.Target -and (Test-Path -LiteralPath $info.Target)) { $info.TargetExists = $true }
    }
    return $info
}

function New-Junction([string]$link, [string]$target) {
    $out = cmd /c mklink /J "$link" "$target" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "mklink failed: $link -> $target`n$out" }
}

function Remove-Junction([string]$link) {
    $out = cmd /c rmdir "$link" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "rmdir failed: $link`n$out" }
}

if (-not (Test-Path -LiteralPath $Source)) {
    Write-Error "Source directory not found: $Source"
    exit 2
}
$Source = (Resolve-Path -LiteralPath $Source).Path

$skills = @(Get-ChildItem -LiteralPath $Source -Directory -Force -ErrorAction SilentlyContinue |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "SKILL.md") })
if ($skills.Count -eq 0) {
    Write-Error "No skill with SKILL.md under: $Source"
    exit 2
}

$unresolved = 0
$fixed = 0

foreach ($client in $Clients) {
    Write-Output ""
    Write-Output "== $client"
    if (-not (Test-Path -LiteralPath $client)) {
        if ($Apply) {
            New-Item -ItemType Directory -Path $client -Force | Out-Null
            Write-Output "[CREATE] client directory created"
        } else {
            Write-Output "[MISS] client directory missing (created with -Apply)"
            $unresolved++
            continue
        }
    }

    $names = @{}
    foreach ($skill in $skills) {
        $names[$skill.Name.ToLowerInvariant()] = $true
        $dest = Join-Path $client $skill.Name
        $info = Get-PathInfo $dest
        $want = Normalize $skill.FullName

        if (-not $info.Exists) {
            if ($Apply) {
                New-Junction $dest $skill.FullName
                Write-Output "[LINK] $($skill.Name)"
                $fixed++
            } else {
                Write-Output "[MISS] $($skill.Name)"
                $unresolved++
            }
            continue
        }

        if (-not $info.IsLink) {
            Write-Output "[CONFLICT] $($skill.Name) is a real directory; not overwritten"
            $unresolved++
            continue
        }

        if (-not $info.TargetExists) {
            if ($Apply -and $FixBroken) {
                Remove-Junction $dest
                New-Junction $dest $skill.FullName
                Write-Output "[REPAIR] $($skill.Name) broken link recreated"
                $fixed++
            } else {
                Write-Output "[BROKEN] $($skill.Name) -> $($info.Target) (use -Apply -FixBroken)"
                $unresolved++
            }
            continue
        }

        if ((Normalize $info.Target) -ne $want) {
            Write-Output "[WRONG] $($skill.Name) -> $($info.Target), expected $($skill.FullName)"
            $unresolved++
            continue
        }

        Write-Output "[OK] $($skill.Name)"
    }

    foreach ($item in @(Get-ChildItem -LiteralPath $client -Directory -Force -ErrorAction SilentlyContinue)) {
        if (-not ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { continue }
        if ($names.ContainsKey($item.Name.ToLowerInvariant())) { continue }
        $t = $item.Target
        if ($t -is [array]) { $t = $t[0] }
        if ($t -and ((Normalize $t).StartsWith((Normalize $Source) + "\"))) {
            Write-Output "[STALE] $($item.Name) -> $t (not present in source)"
            $unresolved++
        }
    }
}

if (-not $SkipAntigravity) {
    Write-Output ""
    Write-Output "== Antigravity skills.json"
    $cfg = Join-Path $env:USERPROFILE ".gemini\config\skills.json"
    if (-not (Test-Path -LiteralPath $cfg)) {
        Write-Output "[MISS] $cfg"
        $unresolved++
    } else {
        $paths = @()
        try {
            $json = Get-Content -LiteralPath $cfg -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($e in @($json.entries)) { if ($e.path) { $paths += Normalize $e.path } }
        } catch {
            Write-Output "[ERROR] cannot parse skills.json: $($_.Exception.Message)"
            $unresolved++
        }
        if ($paths -contains (Normalize $Source)) {
            Write-Output "[OK] contains $Source"
        } else {
            Write-Output "[MISS] does not contain $Source (add an entry manually)"
            $unresolved++
        }
    }
}

Write-Output ""
Write-Output "skills=$($skills.Count) clients=$($Clients.Count) fixed=$fixed unresolved=$unresolved"
if ($unresolved -gt 0) { exit 1 }
exit 0
