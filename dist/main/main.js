"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const database_1 = require("./database/database");
const handlers_1 = require("./ipc/handlers");
const window_manager_1 = require("./services/window-manager");
const plugin_manager_1 = require("./services/plugin-manager");
const automation_engine_1 = require("./services/automation-engine");
const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
if (isDev) {
    process.env.NODE_ENV = 'development';
}
// Single instance lock
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        window_manager_1.windowManager.show();
    });
}
electron_1.app.whenReady().then(async () => {
    // Initialize database
    (0, database_1.getDatabase)();
    // Register IPC
    (0, handlers_1.registerIpcHandlers)();
    // Initialize services
    await plugin_manager_1.pluginManager.initialize();
    automation_engine_1.automationEngine.createDefaultWorkflows();
    automation_engine_1.automationEngine.initialize();
    // Create window and tray
    window_manager_1.windowManager.createMainWindow();
    window_manager_1.windowManager.createTray();
    window_manager_1.windowManager.registerHotkeys();
    // Start system stats broadcast
    (0, handlers_1.startStatsBroadcast)();
    // Auto updater (production only)
    if (!isDev) {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify().catch(() => { });
    }
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            window_manager_1.windowManager.createMainWindow();
        }
        else {
            window_manager_1.windowManager.show();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Keep running in tray on Windows/Linux
    }
});
electron_1.app.on('before-quit', () => {
    (0, handlers_1.stopStatsBroadcast)();
    automation_engine_1.automationEngine.shutdown();
    window_manager_1.windowManager.cleanup();
    (0, database_1.closeDatabase)();
});
// Security: prevent navigation to external URLs in main window
electron_1.app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, url) => {
        if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
            event.preventDefault();
        }
    });
    contents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
});
//# sourceMappingURL=main.js.map