# legacy-parity-fix

已翻新的 Vue3 页面和旧 C# ERP 行为不一致时，用这个技能做单点修复。Claude Code、Grok、Antigravity 都能用。

来源是 2026-10 的日志复盘：

- 水单（ms-water-memo、ms-finance）在 Antigravity 里有约 86 个会话，大多是"bug 单 + 对比老系统"的单点修复。其中只有 6 个加载过 `cshtml-to-vue3`，因为它的触发条件只写了整模块翻新。
- 返工集中在：擅自加文案和兜底、改错仓库、整文件 `git checkout` 丢改动、没自测就说修好了。

技能要求模型按四步做：

1. 先锁定仓库、分支、页面、旧系统对照和不许动的范围。
2. 找到旧代码的 `文件:行号` 作为证据。
3. 只比对与问题相关的项，只改有差异的地方。相关项包括：显隐、默认值、校验、文案、字典反显、提交参数、成功和失败之后的交互。
4. 交付时逐处列出改动和依据，如实说明自测情况。

数据源对照直接引用 `~/.agents/skills/cshtml-to-vue3/references/` 里的映射文件，不在本技能里重复。

## 安装

```
powershell -ExecutionPolicy Bypass -File install.ps1
```

脚本只建 junction：

- `~/.agents/skills/legacy-parity-fix` 指向本目录。
- `~/.claude/skills/legacy-parity-fix` 和 `~/.grok/skills/legacy-parity-fix` 再链到 `~/.agents/skills/legacy-parity-fix`。

Antigravity 通过 `~/.gemini/config/skills.json` 读 `~/.agents/skills`，不用另装。

SKILL.md 引用其它技能时写的是 `~/.agents/skills/...` 的完整路径。本目录的真实位置在 D 盘，客户端如果按真实路径解析，`../` 会落到 `D:\claude-plugins`，那里没有这些文件。

## 和其它翻新技能的分工

| 场景 | 用哪个 |
| --- | --- |
| 一个页面或弹窗的 bug，或与旧系统不一致 | legacy-parity-fix |
| 整个模块从 cshtml 翻新到 Vue3 | cshtml-to-vue3 |
| 提取旧页面需求 | legacy-cshtml-requirements |

`cshtml-to-vue3` 的描述里也有"对照旧ERP""ElMessage""接口catch提示"这些触发词，修 bug 时两个技能可能都被匹配到。
