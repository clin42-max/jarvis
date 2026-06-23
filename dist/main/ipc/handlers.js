"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
exports.startStatsBroadcast = startStatsBroadcast;
exports.stopStatsBroadcast = stopStatsBroadcast;
const electron_1 = require("electron");
const types_1 = require("../../shared/types");
const ai_service_1 = require("../services/ai-service");
const system_service_1 = require("../services/system-service");
const command_processor_1 = require("../services/command-processor");
const settings_service_1 = require("../services/settings-service");
const window_manager_1 = require("../services/window-manager");
const notification_service_1 = require("../services/notification-service");
const plugin_manager_1 = require("../services/plugin-manager");
const automation_engine_1 = require("../services/automation-engine");
let statsInterval = null;
function registerIpcHandlers() {
    // AI handlers
    electron_1.ipcMain.handle(types_1.IPC.AI_CHAT, async (_, message, taskType) => {
        return ai_service_1.aiService.chat(message, taskType);
    });
    electron_1.ipcMain.handle(types_1.IPC.AI_GET_SETTINGS, () => settings_service_1.settingsService.getAISettings());
    electron_1.ipcMain.handle(types_1.IPC.AI_SAVE_SETTINGS, (_, settings) => settings_service_1.settingsService.saveAISettings(settings));
    electron_1.ipcMain.handle(types_1.IPC.AI_GET_STATS, () => ai_service_1.aiService.getStats());
    electron_1.ipcMain.handle(types_1.IPC.AI_GET_PROFILES, () => {
        const settings = settings_service_1.settingsService.getAISettings();
        return settings.profiles;
    });
    electron_1.ipcMain.handle(types_1.IPC.AI_SAVE_PROFILE, (_, profile) => {
        const settings = settings_service_1.settingsService.getAISettings();
        const idx = settings.profiles.findIndex((p) => p.id === profile.id);
        if (idx >= 0)
            settings.profiles[idx] = profile;
        else
            settings.profiles.push(profile);
        settings_service_1.settingsService.saveAISettings({ profiles: settings.profiles });
    });
    electron_1.ipcMain.handle(types_1.IPC.AI_DELETE_PROFILE, (_, id) => {
        const settings = settings_service_1.settingsService.getAISettings();
        settings.profiles = settings.profiles.filter((p) => p.id !== id);
        settings_service_1.settingsService.saveAISettings({ profiles: settings.profiles });
    });
    // Voice handlers
    electron_1.ipcMain.handle(types_1.IPC.VOICE_GET_SETTINGS, () => settings_service_1.settingsService.getVoiceSettings());
    electron_1.ipcMain.handle(types_1.IPC.VOICE_SAVE_SETTINGS, (_, settings) => settings_service_1.settingsService.saveVoiceSettings(settings));
    electron_1.ipcMain.handle(types_1.IPC.VOICE_SPEAK, (_, text) => {
        const win = window_manager_1.windowManager.getMainWindow();
        win?.webContents.send('voice:speak', text);
    });
    electron_1.ipcMain.handle(types_1.IPC.VOICE_STOP, () => {
        const win = window_manager_1.windowManager.getMainWindow();
        win?.webContents.send('voice:stop');
    });
    // System handlers
    electron_1.ipcMain.handle(types_1.IPC.SYSTEM_GET_STATS, () => system_service_1.systemService.getStats());
    electron_1.ipcMain.handle(types_1.IPC.SYSTEM_LAUNCH_APP, (_, name) => system_service_1.systemService.launchApp(name));
    electron_1.ipcMain.handle(types_1.IPC.SYSTEM_CLOSE_APP, (_, name) => system_service_1.systemService.closeApp(name));
    electron_1.ipcMain.handle(types_1.IPC.SYSTEM_OPEN_FILE, (_, filePath) => system_service_1.systemService.openFile(filePath));
    electron_1.ipcMain.handle(types_1.IPC.SYSTEM_SEARCH_FILES, (_, query, dir) => system_service_1.systemService.searchFiles(query, dir));
    electron_1.ipcMain.handle(types_1.IPC.SYSTEM_EXECUTE, (_, command) => system_service_1.systemService.execute(command));
    electron_1.ipcMain.handle(types_1.IPC.SYSTEM_OPEN_URL, (_, url) => system_service_1.systemService.openUrl(url));
    // Command handler
    electron_1.ipcMain.handle(types_1.IPC.COMMAND_PROCESS, async (_, text) => {
        const result = await command_processor_1.commandProcessor.process(text);
        if (result.action === 'hide' && result.data) {
            window_manager_1.windowManager.hide(result.data.mode);
        }
        else if (result.action === 'show') {
            window_manager_1.windowManager.show();
        }
        return result;
    });
    // Memory handlers
    electron_1.ipcMain.handle(types_1.IPC.MEMORY_GET, (_, category) => settings_service_1.memoryService.getAll(category));
    electron_1.ipcMain.handle(types_1.IPC.MEMORY_SET, (_, entry) => settings_service_1.memoryService.set(entry));
    electron_1.ipcMain.handle(types_1.IPC.MEMORY_DELETE, (_, id) => settings_service_1.memoryService.delete(id));
    electron_1.ipcMain.handle(types_1.IPC.MEMORY_SEARCH, (_, query) => settings_service_1.memoryService.search(query));
    // Chat handlers
    electron_1.ipcMain.handle(types_1.IPC.CHAT_GET_HISTORY, (_, limit) => settings_service_1.chatService.getHistory(limit));
    electron_1.ipcMain.handle(types_1.IPC.CHAT_SAVE_MESSAGE, (_, message) => settings_service_1.chatService.saveMessage(message));
    electron_1.ipcMain.handle(types_1.IPC.CHAT_CLEAR, () => settings_service_1.chatService.clear());
    // Workflow handlers
    electron_1.ipcMain.handle(types_1.IPC.WORKFLOW_GET_ALL, () => settings_service_1.workflowService.getAll());
    electron_1.ipcMain.handle(types_1.IPC.WORKFLOW_SAVE, (_, workflow) => settings_service_1.workflowService.save(workflow));
    electron_1.ipcMain.handle(types_1.IPC.WORKFLOW_DELETE, (_, id) => settings_service_1.workflowService.delete(id));
    electron_1.ipcMain.handle(types_1.IPC.WORKFLOW_RUN, (_, id) => automation_engine_1.automationEngine.runById(id));
    // Window handlers
    electron_1.ipcMain.handle(types_1.IPC.WINDOW_HIDE, (_, mode) => window_manager_1.windowManager.hide(mode ?? 'quick'));
    electron_1.ipcMain.handle(types_1.IPC.WINDOW_SHOW, () => window_manager_1.windowManager.show());
    electron_1.ipcMain.handle(types_1.IPC.WINDOW_SET_MODE, (_, mode) => window_manager_1.windowManager.setMode(mode));
    electron_1.ipcMain.handle(types_1.IPC.WINDOW_GET_MODE, () => window_manager_1.windowManager.getMode());
    electron_1.ipcMain.handle(types_1.IPC.WINDOW_MINIMIZE, () => window_manager_1.windowManager.minimize());
    // Settings handlers
    electron_1.ipcMain.handle(types_1.IPC.SETTINGS_GET, () => settings_service_1.settingsService.getAppSettings());
    electron_1.ipcMain.handle(types_1.IPC.SETTINGS_SAVE, (_, settings) => settings_service_1.settingsService.saveAppSettings(settings));
    // Plugin handlers
    electron_1.ipcMain.handle(types_1.IPC.PLUGIN_GET_ALL, () => plugin_manager_1.pluginManager.getAll());
    electron_1.ipcMain.handle(types_1.IPC.PLUGIN_ENABLE, (_, id) => plugin_manager_1.pluginManager.enable(id));
    electron_1.ipcMain.handle(types_1.IPC.PLUGIN_DISABLE, (_, id) => plugin_manager_1.pluginManager.disable(id));
    // Notification handler
    electron_1.ipcMain.handle(types_1.IPC.NOTIFY, (_, payload) => notification_service_1.notificationService.send(payload));
    // Window drag for frameless window
    electron_1.ipcMain.on('window:drag', () => {
        // Handled via -webkit-app-region: drag in CSS
    });
    electron_1.ipcMain.on('window:close', () => {
        window_manager_1.windowManager.hide('quick');
    });
}
function startStatsBroadcast() {
    statsInterval = setInterval(async () => {
        const stats = await system_service_1.systemService.getStats();
        const aiStats = ai_service_1.aiService.getStats();
        const windows = electron_1.BrowserWindow.getAllWindows();
        for (const win of windows) {
            win.webContents.send(types_1.IPC.EVENT_SYSTEM_STATS, stats);
            win.webContents.send(types_1.IPC.EVENT_AI_STATUS, aiStats);
        }
    }, 3000);
}
function stopStatsBroadcast() {
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }
}
//# sourceMappingURL=handlers.js.map