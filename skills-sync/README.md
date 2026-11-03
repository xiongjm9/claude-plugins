# skills-sync

把 `~/.agents/skills` 下的技能目录同步成各客户端的 junction，并检查断链。

## 用法

```powershell
# 只检查，不改（默认）
powershell -ExecutionPolicy Bypass -File skills-sync.ps1

# 创建缺失的 junction；-FixBroken 同时重建断链
powershell -ExecutionPolicy Bypass -File skills-sync.ps1 -Apply -FixBroken
```

默认源目录 `%USERPROFILE%\.agents\skills`，默认客户端：

- `%USERPROFILE%\.claude\skills`
- `%USERPROFILE%\.grok\skills`

脚本只处理含 `SKILL.md` 的目录，不会动客户端里已有的第三方技能或真实目录。断链只在 `-FixBroken` 时删除重建；真实目录冲突只报告，不覆盖。

同时检查 `%USERPROFILE%\.gemini\config\skills.json` 是否包含源目录（Antigravity 的技能入口），不包含时只提示，不改 Antigravity 配置。

## 退出码

- `0`：全部正常，或 `-Apply` 后已修复。
- `1`：仍有缺失、断链或冲突。

## 参数

| 参数 | 说明 |
| --- | --- |
| `-Source` | 技能源目录 |
| `-Clients` | 客户端技能目录，可传多个 |
| `-Apply` | 实际创建 junction；不加只预览 |
| `-FixBroken` | 删除并重建断链 |
| `-SkipAntigravity` | 不检查 `skills.json` |

## 限制

- 只支持 Windows junction；需要目录在同一磁盘，或目标路径可被 junction 指向。
- 不修改技能内容，不删除源目录。
