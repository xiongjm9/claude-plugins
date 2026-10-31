# grill-video

视频分镜追问技能，用于 Claude Code 和 grok CLI / Grok Bot。

你描述想要的画面，它把运镜、景别、机位、光线、环境、节奏、声音这些没说清的地方分轮问你，每题附推荐答案。你确认分镜单后，它写出 Grok Imagine / Meta Muse 可用的首帧图提示词和动态提示词。会话里有出图、出片工具时（如 Grok Bot），先出首帧图给你看，满意了再出视频。

## 安装

在本目录执行：

```
powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1
```

脚本只建 junction，不复制文件：

- `~/.agents/skills/grill-video` → 本目录
- `~/.claude/skills/grill-video`、`~/.grok/skills/grill-video` → `~/.agents/skills/grill-video`；客户端没装就跳过

所有客户端读到的都是本目录，改技能直接改这里，然后在本仓库提交。重复执行没有副作用；目标位置已有别的目录或指向别处的链接时，脚本报错退出，不覆盖。

## 使用

- Grok Bot / grok CLI：`/grill-video 你想要的画面`。不要用自带的 `/imagine-video`，它不会先问你。
- Claude Code：`/grill-video 你想要的画面`。这里没有出图出片工具，只交付提示词。

## 文件

| 文件 | 内容 |
| --- | --- |
| `SKILL.md` | 流程：读需求 → 分轮追问 → 分镜单确认 → 写提示词 → 出图出片 → 调优 |
| `references/shot-nodes.md` | 各节点的问法、选项（画面效果 / 术语 / 英文写法）和推荐规则 |
| `references/prompt-rules.md` | 提示词规则、模板、示例和排障表 |
| `references/platforms.md` | Grok Build、Grok Imagine API、Meta Muse 的能力与限制，附来源和核对日期 |
| `agents/openai.yaml` | Codex 的显示名和调用策略 |

## 已知限制

- Grok：账号处于零数据保留（ZDR）状态时，`reference_to_video` 报错，出图不受影响。2026-10-31 在本机实测到，详见 `references/platforms.md`。
- Meta Muse 没有公开的视频接口，只交付提示词；时长和画幅以 Muse 界面为准。
