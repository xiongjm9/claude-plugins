# 提示词规则、模板与排障

## 通用规则

1. 用完整的英文句子写，像给摄影师交代镜头；不堆 masterpiece、4K、8K、ultra-detailed 这类词。分辨率在界面里选。
2. 重要的放前面：主体和动作在前，风格和氛围在后。
3. 一个镜头只有一个主动作、一个主运镜，速度默认 slow。
4. 运动写成位置变化：从哪到哪、走多远。只写 moves、drifts，主体常会原地晃动。镜头跟着人走（跟拍、横移）时，人在画面里的位置基本不变，位置变化写在背景上，例如 the glowing signs slide past behind her。要人横穿画面，就用固定镜头或摇镜头。
5. 情绪不写 sad、angry，写 2–4 个看得见的身体细节：shoulders drop, a slow exhale, eyes lift to the window。
6. 不写矛盾的内容：特写和大全景、静止的湖面和湍急的水流不能同时出现。
7. 写清结尾画面：ending on …。模型会把结尾当作这一镜要走到的地方。
8. 声音挂在画面事件上：the door slams, a sharp impact sound；再加一个环境声。
9. 每个镜头至少有 1 个环境细节、1 个身体或物件细节、1 个声音。
10. 正面描述为主；必须排除时，在最后一句简短写。
11. 多镜头时，角色和场景描述每镜逐字重复。生成之间不会记住上一镜。
12. 导演名、片名、品牌、IP 名改成具体的光线、色调、构图、运镜描述。

## 首帧图提示词（静态，2–5 句）

```
[Shot size], [angle], [lens]. [Subject with fixed traits], [starting pose], [location, time, weather].
[Lighting], [color grade], [style].
```

## 动态提示词（只写变化，1–3 句，现在时）

```
[Subject] [moves from A to B / turns from X to Y] as the camera [one move, speed], ending on [final frame].
[Secondary motion: rain, hair, steam]. Audio: [action sound], [ambience], [music or "no music"]; [dialogue in quotes].
```

图生视频时不重复描述首帧图里已有的东西，只写动作、运镜、节奏和声音。

## 纯文生视频（只能输入一段文字时）

把首帧图提示词和动态提示词合并成一段：先写景别、主体、环境，再写动作和运镜，最后写光线、风格、声音。控制在 60–150 个英文单词；Grok API 上限 4096 个字符。

## 示例

用户：“想要一只橘猫在下雨天趴在窗台上看雨，最后转头看镜头，温馨一点。”

追问后确定：Grok Bot，先出首帧图，9:16，1 镜 × 6 秒，写实，近景平视，慢推，窗光，雨声 + 呼噜声，不要音乐。

首帧图提示词：

```
Medium close-up at eye level, 85mm lens, shallow depth of field. A fluffy orange tabby cat lies on a wooden windowsill, facing the rain-streaked window, tail curled around its paws, on a gray rainy afternoon.
Soft cool window light on the cat's face, a warm lamp glowing in the room behind, gentle warm-cool contrast, photorealistic.
```

动态提示词：

```
The camera slowly pushes in as the cat turns its head from the window to look straight into the lens, ending on a close-up of its amber eyes. Raindrops keep sliding down the glass. Audio: steady rain tapping on the window, a soft purr, no music.
```

界面设置：9:16、6 秒、720p，首帧用上面生成的图。

说明：
- slowly pushes in ... ending on a close-up：慢推，最后停在猫眼特写。镜头漂移时把运镜换成 camera not moving。
- turns its head from the window to ... the lens：写了转头的起点和终点，防止原地晃。
- warm lamp ... warm-cool contrast：屋里暖、窗外冷，温馨感来自这里。觉得太冷就删掉 cool。

## 排障表

| 出片问题 | 改法 |
|---|---|
| 主体不动或原地晃 | 动作改成“从 A 到 B”的位置变化；或固定尾帧，写清结束位置 |
| 人物中途掉头、转身 | 检查钉住的尾帧朝向是否和首帧一致；不一致先用 `image_edit` 改尾帧，或不钉尾帧 |
| 跟拍时人跑出画面或忽大忽小 | 删掉“人从左走到右”，改写背景从身边滑过 |
| 镜头乱飘 | 只留一个运镜；要锁死写 camera not moving，不写 stable / steady |
| 变脸、换装 | 传同一张参考图，每镜逐字重复外观描述；动作放慢，减少转身 |
| 手和肢体变形 | 动作简单些，少写手部细节，或让手出画 |
| 没有声音 | 加一个物理事件的音效（落地、关门、踩水）和一个环境声；纯情绪的画面常常只出音乐 |
| 口型对不上 | 改成正脸近景，台词缩短到一句；或不要对白，后期配音 |
| 画面出现乱码文字 | 删掉提示词里所有招牌、字幕描述；文字后期加 |
| 风格跑偏成写实 | 风格词放到第一句；风格化的图用更短的动态提示词 |
| 结尾停得突兀 | 写 ending on 加具体画面 |
| 画面平淡 | 加 1 个环境动态（雨、雾、光粒）和 1 个身体细节；或换更强的景别和角度 |
| 动作太快、太乱 | 一镜一个动作；多的拆到下一镜 |
| 首帧太复杂，动起来就糊 | 主体固定，只让镜头慢推或环绕；或换一张更简单的首帧 |
