# 分镜节点：问法、选项与推荐

每个节点：何时不用问 → 怎么问 → 选项（画面效果 / 术语 / 英文写法）→ 默认推荐。选项按当前平台能力删减，只给 2–4 个最贴合这个画面的选项。

## 第 1 轮 基础

**起点**（用户没给图时问）
- A. 先出一张首帧图，满意再让它动（最可控）
- B. 用我自己的图做首帧
- C. 纯文字直接生成（快，但画面不可控）
- 推荐 A。Grok Build/Grok Bot 里视频必须从图片开始，那里不给 C，只问 A 或 B。

**平台**（没说时问）：Grok Imagine（Grok App/网页/Grok Bot）或 Meta Muse（muse.ai/Meta AI）。只用一个平台时，不问这一项。

**用途与画幅**（说了发布平台就直接推出）

| 用途 | 画幅 |
|---|---|
| 抖音、快手、视频号、小红书、Reels、Shorts | 9:16 竖屏 |
| B 站、YouTube、横屏广告、电影感短片 | 16:9 横屏 |
| 头像、朋友圈、方形帖 | 1:1 |

**时长与镜头数**
- 一个镜头只讲一件事。Grok 推荐多个 6 秒短镜头，少用长镜头。
- 用户描述里有先后几件事时，拆成 2–3 个镜头，分开生成再拼接。
- 推荐：单个动作 1 镜 × 6 秒；有起因和结果的小故事 2–3 镜 × 6 秒。
- 分辨率不用问：默认用工具支持的最高档（Grok Build 是 720p）；用户说要省额度时用 480p。

**主体外观**（只问影响画面、用户又没说的）
- 人：年龄段、发型发色、服装颜色和材质、一个标志物（红伞、耳机）。
- 动物/物件：品种或型号、颜色、材质、尺寸感。
- 用户不在乎的细节按风格补全，写进分镜单里的“采用推荐的项”。

**风格**
- A. 写实实拍（photorealistic, shot on 35mm）
- B. 胶片感（35mm film look, soft grain, gentle halation）
- C. 3D 动画（stylized 3D animation, soft global illumination）
- D. 日系动画（anime style, clean line art, painted backgrounds）
- 还可以是：水彩、黏土定格（claymation）、赛博霓虹（neon cyberpunk）。
- 用户提到电影或导演时，翻译成具体的光线、色调、构图、运镜写进提示词，不写名字。
- 推荐：没说时用 A。

## 第 2 轮 每个镜头

**景别**

| 画面效果 | 术语 | 英文 |
|---|---|---|
| 人很小，交代环境和氛围 | 大远景 | extreme wide shot |
| 人物全身和周围环境 | 全景 | wide shot / full shot |
| 腰部以上，看清动作和表情 | 中景 | medium shot |
| 胸口以上，聚焦表情 | 近景 | medium close-up |
| 只有脸或一个物件，情绪最强 | 特写 | close-up |
| 眼睛、手指等局部 | 大特写 | extreme close-up |

推荐：有对白用近景；交代环境用全景；强调情绪用特写；拍产品用特写。

**机位角度**

| 画面效果 | 术语 | 英文 |
|---|---|---|
| 和人眼一样高，最自然 | 平视 | eye-level |
| 从下往上拍，显得高大、有气势 | 仰拍 | low angle |
| 从上往下拍，显得渺小、孤独 | 俯拍 | high angle |
| 正上方往下看 | 顶拍 | overhead / top-down |
| 画面倾斜，不安、失衡 | 斜角 | dutch angle |
| 从一个人肩后看另一个人 | 过肩 | over-the-shoulder |
| 观众就是角色本人 | 主观视角 | POV shot |

推荐：默认平视；要气势或产品高级感用仰拍；要孤独感用俯拍。

**运镜**（每个镜头只选一个主运镜）

