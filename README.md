# claude-plugins

本机工具的自定义插件和技能，每个子目录一个，各自的 README 写明安装方法。

| 插件 | 说明 |
| --- | --- |
| [antigravity-custom-theme](antigravity-custom-theme/) | Antigravity 浅色主题与中文主题切换器，更新后由守护进程自动恢复 |
| [grill-video](grill-video/) | 视频分镜追问技能（Claude Code / Grok）：分轮问清运镜、景别、光线、声音，确认分镜单后再写 Grok / Muse 视频提示词或出片 |
| [git-guard](git-guard/) | 拦住 AI agent 的危险 git 操作：pre-push 钩子拒绝删远程分支和改写受保护分支，Antigravity 插件让 reset --hard、clean、checkout 文件、强推每次都先确认 |
