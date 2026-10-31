<#
git-guard self test. Works only inside a temp dir: bare remote + clones, never touches your repos.
Covers: pre-push blocking/allowing, chaining an existing hook, husky v9 layout, uninstall restore,
and the Antigravity command classifier.
  powershell -ExecutionPolicy Bypass -File selftest.ps1 [-Keep]
#>
param([switch]$Keep)

$Src = $PSScriptRoot
$Tmp = Join-Path $env:TEMP ("git-guard-selftest-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
$State = Join-Path $Tmp "state"
$Utf8 = New-Object System.Text.UTF8Encoding($false)
$script:pass = 0
$script:fail = 0

function Write-Lf([string]$Path, [string]$Text) {
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n"), $Utf8)
}

function Quote([string]$a) {
    if ($a -eq "") { return '""' }
    if ($a -notmatch '[\s"]') { return $a }
    return '"' + ($a -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1') + '"'
}

function Run([string]$Exe, [string[]]$ArgList, [string]$Cwd = $Tmp, [string]$Stdin = $null, [hashtable]$Env = @{}) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Exe
    $psi.Arguments = ($ArgList | ForEach-Object { Quote $_ }) -join " "
    $psi.WorkingDirectory = $Cwd
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.RedirectStandardInput = $true
    $psi.StandardOutputEncoding = $Utf8
    $psi.StandardErrorEncoding = $Utf8
    foreach ($k in $Env.Keys) { $psi.EnvironmentVariables[$k] = $Env[$k] }
    $p = [System.Diagnostics.Process]::Start($psi)
    $outTask = $p.StandardOutput.ReadToEndAsync()
    $errTask = $p.StandardError.ReadToEndAsync()
    if ($Stdin) {
        $bytes = $Utf8.GetBytes($Stdin)
        $p.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
    }
    $p.StandardInput.Close()
    $p.WaitForExit()
    return [PSCustomObject]@{ Code = $p.ExitCode; Out = $outTask.Result; Err = $errTask.Result }
}

function Check([string]$Name, [bool]$Ok, [string]$Detail = "") {
    if ($Ok) { $script:pass++; "PASS  $Name" }
    else { $script:fail++; "FAIL  $Name  $Detail" }
}

function G([string]$Dir, [string[]]$GitArgs, [hashtable]$Env = @{}) { Run "git" $GitArgs $Dir $null $Env }

function New-Clone([string]$Name) {
    $dir = Join-Path $Tmp $Name
    G $Tmp @("clone", "-q", $remote, $dir) | Out-Null
    G $dir @("config", "user.email", "selftest@example.invalid") | Out-Null
    G $dir @("config", "user.name", "git-guard selftest") | Out-Null
    G $dir @("config", "commit.gpgsign", "false") | Out-Null
    return $dir
}

function Commit([string]$Dir, [string]$Msg, [switch]$Amend) {
    Write-Lf (Join-Path $Dir "f.txt") ($Msg + "`n")
    G $Dir @("add", "f.txt") | Out-Null
    if ($Amend) { G $Dir @("commit", "-q", "--amend", "-m", $Msg) | Out-Null }
    else { G $Dir @("commit", "-q", "-m", $Msg) | Out-Null }
}

New-Item -ItemType Directory -Path $Tmp -Force | Out-Null
$remote = (Join-Path $Tmp "remote.git") -replace '\\', '/'
G $Tmp @("init", "-q", "--bare", $remote) | Out-Null
G $remote @("symbolic-ref", "HEAD", "refs/heads/master") | Out-Null

$w = New-Clone "work"
G $w @("symbolic-ref", "HEAD", "refs/heads/master") | Out-Null
Commit $w "c1"
$r = G $w @("push", "-q", "origin", "master")
Check "baseline push before install" ($r.Code -eq 0) $r.Err

$chainLog = (Join-Path $Tmp "chain.log") -replace '\\', '/'
$chain = "#!/bin/sh`ncat >> '$chainLog'`necho chained >> '$chainLog'`n"
Write-Lf (Join-Path $w ".git\hooks\pre-push") $chain

$inst = Join-Path $Src "install.ps1"
& $inst -Repos $w -StateDir $State -SkipAntigravity *> $null
$stubText = Get-Content -LiteralPath (Join-Path $w ".git\hooks\pre-push") -Raw
Check "stub installed in .git/hooks" ($stubText -match "git-guard pre-push stub")
Check "old pre-push kept as .git-guard-orig" ((Get-Content -LiteralPath (Join-Path $w ".git\hooks\pre-push.git-guard-orig") -Raw) -eq $chain)

Commit $w "c2"
$r = G $w @("push", "-q", "origin", "master")
Check "fast-forward push to master allowed" ($r.Code -eq 0) $r.Err
$log = ""
if (Test-Path -LiteralPath $chainLog) { $log = Get-Content -LiteralPath $chainLog -Raw }
Check "old pre-push still runs and gets stdin" (($log -match "refs/heads/master") -and ($log -match "chained")) $log

Commit $w "c2-amended" -Amend
$r = G $w @("push", "-q", "--force", "origin", "master")
Check "force push to master blocked" ($r.Code -ne 0 -and $r.Err -match "git-guard") $r.Err
$r = G $w @("-c", "gitguard.allow=true", "push", "-q", "--force", "origin", "master")
Check "force push allowed with -c gitguard.allow=true" ($r.Code -eq 0) $r.Err

G $w @("checkout", "-q", "-b", "feature/x") | Out-Null
Commit $w "f1"
$r = G $w @("push", "-q", "origin", "feature/x")
Check "new feature branch push allowed" ($r.Code -eq 0) $r.Err
Commit $w "f1-amended" -Amend
$r = G $w @("push", "-q", "--force", "origin", "feature/x")
Check "force push to unprotected feature branch allowed" ($r.Code -eq 0) $r.Err
$r = G $w @("push", "-q", "origin", "--delete", "feature/x")
Check "deleting remote branch blocked" ($r.Code -ne 0 -and $r.Err -match "git-guard") $r.Err
$r = G $w @("push", "-q", "origin", "--delete", "feature/x") @{ GIT_GUARD_ALLOW = "1" }
Check "deleting remote branch allowed with GIT_GUARD_ALLOW=1" ($r.Code -eq 0) $r.Err

G $w @("checkout", "-q", "-b", "T_260924") | Out-Null
Commit $w "t1"
G $w @("push", "-q", "origin", "T_260924") | Out-Null
Commit $w "t1-amended" -Amend
$r = G $w @("push", "-q", "--force", "origin", "T_260924")
Check "force push to T_* branch blocked" ($r.Code -ne 0 -and $r.Err -match "git-guard") $r.Err
G $w @("checkout", "-q", "master") | Out-Null

$h = New-Clone "work-husky"
New-Item -ItemType Directory -Path (Join-Path $h ".husky\_") -Force | Out-Null
Write-Lf (Join-Path $h ".husky\_\h") @'
#!/usr/bin/env sh
n=$(basename "$0")
s=$(dirname "$(dirname "$0")")/$n
[ ! -f "$s" ] && exit 0
[ "${HUSKY-}" = "0" ] && exit 0
sh -e "$s" "$@"
'@
Write-Lf (Join-Path $h ".husky\_\pre-push") "#!/usr/bin/env sh`n. `"`$(dirname `"`$0`")/h`"`n"
G $h @("config", "core.hooksPath", ".husky/_") | Out-Null
& $inst -Repos $h -StateDir $State -SkipAntigravity *> $null
Check "husky: stub written to .husky/pre-push" (Test-Path -LiteralPath (Join-Path $h ".husky\pre-push"))
$st = (G $h @("status", "--porcelain", "--untracked-files=all", "--", ".husky/pre-push")).Out
Check "husky: stub hidden from git status" ([string]::IsNullOrWhiteSpace($st)) $st
Commit $h "h1-amended" -Amend
$r = G $h @("push", "-q", "--force", "origin", "master")
Check "husky: force push to master blocked" ($r.Code -ne 0 -and $r.Err -match "git-guard") $r.Err

