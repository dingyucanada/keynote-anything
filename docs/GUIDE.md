# 使用说明 / User guide

## 1. 写一个简报

在「今天，发布什么？」输入主题，最多 60 字。产品名可留空。五个示例按钮只填入主题，点击「导演，开拍」后才生成新故事。

展开「补充卖点、听众与产品图」：
- 一句话描述：产品解决什么问题。
- 听众：用于讲者备注；AI 模式也会用于叙事定位。
- 卖点/事实：每行一项，使用前三项。只填有依据的信息。
- 产品图：PNG、JPEG 或 WebP，小于 12 MB、40 百万像素。图片在浏览器中压缩，最大边 1600 像素，不发送给 AI。

本地模式采用模板，不会调研事实，也不会给所有任意主题写出独特架构。它适合快速起稿。AI 模式需要先配置服务，详见 [AI.md](AI.md)。

## 2. 导演你的故事

舞台下方的故事线可以切换场景。「编辑本幕」可修改标题、辅助文案、讲者备注和播放时长；架构及价值幕可以编辑三个要点。

换行决定讲述节奏。建议主标题不超过两到三行，避免把完整报告放进一幕。长文本会尝试缩小字号；仍然需要检查预览。

- 「前移 / 后移」调整故事顺序。
- 「复制 / 删除」调整幕数，范围为 3–12 幕。
- 「撤销 / 重做」恢复最近的操作，刷新后历史栈清空。
- 「换个开场」替换本地模板开场，保留其余场景。仅改变当前开场，不会自动同步你的手写备注。
- 切换舞台主题立即生效；语气和内容语言在下一次生成时应用。
- 右上角 EN/中文仅切换界面，不翻译已有内容。

## 3. 上台

点击「上台」从当前预览幕开始。

| 按键 | 效果 |
|---|---|
| ← / → | 上一幕 / 下一幕 |
| 空格 | 播放界面中进入下一幕 |
| Home / End | 第一幕 / 最后一幕 |
| Escape | 退出播放或关闭弹窗 |
| Ctrl/Cmd + Z | 工作台撤销；输入框中保留原生文本撤销 |
| Ctrl/Cmd + Shift + Z | 工作台重做 |

自动播放遵循每幕 4–25 秒的时长；到末幕后停止。从末幕点击自动播放会从头开始。切换到其他标签页会暂停，避免回来时错过内容。浏览器不支持全屏时，仍可使用窗口内播放。

## 4. 带走你的作品

- **独立 HTML**：一个文件，内嵌图片和样式。双击可离线播放，也可上传到自己的静态网站。备注也在文件中，分享前请检查。
- **海报 PNG**：1080 × 1350 竖版，采用第一幕标题、产品名、图片或抽象视觉。
- **项目 JSON**：用于继续编辑。通过「我的项目 → 导入项目 JSON」恢复；包括自定义图片和备注。
- **讲稿 Markdown**：完整故事、要点和讲者备注，可交给同事或用于排练。
- **PDF**：在导出的 HTML 中点 PDF，选择浏览器「另存为 PDF」。使用背景图形、关闭页眉页脚。不是独立 PDF 渲染器，不同浏览器可能有差异。

## 保存与隐私

当前项目保存在此浏览器、此网址的 localStorage。私密模式、清理浏览器数据、换域名或换设备会影响恢复。每次生成新项目前最多保留四份快照；容量不足时会提示导出备份。已上传图片可能较大，请及时保存 JSON。

默认没有账号、遥测、广告或云端存储。只有选中 AI 导演并点击生成，简报才会发送到你配置的模型提供商。静态托管商可能按其自身政策记录普通访问日志。

## English quick guide

Enter a subject, optionally add a product name, description, audience, supported facts and an image. Select a voice and generate. Theme changes apply immediately; voice and story-language changes apply on the next generation. The interface-language button does not translate an existing story.

Edit any scene, reorder or duplicate it, then present. Arrow keys navigate; Space advances; Home/End jump; Escape exits. Autoplay uses each scene’s duration and pauses when the tab becomes hidden. Export HTML to play offline, JSON to resume editing, Markdown for rehearsal, or a PNG poster to share. JSON and HTML include your notes and custom image; review before sharing.
