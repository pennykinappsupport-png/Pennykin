# Pennykin 小狗 Rest · 原图分层版

v1.11.6 / build 59。本次只制作和接入小狗新版 Rest，供用户先验收；猫、兔沿用之前的 Rest，三只宠物的 Clean 内容保持 build 58 版本。

## 时间轴

1024×1024 画布，15fps 编排。使用同一份原生 Lottie composition 播放三个区段。

| 状态 | 原生区段（从0计帧） | 时长与行为 |
|---|---|---|
| Rest_Enter | [0,15) | 15帧 / 1.0秒。困倦闭眼、张嘴哈欠、身体压缩下沉、切入趴睡原画、Zzz与RESTING出现。 |
| rest_loop / Rest_Loop | [15,45) | 每轮30帧 / 2.0秒，循环至唤醒或30秒上限。躯干以底部为锚点由102%压至98%再回到102%；头部保持闭眼趴睡，耳朵上下微动1.5源像素，Zzz和梦境泡泡循环飘浮。 |
| Rest_Exit | [45,57) | 12帧 / 0.8秒。蓄力、扬耳、睁眼、拉伸、爱心反馈、恢复清醒坐姿并清除Rest层。 |

入睡和唤醒阶段由原生动画完成事件推进，提前/重复/过期的回调不会结束动作。只有30秒休息上限和旧交互手势窗口使用阶段级定时器；没有 JS 定时器切图片或逐帧 setState。

## 原画与图层

原样嵌入项目的 dog.png、dog-blink.png、dog-eat.png、dog-rest.png 和 cozy_cushion.png。原文件字节未重画、替换或修改；分层由原生蒙版完成。UI文字为矢量轮廓，不依赖运行时字体。五个独立根图层从下往上分别为：

1. bg_layer：原宠物床、安静氛围光晕和地面阴影；房间另有原生渐暗遮罩。
2. pet_body_layer：坐姿/趴姿躯干、尾巴、前爪，包含下沉、呼吸和伸展。
3. pet_face_layer：原画头部、闭眼/哈欠差分和独立耳朵。
4. fx_zzz_layer：三组交错Zzz和轻微梦境气泡。
5. ui_prompt_layer：顶部提示、RESTING状态条、点击唤醒说明和爱心。

Lottie null父图层不继承透明度，生成程序已将组透明度计算到实际可绘制子图层，避免双头、睁眼坐姿与趴姿叠加。睡眠区段中，所有清醒头部与躯干的实际透明度恒为零。小狗旧的闲置晃动、呼吸、表情补丁和旧Rest渲染器在新版Rest期间关闭。

坐姿与趴姿使用原有两套原画，通过头部位移、缩放、身体压缩和短暂原生透明度过渡衔接。哈欠复用原图张嘴表情，并未重新绘制圆形嘴或新角色；这是原画分层版本的实现范围。

## 唤醒与恢复

按需求最后的交互条款，小狗睡眠循环期间点击屏幕任意位置即可唤醒；在小狗上双击也会在第一次点击时启动唤醒，无需等待第二次点击。透明原生全屏点击层覆盖整个休息界面，防止同一次点击意外触发底下的Feed或导航。Android返回键也进入唤醒。

- 入睡、唤醒阶段不接受重复触发。
- 手动唤醒时触发一次Light震动，并播放已有的轻柔唤醒音；尊重设备静音设置。
- 到达30秒上限自动唤醒，不依赖用户点击。
- 后台暂停当前原生播放段；恢复时继续原位置，30秒上限计时也保留剩余时间。
- 已排队的照料动作等待完整唤醒段结束后开始。
- 完成后回到清醒待机，即使处于夜间也不会立刻重新进入睡眠。
- 原生资源加载失败会取消该次Rest并显示错误，不会一直停在忙碌状态。

## 预览

- docs/rest-dog/dog-rest-preview.mp4：7.8秒短预览，展示1秒入睡、三轮共6秒呼吸、手动唤醒的0.8秒；附轻柔唤醒提示音。
- docs/rest-dog/dog-rest-30s.mp4：31.8秒完整时序，展示1秒入睡、30秒睡眠、0.8秒自动唤醒。
- docs/rest-dog/dog-rest-contact.jpg：阶段关键画面。
- docs/rest-dog/frames：实际接入JSON离线渲染的57个编排帧；视频复用原生循环区段的30帧。

MP4是实际打包JSON经Lottie Web渲染的视觉预览，不能接收点击或模拟震动；这些交互已接入App。

## 源码与验证

- assets/animation/rest-dog/dog.json：唯一的小狗Rest composition。
- scripts/build_rest_dog.py：原图分层、蒙版、关键帧与文字轮廓生成，需要Python、Pillow、matplotlib。
- scripts/render_rest_dog.cjs：渲染实际JSON，需要npm开发依赖；默认使用Linux Chromium，也可设置REST_CHROMIUM_PATH。
- scripts/export_rest_previews.py：合成两个MP4与联系图，需要Python、Pillow及ffmpeg/ffprobe。
- src/dogRest.ts、src/components/DogRestArt.tsx：原生分段播放器、预加载、暂停恢复和过期回调保护。
- src/petAnimationMachine.ts、src/usePetAnimationMachine.ts：沿用全局唯一FSM，小狗新增原生完成事件；猫兔保持原计时流程。
- docs/rest-dog/original-art-manifest.json：原素材SHA-256。
- docs/rest-dog/tests.txt、typecheck.txt、export-*.txt、export-integrity.txt：验证记录。

130项测试与TypeScript检查通过，覆盖原图字节、闭眼专用循环、98–102%呼吸、原生完成、暂停恢复、重复/过期回调、任意位置唤醒、夜间清醒归位和轻震去重。iOS/Android Metro/Hermes资源导出及资源完整性校验记录随工程提供。

```bash
npm ci
npm run typecheck
npm test
npx expo start --clear
```

没有进行Xcode/Gradle原生安装包构建或真机/手机模拟器测试，未测量真机帧率。15fps是关键帧编排规格，不能由此宣称达到真机60fps。此前加入的lottie-react-native依赖保持不变；使用旧的、不含该原生模块的开发客户端时仍需重新构建客户端。
