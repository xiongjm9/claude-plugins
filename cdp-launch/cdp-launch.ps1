param(
    [int]$Port = 9222,
    [string]$Url = "about:blank",
    [string]$ProfileDir = "",
    [ValidateSet("auto", "chrome", "edge", "brave")]
    [string]$Browser = "auto",
    [switch]$Headless,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not $ProfileDir) {
    $ProfileDir = Join-Path $env:LOCALAPPDATA "cdp-launch\profile-$Port"
}

function Test-Cdp([int]$p) {
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Proxy = $null
        $json = $wc.DownloadString("http://127.0.0.1:$p/json/version")
        return ($json | ConvertFrom-Json)
    } catch {
        return $null
    }
}

$existing = Test-Cdp $Port
if ($existing) {
    Write-Output "CDP already available on port $Port"
    Write-Output "webSocketDebuggerUrl: $($existing.webSocketDebuggerUrl)"
    exit 0
}

function Get-Candidates([string]$name) {
    $list = @()
    switch ($name) {
        "chrome" {
            $list = @(
                (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"),
                (Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"),
                (Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe")
            )
        }
        "edge" {
            $list = @(
                (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"),
                (Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe")
            )
        }
        "brave" {
            $list = @(
                (Join-Path $env:ProgramFiles "BraveSoftware\Brave-Browser\Application\brave.exe"),
                (Join-Path $env:LOCALAPPDATA "BraveSoftware\Brave-Browser\Application\brave.exe")
            )
        }
    }
    return $list
}

$exe = $null
$tried = @()
if ($env:CDP_BROWSER -and (Test-Path -LiteralPath $env:CDP_BROWSER)) {
    $exe = $env:CDP_BROWSER
} else {
    $names = @()
    if ($Browser -eq "auto") { $names = @("chrome", "edge", "brave") } else { $names = @($Browser) }
    foreach ($n in $names) {
        foreach ($c in (Get-Candidates $n)) {
            $tried += $c
            if ($c -and (Test-Path -LiteralPath $c)) { $exe = $c; break }
        }
        if ($exe) { break }
    }
}

if (-not $exe) {
    Write-Error ("Browser not found. Tried:`n  " + (($tried | Where-Object { $_ }) -join "`n  ") + "`nSet CDP_BROWSER to the full path.")
    exit 2
}

if (-not (Test-Path -LiteralPath $ProfileDir)) {
    if (-not $DryRun) { New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null }
}

$argList = @(
    "--remote-debugging-port=$Port",
    "--user-data-dir=$ProfileDir",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-features=Translate"
)
if ($Headless) { $argList += "--headless=new" }
$argList += $Url

Write-Output "browser: $exe"
Write-Output "profile: $ProfileDir"
Write-Output "args: $($argList -join ' ')"
if ($DryRun) { exit 0 }

$proc = Start-Process -FilePath $exe -ArgumentList $argList -PassThru
Write-Output "pid: $($proc.Id)"

$ver = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    $ver = Test-Cdp $Port
    if ($ver) { break }
}

if ($ver) {
    Write-Output "CDP ready on port $Port"
    Write-Output "webSocketDebuggerUrl: $($ver.webSocketDebuggerUrl)"
    exit 0
}

Write-Error "Browser started (pid $($proc.Id)) but CDP did not answer on port $Port within 15s."
exit 1
