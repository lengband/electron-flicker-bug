# Electron 多标签页示例

这是一个使用Electron的BaseWindow和WebContentsView API实现多标签页功能的示例应用。使用了View容器和addChildView方法实现更加灵活的布局。

## 特性

- 使用BaseWindow替代传统BrowserWindow
- 使用WebContentsView实现标签页内容
- 基于addChildView的视图切换，无闪烁
- 支持创建、切换和关闭标签页

## 架构说明

应用使用了三层View架构：

1. 主容器视图 (MainContainer)：设置为BaseWindow的contentView
2. 标签栏视图 (TabView)：作为MainContainer的子视图，固定在顶部
3. 内容容器视图 (ContentContainer)：作为MainContainer的子视图，位于标签栏下方
4. 内容视图 (ContentViews)：动态添加到ContentContainer中

标签页切换时，将内容视图通过addChildView添加到内容容器中，实现了无闪烁的标签页切换效果。

## 技术实现

- 使用View和WebContentsView实现灵活布局
- 标签栏高度固定为40px
- 内容区域动态适应窗口大小
- 优化的视图管理逻辑，避免内存泄漏

## 运行方法

1. 安装依赖:
```
npm install
```

2. 启动应用:
```
npm start
```

## 主要文件

- `main.js`: 主进程代码，处理窗口和视图创建
- `index.html`: 标签栏UI
- `renderer.js`: 渲染进程代码，处理标签页逻辑 