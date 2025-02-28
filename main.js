const { app, BrowserWindow, ipcMain, WebContentsView } = require('electron');
const path = require('path');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;
// Store all views
const views = new Map();

function createWindow() {
  // Create browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: false, // Enable webview tag
    }
  });

  // Load index.html
  mainWindow.loadFile('index.html');

  // Open DevTools (optional)
  // mainWindow.webContents.openDevTools();

  // Event when window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  
  // Adjust active view size when window size changes
  mainWindow.on('resize', () => {
    updateActiveViewBounds();
  });
}

// Update active view size
function updateActiveViewBounds() {
  if (!mainWindow) return;
  
  const activeViewId = global.activeViewId;
  if (!activeViewId) return;
  
  const view = views.get(activeViewId);
  if (!view) return;
  
  const bounds = mainWindow.getBounds();
  const contentBounds = {
    x: 0,
    y: 40, // Below tab bar
    width: bounds.width,
    height: bounds.height - 40
  };
  
  view.setBounds(contentBounds);
}

// Initialize window when Electron is ready
app.whenReady().then(() => {
  createWindow();
  
  // On macOS, recreate window when dock icon is clicked and no windows are open
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit application when all windows are closed
app.on('window-all-closed', function () {
  // On macOS, applications typically stay active until user quits explicitly
  if (process.platform !== 'darwin') app.quit();
});

// Create new WebContentsView
ipcMain.handle('create-web-contents-view', async () => {
  if (!mainWindow) return null;
  
  // Create new WebContentsView
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
    }
  });
  
  // Set view bounds
  view.setBounds({
    x: 0,
    y: 40,
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height - 40
  });
  
  // Load website
  await view.webContents.loadURL(process.env.DEBUG_URL || 'https://www.electronjs.org/');
  
  // Add to main window's contentView
  mainWindow.contentView.addChildView(view);
  
  // Hide view by default
  view.setVisible(false);
  
  // Store view reference
  const viewId = view.webContents.id;
  views.set(viewId, view);
  
  return viewId;
});

// Handle multiple visibility changes in a single IPC call
ipcMain.handle('set-multiple-views-visibility', async (event, visibilityChanges) => {
  if (!mainWindow) return false;
  
  // Process each visibility change in the array
  for (const change of visibilityChanges) {
    const { id, visible } = change;
    const view = views.get(id);
    
    if (view) {
      // Set visibility
      view.setVisible(visible);
      
      // If making a view visible, set it as active
      if (visible) {
        global.activeViewId = id;
        updateActiveViewBounds();
      }
    }
  }
  
  return true;
});

// Toggle view visibility (keeping for backward compatibility)
ipcMain.handle('set-view-visible', async (event, id, visible) => {
  if (!mainWindow) return false;
  
  const view = views.get(id);
  if (!view) return false;
  
  // Directly use setVisible method to control view visibility
  view.setVisible(visible);
  
  if (visible) {
    // Set current view as active view
    global.activeViewId = id;
    
    // Update view size
    updateActiveViewBounds();
  }
  
  return true;
});

// Destroy WebContentsView
ipcMain.handle('destroy-web-contents-view', (event, id) => {
  const view = views.get(id);
  if (!view) return false;
  
  // Remove from main window contentView
  if (mainWindow && mainWindow.contentView) {
    mainWindow.contentView.removeChildView(view);
  }
  
  // Destroy view
  view.webContents.destroy();
  
  // Remove from map
  views.delete(id);
  
  // Clear active view ID if deleted view was active
  if (global.activeViewId === id) {
    global.activeViewId = null;
  }
  
  return true;
}); 