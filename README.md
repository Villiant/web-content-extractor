# 网页主内容抓取插件

这是一个Chrome浏览器插件，用于抓取网页的主要内容并保存为文本文件。

## 功能特点

1. 点击插件图标后在弹出窗口中展示配置项
2. 可以设置本地文件夹路径并允许更改
3. 提供抓取按钮，点击后将当前网页的主要内容保存为txt文件
4. 支持快捷键操作，方便快速抓取
5. 详细的错误处理和提示，帮助用户解决问题
6. 增强模式功能，用于处理有反抓取措施的网站

## 技术栈

- HTML/CSS/JavaScript
- Chrome Extension API
- Chrome Storage API (用于保存配置)
- Chrome Downloads API (用于保存文件)

## 安装方法

1. 下载或克隆本仓库到本地
2. 在Chrome浏览器中打开 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本仓库的文件夹
6. 确保在images文件夹中添加了必要的图标文件（详见images/README.txt）

## 使用方法

1. 点击Chrome工具栏中的插件图标
2. 在弹出的窗口中设置保存文件的目标文件夹名称
   - 使用简单的名称，如：`downloads`、`articles`或`web_content`
   - **注意**：由于Chrome安全限制，文件实际会保存到浏览器的默认下载文件夹中
3. 如果网站有反抓取措施，可以勾选"启用增强模式"选项
4. 浏览到需要抓取内容的网页
5. 点击"抓取内容"按钮或使用快捷键（Ctrl+Shift+S / Command+Shift+S）进行内容抓取
6. 文件将被保存到浏览器的默认下载文件夹中，文件名为网页标题

## 注意事项

- 由于Chrome浏览器的安全限制，插件无法直接写入指定文件夹，而是通过Chrome的下载功能保存文件
- 文件名会自动从网页标题生成，并移除不合法的字符
- 内容抓取功能会尝试智能识别网页的主要内容，但对于结构复杂的网页可能效果不佳
- **重要**：Chrome扩展只能保存到浏览器的默认下载文件夹，无法保存到任意指定位置
- 您设置的"保存路径"实际上是在下载文件夹中创建的子文件夹名称
- 增强模式会使用更多技术手段提取内容，但可能需要更长的处理时间

## 常见问题解决

### 保存失败问题

如果遇到保存失败，插件会显示详细的错误原因，常见问题包括：

1. **Invalid filename错误**：
   - 请使用简单的文件夹名称，如：`downloads`、`articles`
   - 不要使用完整路径（如`C:/folder`或`/Users/name/folder`）
   - 避免使用特殊字符，只使用字母、数字、下划线、连字符和点

2. **权限问题**：
   - Chrome扩展只能保存到浏览器的默认下载文件夹
   - 无法保存到系统的其他位置（如桌面、文档等）

3. **特殊页面**：
   - 无法在Chrome内部页面（如chrome://设置）上使用此插件

4. **URL.createObjectURL错误**：
   - 如果遇到"URL.createObjectURL is not a function"错误，请重新安装插件

### 通信错误问题

如果遇到"与后台通信失败：The message port closed before a response was received"错误：

1. **重新安装插件**：卸载后重新加载插件
2. **刷新页面**：在使用插件前刷新当前网页
3. **避免快速操作**：等待上一个操作完成后再执行下一个操作
4. **检查浏览器版本**：确保使用最新版本的Chrome浏览器

### 内容抓取问题

如果抓取的内容不符合预期：

1. 某些网站使用特殊的页面结构，可能导致内容识别不准确
2. 动态加载的内容可能无法完全抓取
3. 确保页面已完全加载后再进行抓取
4. **对于有反抓取措施的网站**：
   - 启用增强模式，该模式会模拟用户行为并等待动态内容加载
   - 增强模式会自动滚动页面以触发懒加载内容
   - 使用更复杂的内容提取算法，提高抓取成功率

## 增强模式说明

增强模式专为处理有反抓取措施的网站而设计，具有以下特点：

1. **模拟用户行为**：生成随机鼠标移动事件，欺骗网站的机器人检测
2. **自动滚动页面**：分段滚动整个页面，触发懒加载内容的加载
3. **延迟处理**：等待动态内容完全加载
4. **多重提取算法**：使用多种选择器和评分机制，找出最可能的主要内容
5. **文本清理**：移除特殊字符、多余空格和隐藏字符

何时使用增强模式：
- 当标准模式无法正确提取内容时
- 网站内容是动态加载的
- 网站有明显的反爬虫措施
- 抓取结果不完整或为空

## 开发进度

- [x] 项目初始化
- [x] 基本插件结构搭建
- [x] 实现内容抓取功能
- [x] 实现文件保存功能
- [x] 实现配置保存功能
- [x] 添加快捷键支持
- [x] 优化用户界面
- [x] 增强错误处理和提示
- [x] 修复通信问题
- [x] 修复Service Worker兼容性问题
- [x] 解决文件路径限制问题
- [x] 添加增强模式，处理反抓取网站

## 未来计划

- [ ] 添加更多内容提取算法，提高准确率
- [ ] 支持更多文件格式（如HTML、Markdown等）
- [ ] 添加内容预览功能
- [ ] 支持批量抓取多个页面
- [ ] 添加自定义文件名选项 