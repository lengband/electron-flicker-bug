const { app, BaseWindow, ipcMain, WebContentsView, View } = require('electron');
const path = require('path');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;
// Store all content views
const contentViews = new Map();
// Store tab view
let tabView;
// Store content container view
let contentContainer;

function createWindow() {
  // Create base window
  mainWindow = new BaseWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: false,
    }
  });

  // 创建主容器视图，它包含两部分：标签栏视图和内容视图
  const mainContainer = new View();
  mainWindow.setContentView(mainContainer);

  // 创建标签栏视图
  tabView = new WebContentsView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // 创建内容容器视图
  contentContainer = new View();

  // 将标签栏视图和内容容器添加到主容器
  mainContainer.addChildView(tabView);
  mainContainer.addChildView(contentContainer);

  // 设置标签栏视图位置和大小
  const bounds = mainWindow.getBounds();
  tabView.setBounds({
    x: 0,
    y: 0,
    width: bounds.width,
    height: 40, // 标签栏高度
  });

  // 设置内容容器位置和大小
  contentContainer.setBounds({
    x: 0,
    y: 40, // 在标签栏下方
    width: bounds.width,
    height: bounds.height - 40,
  });

  // 加载标签栏界面
  tabView.webContents.loadFile('index.html');

  // 窗口关闭时的事件处理
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  
  // 窗口大小变化时调整视图大小
  mainWindow.on('resize', () => {
    updateViewsBounds();
  });
}

// 更新所有视图的大小
function updateViewsBounds() {
  if (!mainWindow) return;
  
  const bounds = mainWindow.getBounds();
  
  // 更新标签栏视图大小
  if (tabView) {
    tabView.setBounds({
      x: 0,
      y: 0,
      width: bounds.width,
      height: 40, // 标签栏高度
    });
  }
  
  // 更新内容容器大小
  if (contentContainer) {
    contentContainer.setBounds({
      x: 0,
      y: 40, // 在标签栏下方
      width: bounds.width,
      height: bounds.height - 40,
    });
  }
  
  // 更新当前活动内容视图大小
  const activeViewId = global.activeViewId;
  if (activeViewId) {
    const view = contentViews.get(activeViewId);
    if (view) {
      view.setBounds({
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height - 40,
      });
    }
  }
}

// 初始化应用
app.whenReady().then(() => {
  createWindow();
  
  // macOS特性：点击dock图标时重新创建窗口
  app.on('activate', function () {
    if (BaseWindow.getAllWindows().length === 0) createWindow();
  });
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  // macOS特性：应用保持活跃状态直到用户明确退出
  if (process.platform !== 'darwin') app.quit();
});

// 创建新的WebContentsView
ipcMain.handle('create-web-contents-view', async () => {
  if (!mainWindow || !contentContainer) return null;
  
  // 创建新的内容视图
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
    }
  });
  
  // 设置视图大小为内容容器大小
  view.setBounds({
    x: 0,
    y: 0,
    width: contentContainer.getBounds().width,
    height: contentContainer.getBounds().height,
  });
  
  // 加载网页内容
  await view.webContents.loadURL(process.env.DEBUG_URL || 'https://www.electronjs.org/');
  
  // 存储视图引用
  const viewId = view.webContents.id;
  contentViews.set(viewId, view);
  
  return viewId;
});

// 处理多个视图可见性变化
ipcMain.handle('set-multiple-views-visibility', async (event, visibilityChanges) => {
  if (!mainWindow || !contentContainer) return false;
  
  // 处理每个视图可见性变化
  for (const change of visibilityChanges) {
    const { id, visible } = change;
    const view = contentViews.get(id);
    
    if (view && visible) {
      // 如果视图应该可见，将其设置为内容容器的内容
      contentContainer.addChildView(view);
      
      // 标记为当前活动视图
      global.activeViewId = id;
      
      // 更新视图大小
      view.setBounds({
        x: 0,
        y: 0,
        width: contentContainer.getBounds().width,
        height: contentContainer.getBounds().height,
      });
    }
  }
  
  return true;
});

// 销毁内容视图
ipcMain.handle('destroy-web-contents-view', (event, id) => {
  const view = contentViews.get(id);
  if (!view) return false;
  
  // 从内容容器中移除视图
  if (contentContainer) {
    contentContainer.removeChildView(view);
  }
  
  // 销毁视图
  view.webContents.destroy();
  
  // 从映射中移除
  contentViews.delete(id);
  
  // 如果删除的是当前活动视图，清除活动视图ID
  if (global.activeViewId === id) {
    global.activeViewId = null;
  }
  
  return true;
}); 