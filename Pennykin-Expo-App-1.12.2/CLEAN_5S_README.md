# Pennykin Clean · 原画分层动画

版本：v1.11.6 / build 58。在 build 57 原图分层方案上，完善小猫与小兔的独立动作，导出两只宠物完整的5秒/75帧预览，并保留 Clean 启动修复。

## 原画与播放方式

使用工程中原有的宠物 PNG、闭眼 PNG 和进食表情 PNG；图片字节没有重画或替换。Lottie 原生蒙版分别裁出身体、头部、耳朵和尾巴，再通过关键帧变换组合。极限甩头时使用原图胸口毛发补齐被头部遮挡的颈部区域。猫、狗、兔子均使用各自原画。小猫使用竖耳与幅度较大的蓬松尾巴摆动；小兔按长垂耳和短尾巴分别设置较小的附加摆幅，修正头、耳、尾的蒙版边界。猫、兔颈部补齐分别取自自己的原图胸口毛发，避开项圈和吊坠。小狗 composition 内容与 build 57 一致。

这是用户确认的“原图分层”方案：角色是位图分层，水流、泡沫、水珠、闪光和奖励是矢量特效。没有动态切换独立帧图片，没有用 React state、定时器或 JS progress 驱动逐帧播放。三张表情素材常驻在同一个 composition 中，通过原生蒙版和透明度控制。

画布 1024×1024；75 帧、15fps、5.000 秒。75 帧是编排基准，不能据此宣称已经达到真机 60fps。原生播放器负责关键帧播放。

| 规范帧号 | 内容 | 时长 |
|---|---|---|
| 1–7 | 静坐、扬耳、气泡提示、前倾预备、花洒入场 | 0.467秒 |
| 8–25 | 水流、泡沫生成、原画闭眼与开心表情、污渍淡出、闪光 | 1.2秒 |
| 26–43 | 左倾5°、右倾5°、回正、头顶泡泡破裂 | 1.2秒 |
| 44–61 | 第二轮相同的18帧循环 | 1.2秒 |
| 62–70 | 下压蓄力、头部−60°和+60°极点各停留一帧间隔、水珠与余震 | 0.6秒 |
| 71–75 | 爱心与 +Clean 弹出、短暂停留并淡出 | 0.333秒 |

按此前确认，以5秒/75帧和帧号优先。原规范中“甩水1.2秒、奖励0.7秒”与总时长不一致，因此采用上表时长。表情复用原图，未另画“o”形嘴或新的毛发轮廓。

## Clean 启动修复

- 主界面提前解析本地 JSON，并隐藏常驻原生 Lottie 视图以加载 composition 和图片。
- 对有尺寸的原生视图增加 onLayout 就绪路径，不再只依赖 onAnimationLoaded；修复部分 iOS 加载时序下回调缺失导致的等待。
- 原生 ref 尚未挂载时保留待播放状态，布局或加载完成后重试启动；重复通知不会重新播放。
- 原生加载失败会取消本次 Clean 并显示错误；失败后的迟到布局不会误报就绪。
- 原生播放完成是结束本次动作的唯一来源。房间镜头和氛围用独立的原生辅助时钟，不会自行提交动作完成。
- 暂停、恢复、取消、新一轮播放、旧回调和重复结束都有保护。
- Clean 期间隐藏原房间对白；提示和奖励位于动画内部。按钮保留原生弹性点击反馈，配合场景缩放和光线过渡。
- 删除旧 Clean 专用图片序列、精灵图渲染器和此前被拒绝的简化矢量角色资源；Feed、Play 等功能继续使用各自素材。

## 源文件与预览

- assets/animation/bath-original/{dog,cat,rabbit}.json：实际接入的原画分层 Lottie。
- assets/animation/bath-effects.json：独立矢量特效模板，不含简化角色。
- scripts/build_bath_original.py：原图蒙版、分层骨架和关键帧生成程序，仅使用 Python 标准库。
- src/components/CleanArt.tsx、src/bathPlayback.ts：原生播放器与生命周期。
- docs/bath-v4/original-art-manifest.json：原素材 SHA-256 与分层信息。
- docs/bath-v4/bath-5s-75f.mp4：实际接入 JSON 经 Lottie Web 离线渲染的预览，包含提示音。
- docs/bath-v4/cat-clean-5s-75f.mp4 / rabbit-clean-5s-75f.mp4：本次新增的小猫、小兔完整预览。
- docs/bath-v4/{dog,cat,rabbit}-contact.jpg、{dog,cat,rabbit}/*.png：各物种关键帧联系图与完整75帧预览。
- docs/bath-v4/tests.txt、typecheck.txt、export-*.txt：本次验证记录。

预览脚本：node scripts/render_bath_lottie.cjs。默认使用 Linux Chromium；也可设置 BATH_CHROMIUM_PATH 指向兼容的 Chromium 可执行文件。

## 验证与运行

118 项自动化测试、TypeScript 检查通过。回归覆盖了实际 Clean JSX 的加载回调缺失、延迟 ref、重复加载、失败后迟到布局、Home 完成/失败交接、猫兔各自的实际组件选图/启动/暂停/恢复/只完成一次，以及原素材字节一致性。iOS / Android Metro/Hermes 资源导出记录随工程提供。

```bash
npm ci
npm run typecheck
npm test
npx expo start --clear
```

依赖 lottie-react-native ~7.3.8。使用自定义开发客户端时，需要重新构建含该原生模块的客户端，再运行本次工程；只更新 JS 不能给旧客户端安装原生模块。构建号已更新为58。

本次环境没有手机或 iOS / Android 原生模拟器，未完成真机安装和帧率测量。MP4 验证实际 JSON 的视觉内容和时间轴，不能替代原生设备验收。
