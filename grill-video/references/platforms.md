# 平台能力（核对于 2026-10-31）

以当前工具的参数说明、App 界面和实际返回为准。本文件和它们冲突时，按实际情况做，并告诉用户哪里不一样。

## Grok Build / Grok Bot（本机 `grok` CLI 与桌面端）

来源：本机 `~/.grok/bundled/skills/imagine/SKILL.md`、`~/.grok/docs/user-guide/04-slash-commands.md`（grok 1.0.70）。

- 工具：`image_gen`（新图）、`image_edit`（改图）、`reference_to_video`（唯一的视频工具）。没有纯文字生视频：纯文字需求先用 `image_gen` 出首帧图。
- `image_gen` 画幅：1:1、16:9、9:16、3:2、2:3、auto。`image_edit` 的参考图会缩到长边约 768px，细节和小字留不住。
- `reference_to_video` 参数：
  - `prompt`、`aspect_ratio` 必填；`duration` 1–15 秒（默认 6）；`resolution_name` 480p / 720p。
  - `images` 最多 14 张参考图，提示词里写 `<IMAGE_i>`；参考图会被重新渲染，不会原样出现。
  - `first_frame` / `last_frame` 是原样出现的首帧和尾帧；两者用同一张图就是无缝循环。
  - `keyframes` 最多 4 个 `{image, timestamp_s}`，时间按 1/3 秒取整。
  - `voices` 最多 3 个预设声音（如 ara、eve、leo、rex），提示词里写 `<AUDIO_0>` 并写出台词。
  - 至少传一种图片或声音。标签按 `first_frame`、`images`、`keyframes`、`last_frame` 的顺序编号：设了 `first_frame` 时，第一张 `images` 是 `<IMAGE_1>`。
- 限制：免费和 X Basic 档返回升级提示；零数据保留（ZDR）模式没配存储桶时报存储错误。遇到这两种情况，原话转告，不重试。
- 本机实测（2026-10-31）：`auth.json` 里团队 ZDR 为 false，但 `reference_to_video` 仍报 “unavailable under zero data retention (ZDR)”，提示关闭 `/privacy` 模式或配置 `tools.zdr_video_output_s3` 存储桶。`image_gen` 不受影响。`/privacy` 对应“Coding data, retention, and training”的 Opt in / Opt out，是用户账号的隐私决定：只转告，不替用户改。
- 内置写法建议：动态提示词 1–2 句、现在时、运镜明确；运动写成画面内的位置变化；一镜一个主体、一个简单动作；多用 6 秒短镜头。
- 连续镜头：下一镜的 `first_frame` 用上一镜视频的真实尾帧：`ffmpeg -sseof -0.05 -i shot1.mp4 -frames:v 1 last.png`。拼接用 `ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4`，所有镜头保持同一分辨率和帧率。
- `/imagine-video` 是内置命令，会自己规划镜头，不会先问用户。想先追问再出片，用 `/grill-video`。
- 生成的图片存放在 `~/.grok/sessions/<编码后的工作目录>/<会话 id>/images/N.jpg`，不在当前工作目录。交付时给完整路径。

## Grok Imagine（xAI API 与 Grok App）

来源：docs.x.ai 视频文档（2026-10-31 读取）；第三方指南 jxp.com、morphic.com；`Rion-Wu-tech/grok-video-workflow`。

- API 模型：
  - `grok-imagine-video-1.5`：文生视频和图生视频原生 1080p，最多 14 张参考图，3 个声音参考，可固定首尾帧和 4 个关键帧。
  - `grok-imagine-video-1.5-lite`：最便宜，1080p 由 720p 放大，不支持参考图和固定帧。
  - `grok-imagine-video`：480p / 720p，最多 7 张参考图；只有它支持编辑（源视频 ≤ 8.7 秒）和续写（+2–10 秒）。
- API 时长 1–15 秒。画幅：1:1、16:9、9:16、4:3、3:4、3:2、2:3、21:9、5:2；图生视频跟随输入图的比例。提示词上限 4096 个字符（第三方说明）。
- 官方写法：“Describe the shot, including camera movement, lighting, and sound.” 图生视频时图就是首帧，提示词写接下来发生什么。编辑时写清哪些保持不变。
- 第三方经验（未经 xAI 证实）：
  - 图生视频不复述图里的内容，动词放前面。
  - 锁死镜头写 camera not moving；stable camera / steady shot 会漂。
  - 镜头动作最多 3 段，按顺序用逗号和 then 连接。
  - 有物理接触（落地、关门、踩水）和户外场景时更容易出声音；纯情绪的提示词常常只出音乐。
  - 对白用引号；口型要正脸近景、台词短。
- App 里的时长、画幅、模式选项以界面为准。

## Meta Muse（muse.ai / Meta AI）

来源：Meta 发布会报道（digitalapplied.com 转述）、Meta 帮助中心、useapi.net（2026-10-30，第三方）。

- Muse Video：Meta Superintelligence Labs 于 2026-07-07 预览，原生生成声音。Meta 自己承认的弱点是音画同步和快速运动的物理真实感。写提示词时动作放慢、台词短，避免快速复杂动作。
- Meta 官方 API 不提供视频生成（第三方说法）。muse.ai 网页据第三方称可生成约 10 秒、约 720p、带声音的视频；引号里的对白会被说出来；支持图生视频。均未经 Meta 证实。
- Meta AI / Vibes 的 Animate：选图 → Animate → 可写提示词、可加 Music → 再点 Animate。官方建议：详细写出场景、画面内容和风格，给具体指令；这些写法同样适用于把图变成视频。编辑生成的视频最长 10 秒。
- 帮助页没有说明 Animate 用的是不是 Muse Video；时长和画幅以界面为准。用户告诉你界面上的选项后，按这些选项写分镜单。
