import { ipcMain, BrowserWindow } from 'electron';
import { IPC } from '../../shared/types';
import { aiService } from '../services/ai-service';
import { systemService } from '../services/system-service';
import { commandProcessor } from '../services/command-processor';
import { settingsService, memoryService, chatService, workflowService } from '../services/settings-service';
import { windowManager } from '../services/window-manager';
import { notificationService } from '../services/notification-service';
import { pluginManager } from '../services/plugin-manager';
import { automationEngine } from '../services/automation-engine';
import type { HideMode, TaskType, AIProfile, Workflow } from '../../shared/types';

let statsInterval: NodeJS.Timeout | null = null;

export function registerIpcHandlers(): void {
  // AI handlers
  ipcMain.handle(IPC.AI_CHAT, async (_, message: string, taskType?: TaskType) => {
    return aiService.chat(message, taskType);
  });

  ipcMain.handle(IPC.AI_GET_SETTINGS, () => settingsService.getAISettings());
  ipcMain.handle(IPC.AI_SAVE_SETTINGS, (_, settings) => settingsService.saveAISettings(settings));
  ipcMain.handle(IPC.AI_GET_STATS, () => aiService.getStats());

  ipcMain.handle(IPC.AI_GET_PROFILES, () => {
    const settings = settingsService.getAISettings();
    return settings.profiles;
  });

  ipcMain.handle(IPC.AI_SAVE_PROFILE, (_, profile: AIProfile) => {
    const settings = settingsService.getAISettings();
    const idx = settings.profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) settings.profiles[idx] = profile;
    else settings.profiles.push(profile);
    settingsService.saveAISettings({ profiles: settings.profiles });
  });

  ipcMain.handle(IPC.AI_DELETE_PROFILE, (_, id: string) => {
    const settings = settingsService.getAISettings();
    settings.profiles = settings.profiles.filter((p) => p.id !== id);
    settingsService.saveAISettings({ profiles: settings.profiles });
  });

  // Voice handlers
  ipcMain.handle(IPC.VOICE_GET_SETTINGS, () => settingsService.getVoiceSettings());
  ipcMain.handle(IPC.VOICE_SAVE_SETTINGS, (_, settings) => settingsService.saveVoiceSettings(settings));
  ipcMain.handle(IPC.VOICE_SPEAK, (_, text: string) => {
    const win = windowManager.getMainWindow();
    win?.webContents.send('voice:speak', text);
  });
  ipcMain.handle(IPC.VOICE_STOP, () => {
    const win = windowManager.getMainWindow();
    win?.webContents.send('voice:stop');
  });

  // System handlers
  ipcMain.handle(IPC.SYSTEM_GET_STATS, () => systemService.getStats());
  ipcMain.handle(IPC.SYSTEM_LAUNCH_APP, (_, name: string) => systemService.launchApp(name));
  ipcMain.handle(IPC.SYSTEM_CLOSE_APP, (_, name: string) => systemService.closeApp(name));
  ipcMain.handle(IPC.SYSTEM_OPEN_FILE, (_, filePath: string) => systemService.openFile(filePath));
  ipcMain.handle(IPC.SYSTEM_SEARCH_FILES, (_, query: string, dir?: string) => systemService.searchFiles(query, dir));
  ipcMain.handle(IPC.SYSTEM_EXECUTE, (_, command: string) => systemService.execute(command));
  ipcMain.handle(IPC.SYSTEM_OPEN_URL, (_, url: string) => systemService.openUrl(url));

  // Command handler
  ipcMain.handle(IPC.COMMAND_PROCESS, async (_, text: string) => {
    const result = await commandProcessor.process(text);

    if (result.action === 'hide' && result.data) {
      windowManager.hide((result.data as { mode: HideMode }).mode);
    } else if (result.action === 'show') {
      windowManager.show();
    }

    return result;
  });

  // Memory handlers
  ipcMain.handle(IPC.MEMORY_GET, (_, category?: string) => memoryService.getAll(category));
  ipcMain.handle(IPC.MEMORY_SET, (_, entry) => memoryService.set(entry));
  ipcMain.handle(IPC.MEMORY_DELETE, (_, id: string) => memoryService.delete(id));
  ipcMain.handle(IPC.MEMORY_SEARCH, (_, query: string) => memoryService.search(query));

  // Chat handlers
  ipcMain.handle(IPC.CHAT_GET_HISTORY, (_, limit?: number) => chatService.getHistory(limit));
  ipcMain.handle(IPC.CHAT_SAVE_MESSAGE, (_, message) => chatService.saveMessage(message));
  ipcMain.handle(IPC.CHAT_CLEAR, () => chatService.clear());

  // Workflow handlers
  ipcMain.handle(IPC.WORKFLOW_GET_ALL, () => workflowService.getAll());
  ipcMain.handle(IPC.WORKFLOW_SAVE, (_, workflow: Workflow) => workflowService.save(workflow));
  ipcMain.handle(IPC.WORKFLOW_DELETE, (_, id: string) => workflowService.delete(id));
  ipcMain.handle(IPC.WORKFLOW_RUN, (_, id: string) => automationEngine.runById(id));

  // Window handlers
  ipcMain.handle(IPC.WINDOW_HIDE, (_, mode?: HideMode) => windowManager.hide(mode ?? 'quick'));
  ipcMain.handle(IPC.WINDOW_SHOW, () => windowManager.show());
  ipcMain.handle(IPC.WINDOW_SET_MODE, (_, mode: HideMode) => windowManager.setMode(mode));
  ipcMain.handle(IPC.WINDOW_GET_MODE, () => windowManager.getMode());
  ipcMain.handle(IPC.WINDOW_MINIMIZE, () => windowManager.minimize());

  // Settings handlers
  ipcMain.handle(IPC.SETTINGS_GET, () => settingsService.getAppSettings());
  ipcMain.handle(IPC.SETTINGS_SAVE, (_, settings) => settingsService.saveAppSettings(settings));

  // Plugin handlers
  ipcMain.handle(IPC.PLUGIN_GET_ALL, () => pluginManager.getAll());
  ipcMain.handle(IPC.PLUGIN_ENABLE, (_, id: string) => pluginManager.enable(id));
  ipcMain.handle(IPC.PLUGIN_DISABLE, (_, id: string) => pluginManager.disable(id));

  // Notification handler
  ipcMain.handle(IPC.NOTIFY, (_, payload) => notificationService.send(payload));

  // Window drag for frameless window
  ipcMain.on('window:drag', () => {
    // Handled via -webkit-app-region: drag in CSS
  });

  ipcMain.on('window:close', () => {
    windowManager.hide('quick');
  });
}

export function startStatsBroadcast(): void {
  statsInterval = setInterval(async () => {
    const stats = await systemService.getStats();
    const aiStats = aiService.getStats();
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send(IPC.EVENT_SYSTEM_STATS, stats);
      win.webContents.send(IPC.EVENT_AI_STATUS, aiStats);
    }
  }, 3000);
}

export function stopStatsBroadcast(): void {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
}
