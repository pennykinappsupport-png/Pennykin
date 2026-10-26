# Pennykin Rest · 猫兔原画分层版

v1.11.6 / build 60。小猫、小兔现在采用与已认可的小狗版相同的原生Rest流程。小狗动画JSON及三只宠物的Clean动画保持build 59内容。

## 时间轴与视觉

1024×1024，15fps编排；每只宠物分别使用自己的原图、闭眼差分、张嘴差分与趴睡原画，原PNG字节保持不变。

| 阶段 | composition区段 | 行为 |
|---|---|---|
| 入睡 | [0,15)，15帧 / 1.0秒 | 困倦、哈欠、身体压缩下沉、原趴睡姿态、Zzz和RESTING渐显。 |
| 深度睡眠 | [15,45)，每轮30帧 / 2.0秒 | 独立rest_loop，躯干以底部为锚点从102%压至98%再回到102%；闭眼面部保持稳定，耳朵轻微上下移动1.5源像素。Zzz和梦境泡泡循环，最多持续30秒。 |
| 唤醒 | [45,57)，12帧 / 0.8秒 | 扬耳蓄力、睁眼拉伸、爱心反馈、清除休息层并恢复清醒坐姿。 |

五个根图层依次为bg_layer、pet_body_layer、pet_face_layer、fx_zzz_layer、ui_prompt_layer。猫保留乳白与淡紫原画、竖耳和蓬松尾巴；兔保留灰蓝原画、长垂耳和短尾。各自按趴姿脚底高度、耳根、头颈、前爪位置设置蒙版和支点，未套用小狗形象。

坐姿尾巴独立归入身体，避免在头部下沉或唤醒时被一起切走。组透明度已计算到实际绘制层，避免Lottie null图层透明度不继承造成双头叠加。整个睡眠循环中，清醒头、清醒躯干、坐姿尾巴和哈欠素材实际透明度均为零。

## 播放与交互

- 所有物种都使用常驻的NativeRestArt和同一个原生分段播放控制器。JSON在本地打包，隐藏的原生视图在主界面提前加载图片和composition。
- 入睡、唤醒只由原生完成事件推进；30秒上限属于阶段计时。没有JS定时切图片、setInterval或逐帧React state。
- 睡眠期间点击屏幕任意位置即可唤醒；双击宠物会在第一次点击时开始唤醒，与已认可的小狗版一致。
- 透明全屏点击层拦截底下的按钮和导航，避免同一次点击唤醒又消费照料资源；Android返回键也可唤醒。
- 手动唤醒触发一次Light震动及轻柔唤醒音，尊重静音设置；后台暂停、回到前台继续原位置和剩余休息时间。
- 入睡和唤醒防重复触发；过期请求、取消和重复完成事件被忽略。资源失败取消本次动作并提示错误。
- 睡眠期间关闭旧Rest渲染器、旧Zzz、闲置晃动和清醒表情层；醒后清除Rest并回到清醒待机。

## 预览文件

| 宠物 | 短预览 | 完整时序 |
|---|---|---|
| 猫 | docs/rest-cat/cat-rest-preview.mp4，7.8秒 | docs/rest-cat/cat-rest-30s.mp4，31.8秒 |
| 兔 | docs/rest-rabbit/rabbit-rest-preview.mp4，7.8秒 | docs/rest-rabbit/rabbit-rest-30s.mp4，31.8秒 |

短预览展示1秒入睡、三轮共6秒呼吸、0.8秒手动唤醒，并附唤醒提示音。完整时序展示1秒入睡、30秒睡眠、0.8秒自动唤醒。

视频由实际接入的JSON通过Lottie Web离线渲染；不能在MP4中点击或感受震动，交互已接入App。各物种docs文件夹内附57个编排帧、关键帧联系图、原素材SHA-256和视频参数检查结果。

## 工程文件与验证

- assets/animation/rest-cat/cat.json、rest-rabbit/rabbit.json：本次接入的猫兔动画。
- assets/animation/rest-dog/dog.json：已认可的小狗composition，字节未修改。
- src/restSources.ts、src/components/NativeRestArt.tsx：各物种资源选择、常驻预加载和原生播放。
- src/dogRest.ts：复用已验证的播放控制器；原文件名保留兼容。
- src/components/DogRestArt.tsx：旧名称兼容导出，默认仍选择小狗。
- scripts/build_rest_species.py：按物种生成原图蒙版、骨架、时间轴，需要Python、Pillow与matplotlib。
- scripts/render_rest_species.cjs：离线渲染实际JSON；默认Linux Chromium，可设置REST_CHROMIUM_PATH。
- scripts/export_rest_species_previews.py：合成MP4与联系图，需要Pillow、ffmpeg与ffprobe。
- docs/rest-species：本次类型检查、138项测试、iOS/Android Metro/Hermes资源导出与完整性校验记录。

```bash
npm ci
npm run typecheck
npm test
npx expo start --clear
```

```bash
python3 scripts/build_rest_species.py cat
node scripts/render_rest_species.cjs cat
python3 scripts/export_rest_species_previews.py cat
```

将cat替换为rabbit可重建兔版。

测试覆盖原素材字节、五层架构、三个区段、闭眼循环、98–102%呼吸、尾巴归属、各自原生组件选图、预加载、暂停恢复、全屏唤醒与夜间清醒归位；原有小狗、Clean和其他功能回归继续通过。

未构建Xcode/Gradle原生安装包，未在真机或手机模拟器测量帧率。15fps是编排规格，不能据此宣称真机达到60fps。原生依赖没有增加，仍使用现有lottie-react-native模块。
