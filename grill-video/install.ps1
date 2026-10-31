# grill-video 安装：从仓库目录运行，只建 junction，不复制、不删除。
#   ~/.agents/skills/grill-video -> 本目录
#   ~/.claude/skills/grill-video、~/.grok/skills/grill-video -> ~/.agents/skills/grill-video（客户端技能目录不存在就跳过）
$ErrorActionPreference = 'Stop'
$name = 'grill-video'
$source = $PSScriptRoot
$entity = Join-Path $env:USERPROFILE ".agents\skills\$name"

function Get-JunctionTarget([string]$path) {
    $item = Get-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
    if ($null -eq $item) { return $null }
    if ($item.LinkType -ne 'Junction') { throw "$path 已存在且不是 junction，请先手动处理" }
    return ([string]@($item.Target)[0]).TrimEnd('\')
}

function Set-Junction([string]$path, [string]$target) {
    $current = Get-JunctionTarget $path
    if ($null -eq $current) {
        New-Item -ItemType Junction -Path $path -Target $target | Out-Null
        Write-Output "已创建 $path -> $target"
    } elseif ($current -ieq $target.TrimEnd('\')) {
        Write-Output "已就绪 $path"
    } else {
        throw "$path 指向 $current，不是 $target"
    }
}

if ($source -ieq $entity) { throw '请在仓库目录里运行本脚本，不要从技能链接里运行' }
New-Item -ItemType Directory -Force -Path (Split-Path $entity) | Out-Null
Set-Junction $entity $source
foreach ($dir in @('.claude\skills', '.grok\skills')) {
    $root = Join-Path $env:USERPROFILE $dir
    if (Test-Path -LiteralPath $root) { Set-Junction (Join-Path $root $name) $entity }
    else { Write-Output "跳过 $root（目录不存在）" }
}