& $inst -Uninstall -StateDir $State -SkipAntigravity *> $null
Check "uninstall restores the old pre-push" ((Get-Content -LiteralPath (Join-Path $w ".git\hooks\pre-push") -Raw) -eq $chain)
Check "uninstall removes .git-guard-orig" (-not (Test-Path -LiteralPath (Join-Path $w ".git\hooks\pre-push.git-guard-orig")))
Check "uninstall removes husky stub" (-not (Test-Path -LiteralPath (Join-Path $h ".husky\pre-push")))
$ex = Get-Content -LiteralPath (Join-Path $h ".git\info\exclude") -Raw
Check "uninstall removes the exclude block" ($ex -notmatch "git-guard")
Check "uninstall removes the install record" (-not (Test-Path -LiteralPath (Join-Path $State "installed.json")))

$guardJs = Join-Path $Src "antigravity\guard.js"
$agLog = Join-Path $Tmp "antigravity.log"
function Decide([string]$Cmd) {
    $payload = @{ toolCall = @{ name = "run_command"; args = @{ CommandLine = $Cmd } }; conversationId = "selftest" }
    $json = ConvertTo-Json -InputObject $payload -Depth 5 -Compress
    $r = Run "node" @($guardJs) $Tmp $json @{ GIT_GUARD_LOG = $agLog }
    try { return ($r.Out | ConvertFrom-Json).decision } catch { return "bad output: $($r.Out) $($r.Err)" }
}
$cn = -join ([char[]]@(0x4FEE, 0x590D))
$danger = @(
    'git -C "d:\code\ms-approval" reset --hard fb9b5d0; git -C "d:\code\ms-approval" push origin test --force',
    'git -C "d:\code\ms-approval" push origin --delete feature/customer-value-system',
    'git -C "d:\code\ms-approval" checkout . ; git -C "d:\code\ms-approval" clean -fd',
    'cd d:\code\ms-client; git checkout src/views/company/edit/contractInfo/index.vue',
    '"git -C \"d:\\code\\ms-client\" checkout src/views/company/edit/contractInfo/index.vue"',
    'git branch -f feature/customer-value-system fcd0d53',
    'git checkout -- .', 'git restore src/a.vue', 'git switch -f uat', 'git stash drop', 'git stash clear',
    'git push origin +master', 'git push origin :feature/x', 'git push --force-with-lease',
    'cmd /c "git reset --hard HEAD"', 'powershell -Command "cd x; git clean -xdf"',
    'git -c gitguard.allow=true push origin test', 'HUSKY=0 git push origin master', 'git push --no-verify'
)
$safe = @(
    'git status', 'git log --oneline -n 5', 'git diff HEAD~1', 'git add -A', 'git commit -m "fix: claim dialog"',
    ('git commit -m "' + $cn + '"'), 'git push origin feature/x', 'git push -u origin feature/customer-value-system',
    'git checkout -b feature/customer-value-system', 'git checkout uat', 'git switch -c T_x',
    'git restore --staged src/a.vue', 'git branch -d feature/x', 'git clean -n -d', 'git stash push -m wip',
    'git fetch --prune origin', 'git pull origin uat1', 'git merge feature/customer-value-system -m "Merge"', 'npm run dev'
)
foreach ($c in $danger) { $d = Decide $c; Check "antigravity asks: $c" ($d -eq "force_ask") $d }
foreach ($c in $safe) { $d = Decide $c; Check "antigravity allows: $c" ($d -eq "allow") $d }
$r = Run "node" @($guardJs) $Tmp "not json" @{ GIT_GUARD_LOG = $agLog }
Check "antigravity: malformed payload falls back to allow" ($r.Out -match '"allow"') $r.Out
$logLines = @(Get-Content -LiteralPath $agLog -ErrorAction SilentlyContinue).Count
Check "antigravity: each ask is logged" ($logLines -eq $danger.Count) "$logLines lines"

""
"passed $script:pass, failed $script:fail"
if ($Keep) { "kept: $Tmp" } else { Remove-Item -LiteralPath $Tmp -Recurse -Force -ErrorAction SilentlyContinue }
if ($script:fail -gt 0) { exit 1 }
