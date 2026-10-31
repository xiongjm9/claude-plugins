# legacy-parity-fix install: run from the repo folder. Only creates junctions; never copies or deletes.
#   ~/.agents/skills/legacy-parity-fix -> this folder
#   ~/.claude/skills/legacy-parity-fix, ~/.grok/skills/legacy-parity-fix -> ~/.agents/skills/legacy-parity-fix (skipped if the client dir is missing)
$ErrorActionPreference = 'Stop'
$name = 'legacy-parity-fix'
$source = $PSScriptRoot
$entity = Join-Path $env:USERPROFILE ".agents\skills\$name"

function Get-JunctionTarget([string]$path) {
    $item = Get-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
    if ($null -eq $item) { return $null }
    if ($item.LinkType -ne 'Junction') { throw "$path exists and is not a junction; move it away first" }
    return ([string]@($item.Target)[0]).TrimEnd('\')
}

function Set-Junction([string]$path, [string]$target) {
    $current = Get-JunctionTarget $path
    if ($null -eq $current) {
        New-Item -ItemType Junction -Path $path -Target $target | Out-Null
        Write-Output "created $path -> $target"
    } elseif ($current -ieq $target.TrimEnd('\')) {
        Write-Output "ok $path"
    } else {
        throw "$path points to $current, not $target"
    }
}

if ($source -ieq $entity) { throw 'run this from the repo folder, not through the skill link' }
New-Item -ItemType Directory -Force -Path (Split-Path $entity) | Out-Null
Set-Junction $entity $source
foreach ($dir in @('.claude\skills', '.grok\skills')) {
    $root = Join-Path $env:USERPROFILE $dir
    if (Test-Path -LiteralPath $root) { Set-Junction (Join-Path $root $name) $entity }
    else { Write-Output "skipped $root (missing)" }
}
