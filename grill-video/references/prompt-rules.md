# 提示词规则、模板与排障

## 通用规则

1. 用完整的英文句子写，像给摄影师交代镜头；不堆 masterpiece、4K、8K、ultra-detailed、cinematic、stunning、epic 这类词。分辨率在界面里选。
2. 重要的放前面：主体和动作在前，风格和氛围在后。
3. 一个镜头只有一个主动作、一个主运镜，速度默认 slow；惊艳向可在同一运镜里写速度变化（almost still, then a sudden push）。
4. 运动写成位置变化：从哪到哪、走多远。只写 moves、drifts，主体常会原地晃动。镜头跟着人走（跟拍、横移）时，人在画面里的位置基本不变，位置变化写在背景上，例如 the glowing signs slide past behind her。要人横穿画面，就用固定镜头或摇镜头。
5. 情绪不写 sad、angry，写 2–4 个看得见的身体细节：shoulders drop, a slow exhale, eyes lift to the window；其中至少 1 个是可复述的强细节。
6. 不写矛盾的内容：特写和大全景、静止的湖面和湍急的水流不能同时出现。尺度反差用「先全景再切特写」的多镜头，或「远景里的小主体 + 镜头推到细节」。
7. 写清结尾画面：ending on …。模型会把结尾当作这一镜要走到的地方。惊艳向的 ending on 必须含意外或揭示。
8. 声音挂在画面事件上：the door slams, a sharp impact sound；再加一个环境声。钩子音对准意外节点。
9. 每个镜头至少有 1 个环境细节、1 个身体或物件细节、1 个声音。
10. 正面描述为主；必须排除时，在最后一句简短写。
11. 多镜头时，角色和场景描述每镜逐字重复。生成之间不会记住上一镜。
12. 导演名、片名、品牌、IP 名改成具体的光线、色调、构图、运镜描述。
13. **惊艳自检（写完必过）：** 提示词里能否指出反差句、非常规机位或节奏突变句、意外 ending、声音钩子？缺哪条补哪条，禁止用形容词冒充。

## 首帧图提示词（静态，2–5 句）

```
[Shot size], [angle], [lens]. [Subject with fixed traits], [starting pose], [location, time, weather].
[Lighting with contrast], [color grade], [one memorable detail], [style].
```

## 动态提示词（只写变化，1–3 句，现在时）

```
[Subject] [moves from A to B / turns from X to Y] as the camera [one move, with optional speed change], ending on [unexpected final frame].
[Secondary motion tied to the beat]. Audio: [impact on the reveal], [ambience], [music or "no music"]; [dialogue in quotes].
```

图生视频时不重复描述首帧图里已有的东西，只写动作、运镜、节奏和声音。

## 纯文生视频（只能输入一段文字时）

把首帧图提示词和动态提示词合并成一段：先写景别、主体、环境，再写动作和运镜，最后写光线、风格、声音。控制在 60–150 个英文单词；Grok API 上限 4096 个字符。

## 示例 A（平实版——对照用，默认不要出这种）

用户：“想要一只橘猫在下雨天趴在窗台上看雨，最后转头看镜头，温馨一点。”

平实推荐：近景平视，匀速慢推，窗光，雨声 + 呼噜，无意外。

## 示例 B（惊艳向——默认应出这种）

同一用户需求，惊艳向确定：Grok Bot，先出首帧图，9:16，1 镜 × 6 秒，写实；**低机位微仰 + 近景**；**前 4 秒几乎固定，最后 1.5 秒急推到一只琥珀眼**；窗外冷雨光 vs 屋里一盏暖台灯；雨声 + 最后一下很轻的呼噜作为钩子；no music。

哇点：1) 冷暖反差 2) 节奏突变急推 3) ending 大特写眼睛 4) 声音钩子对准转头瞬间

首帧图提示词：

```
Low-angle medium close-up, 85mm lens, shallow depth of field. A fluffy orange tabby cat lies on a wooden windowsill, body facing a rain-streaked window, one paw slightly overhanging the ledge, on a gray rainy afternoon.
Cool blue window light on the wet glass and the cat's cheek, a small warm table lamp glowing in the dark room behind, strong warm-cool contrast, a single raindrop frozen mid-slide on the pane near the whiskers, photorealistic.
```

动态提示词：

```
The camera stays almost locked as rain keeps sliding down the glass; in the final second it suddenly pushes in as the cat turns from the window to stare straight into the lens, ending on an extreme close-up of one amber eye filling the frame. Audio: soft rain on glass, then a single low purr on the head-turn, no music.
```

界面设置：9:16、6 秒、720p，首帧用上面生成的图。

说明：
- stays almost locked ... suddenly pushes in：节奏突变，避免匀速慢推的平。
- ending on an extreme close-up of one amber eye：意外尺度，记住的是「一只眼」。
- cool window light ... warm table lamp：冷暖反差撑住「温馨」而不俗。
- purr on the head-turn：声音钩子钉在转头帧；仍平就改成爪轻轻点到玻璃的一声。

## 排障表

| 出片问题 | 改法 |
|---|---|
| 主体不动或原地晃 | 动作改成「从 A 到 B」的位置变化；或固定尾帧，写清结束位置 |
| 人物中途掉头、转身 | 检查钉住的尾帧朝向是否和首帧一致；不一致先用 `image_edit` 改尾帧，或不钉尾帧 |
| 跟拍时人跑出画面或忽大忽小 | 删掉「人从左走到右」，改写背景从身边滑过 |
| 镜头乱飘 | 只留一个运镜；要锁死写 camera not moving，不写 stable / steady |
| 变脸、换装 | 传同一张参考图，每镜逐字重复外观描述；动作放慢，减少转身 |
| 手和肢体变形 | 动作简单些，少写手部细节，或让手出画 |
| 没有声音 | 加一个物理事件的音效（落地、关门、踩水）和一个环境声；纯情绪的画面常常只出音乐 |
| 口型对不上 | 改成正脸近景，台词缩短到一句；或不要对白，后期配音 |
| 画面出现乱码文字 | 删掉提示词里所有招牌、字幕描述；文字后期加 |
| 风格跑偏成写实 | 风格词放到第一句；风格化的图用更短的动态提示词 |
| 结尾停得突兀 | 写 ending on 加具体画面 |
| 画面平淡、没惊艳感 | 加反差光、换非常规机位、把匀速运镜改成节奏突变、ending 做尺度/揭示意外、声音钩子对准高潮帧；不要堆形容词 |
| 动作太快、太乱 | 一镜一个动作；多的拆到下一镜 |
| 首帧太复杂，动起来就糊 | 主体固定，只让镜头在最后加速推近；或换一张更简单的首帧 |
