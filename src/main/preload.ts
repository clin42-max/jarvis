import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/types';
import type { JarvisAPI } from '../shared/types';

const api: JarvisAPI = {
  ai: {
    chat: (message, taskType) => ipcRenderer.invoke(IPC.AI_CHAT, message, taskType),
    getSettings: () => ipcRenderer.invoke(IPC.AI_GET_SETTINGS),
    saveSettings: (settings) => ipcRenderer.invoke(IPC.AI_SAVE_SETTINGS, settings),
    getProfiles: () => ipcRenderer.invoke(IPC.AI_GET_PROFILES),
    saveProfile: (profile) => ipcRenderer.invoke(IPC.AI_SAVE_PROFILE, profile),
    deleteProfile: (id) => ipcRenderer.invoke(IPC.AI_DELETE_PROFILE, id),
    getStats: () => ipcRenderer.invoke(IPC.AI_GET_STATS),
  },
  voice: {
    getSettings: () => ipcRenderer.invoke(IPC.VOICE_GET_SETTINGS),
    saveSettings: (settings) => ipcRenderer.invoke(IPC.VOICE_SAVE_SETTINGS, settings),
    speak: (text) => ipcRenderer.invoke(IPC.VOICE_SPEAK, text),
    stop: () => ipcRenderer.invoke(IPC.VOICE_STOP),
  },
  system: {
    getStats: () => ipcRenderer.invoke(IPC.SYSTEM_GET_STATS),
    launchApp: (name) => ipcRenderer.invoke(IPC.SYSTEM_LAUNCH_APP, name),
    closeApp: (name) => ipcRenderer.invoke(IPC.SYSTEM_CLOSE_APP, name),
    openFile: (path) => ipcRenderer.invoke(IPC.SYSTEM_OPEN_FILE, path),
    searchFiles: (query, dir) => ipcRenderer.invoke(IPC.SYSTEM_SEARCH_FILES, query, dir),
    execute: (command) => ipcRenderer.invoke(IPC.SYSTEM_EXECUTE, command),
    openUrl: (url) => ipcRenderer.invoke(IPC.SYSTEM_OPEN_URL, url),
  },
  command: {
    process: (text) => ipcRenderer.invoke(IPC.COMMAND_PROCESS, text),
  },
  memory: {
    get: (category) => ipcRenderer.invoke(IPC.MEMORY_GET, category),
    set: (entry) => ipcRenderer.invoke(IPC.MEMORY_SET, entry),
    delete: (id) => ipcRenderer.invoke(IPC.MEMORY_DELETE, id),
    search: (query) => ipcRenderer.invoke(IPC.MEMORY_SEARCH, query),
  },
  chat: {
    getHistory: (limit) => ipcRenderer.invoke(IPC.CHAT_GET_HISTORY, limit),
    saveMessage: (message) => ipcRenderer.invoke(IPC.CHAT_SAVE_MESSAGE, message),
    clear: () => ipcRenderer.invoke(IPC.CHAT_CLEAR),
  },
  workflow: {
    getAll: () => ipcRenderer.invoke(IPC.WORKFLOW_GET_ALL),
    save: (workflow) => ipcRenderer.invoke(IPC.WORKFLOW_SAVE, workflow),
    delete: (id) => ipcRenderer.invoke(IPC.WORKFLOW_DELETE, id),
    run: (id) => ipcRenderer.invoke(IPC.WORKFLOW_RUN, id),
  },
  window: {
    hide: (mode) => ipcRenderer.invoke(IPC.WINDOW_HIDE, mode),
    show: () => ipcRenderer.invoke(IPC.WINDOW_SHOW),
    setMode: (mode) => ipcRenderer.invoke(IPC.WINDOW_SET_MODE, mode),
    getMode: () => ipcRenderer.invoke(IPC.WINDOW_GET_MODE),
    minimize: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
    save: (settings) => ipcRenderer.invoke(IPC.SETTINGS_SAVE, settings),
  },
  plugin: {
    getAll: () => ipcRenderer.invoke(IPC.PLUGIN_GET_ALL),
    enable: (id) => ipcRenderer.invoke(IPC.PLUGIN_ENABLE, id),
    disable: (id) => ipcRenderer.invoke(IPC.PLUGIN_DISABLE, id),
  },
  notify: (payload) => ipcRenderer.invoke(IPC.NOTIFY, payload),
  on: (channel, callback) => {
    const handler = (_: unknown, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
};

contextBridge.exposeInMainWorld('jarvis', api);
