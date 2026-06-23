import { app, BrowserWindow, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { getDatabase, closeDatabase } from './database/database';
import { registerIpcHandlers, startStatsBroadcast, stopStatsBroadcast } from './ipc/handlers';
import { windowManager } from './services/window-manager';
import { pluginManager } from './services/plugin-manager';
import { automationEngine } from './services/automation-engine';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

if (isDev) {
  process.env.NODE_ENV = 'development';
}

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    windowManager.show();
  });
}

app.whenReady().then(async () => {
  // Initialize database
  getDatabase();

  // Register IPC
  registerIpcHandlers();

  // Initialize services
  await pluginManager.initialize();
  automationEngine.createDefaultWorkflows();
  automationEngine.initialize();

  // Create window and tray
  windowManager.createMainWindow();
  windowManager.createTray();
  windowManager.registerHotkeys();

  // Start system stats broadcast
  startStatsBroadcast();

  // Auto updater (production only)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createMainWindow();
    } else {
      windowManager.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
  // Keep running in tray on Windows/Linux
  }
});

app.on('before-quit', () => {
  stopStatsBroadcast();
  automationEngine.shutdown();
  windowManager.cleanup();
  closeDatabase();
});

// Security: prevent navigation to external URLs in main window
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      event.preventDefault();
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});