| 画面效果 | 术语 | 英文 |
|---|---|---|
| 镜头不动，只有画面里的东西在动 | 固定 | locked camera, camera not moving |
| 慢慢靠近主体 | 推 | slow push-in / dolly in |
| 慢慢后退，露出环境 | 拉 | slow pull-back to reveal |
| 原地左右转 | 摇 | pan left / pan right |
| 原地上下转 | 升降摇 | tilt up / tilt down |
| 跟着人物侧面一起走 | 横移跟拍 | tracking shot alongside |
| 跟在人物背后走 | 跟随 | follow shot from behind |
| 绕着主体转 | 环绕 | slow orbit around |
| 镜头升高往下看 | 升镜 | crane up / rising shot |
| 高空飞越 | 航拍 | aerial drone shot |
| 轻微晃动，像手机实拍 | 手持 | handheld, subtle shake |

- 速度默认写 slow。快速运镜只用在追逐、冲击类镜头。
- 跟拍、横移时人在画面里的位置基本不变，背景在动；用户要的是“人从画面一边走到另一边”时，推荐固定镜头或摇镜头。
- Grok 里要锁死镜头时写 camera not moving；stable camera / steady shot 会被理解成平稳移动，镜头会漂。
- 推荐：亲密或情绪用推；孤独或揭示用拉；宏大用升镜或航拍；产品用环绕；行走用跟拍；纪实感用手持；动作复杂时用固定。

**焦段与景深**（用户一般不问，直接按景别推荐，写进“采用推荐的项”）
- 人像 85mm、浅景深（85mm lens, shallow depth of field, soft bokeh）
- 环境 24–35mm（24mm wide lens / 35mm lens）
- 产品细节 100mm 微距（100mm macro）
- 需要背景清楚时：deep focus

**动作节拍与结尾画面**（必问结尾）
- 问：这几秒里先发生什么、再发生什么？最后一帧停在什么画面？
- 写法：动作写成画面里的位置变化，例如“从画面左侧走到中央”“头从看窗外转到看镜头”。只写 moves、drifts 这类动词，主体常会原地晃动。
- 一个镜头只放一个主动作。情绪用 2–4 个看得见的身体细节表达，例如肩膀放松、呼吸、眨眼。
- 节奏：正常速度 / 慢动作（slow motion）/ 延时（timelapse）。

**光线与时间**

| 画面效果 | 英文 |
|---|---|
| 日落前的暖金色侧光 | golden hour, warm low sun |
| 背对光源，人物边缘发亮 | backlit, rim light |
| 阴天，柔和无硬影 | overcast soft light |
| 窗边自然光 | soft window light |
| 夜晚霓虹灯 | neon signs at night, wet reflections |
| 清晨或傍晚的蓝色调 | blue hour |
| 烛光、火光 | warm candlelight / firelight |
| 顶光、聚光灯，戏剧感 | hard top light, single spotlight |

**色调**：暖色（warm amber tones）、冷色（cool blue tones）、电影青橙（teal and orange grade）、低饱和复古（muted desaturated palette）、鲜艳（vivid saturated colors）、黑白（black and white）。

**环境动态**（选 0–2 个，让画面更有生气）：雨（rain streaks）、雪（falling snow）、雾（low fog / haze）、风吹头发衣服（wind moving hair and coat）、落叶花瓣（drifting leaves / petals）、空气里的尘埃光粒（dust motes in light beams）、蒸汽（rising steam）、水面倒影（reflections on water）。推荐：加 1 个和光线匹配的。

## 第 3 轮 声音与约束

**对白**（先问有没有）
- 有对白时问：谁说、原话（10 个字左右）、语言和口音。
- 要对上口型：正脸近景，嘴在画面里，台词短。Grok Build 可以选预设声音（ara、eve、leo、rex）。
- 推荐：短视频没有必要时不加对白，口型是目前最容易出错的地方。

**音效与环境声**
- 音效挂在画面里的物理事件上：踩水声、关门声、雨打玻璃。
- 环境声写整体氛围：远处车流、风声、人群、鸟叫。
- 推荐：每个镜头 1 个动作音效 + 1 个环境声。

**音乐**：风格 + 情绪，例如 soft piano、tense low drone、upbeat lo-fi beat。用户要后期配热门音乐时，推荐不要音乐，只留环境声。

**要避免的**：画面文字、字幕、水印、多余的人、变形的手。提示词以正面描述为主，确实需要排除时放在最后一句。

**多镜头一致性**（2 镜以上必问）
- 固定一段角色描述（外观、服装、标志物）和一段场景描述，每个镜头逐字重复。
- 有工具时先出一张角色参考图，之后每个镜头都传这张图。
