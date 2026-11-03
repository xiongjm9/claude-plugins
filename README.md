# claude-plugins

本机工具的自定义插件和技能，每个子目录一个，各自的 README 写明安装方法。

| 插件 | 说明 |
| --- | --- |
| [ai-usage-review](ai-usage-review/) | 汇总本机 Claude Code / Antigravity / Grok 日志，统计会话、提示、返工和危险 git 命令 |
| [antigravity-custom-theme](antigravity-custom-theme/) | Antigravity 浅色主题与中文主题切换器，更新后由守护进程自动恢复 |
| [cdp-launch](cdp-launch/) | 用独立用户目录启动带远程调试端口的 Chrome / Edge，供 CDP 测试使用 |
| [dsh-compaction-codex](dsh-compaction-codex/) | DeepSeek Harness 的 Codex 式上下文压缩后端：压缩时保留最近的用户原话逐字加摘要，源码原在业务仓库，已迁到本仓库统一维护 |
| [grill-video](grill-video/) | 视频分镜追问技能（Claude Code / Grok）：分轮问清运镜、景别、光线、声音，确认分镜单后再写 Grok / Muse 视频提示词或出片 |
| [git-guard](git-guard/) | 拦住 AI agent 的危险 git 操作：pre-push 钩子拒绝删远程分支和改写受保护分支，Antigravity 插件让 reset --hard、clean、checkout 文件、强推每次都先确认 |
| [legacy-parity-fix](legacy-parity-fix/) | 翻新页面单点修复技能（Claude Code / Grok / Antigravity）：先锁定仓库和文件，按旧 C# 源码逐项比对，只改差异并列出依据 |
| [skills-sync](skills-sync/) | 把 `~/.agents/skills` 同步成各客户端 junction，检查缺失、断链和错误指向 |
