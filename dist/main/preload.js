"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const types_1 = require("../shared/types");
const api = {
    ai: {
        chat: (message, taskType) => electron_1.ipcRenderer.invoke(types_1.IPC.AI_CHAT, message, taskType),
        getSettings: () => electron_1.ipcRenderer.invoke(types_1.IPC.AI_GET_SETTINGS),
        saveSettings: (settings) => electron_1.ipcRenderer.invoke(types_1.IPC.AI_SAVE_SETTINGS, settings),
        getProfiles: () => electron_1.ipcRenderer.invoke(types_1.IPC.AI_GET_PROFILES),
        saveProfile: (profile) => electron_1.ipcRenderer.invoke(types_1.IPC.AI_SAVE_PROFILE, profile),
        deleteProfile: (id) => electron_1.ipcRenderer.invoke(types_1.IPC.AI_DELETE_PROFILE, id),
        getStats: () => electron_1.ipcRenderer.invoke(types_1.IPC.AI_GET_STATS),
    },
    voice: {
        getSettings: () => electron_1.ipcRenderer.invoke(types_1.IPC.VOICE_GET_SETTINGS),
        saveSettings: (settings) => electron_1.ipcRenderer.invoke(types_1.IPC.VOICE_SAVE_SETTINGS, settings),
        speak: (text) => electron_1.ipcRenderer.invoke(types_1.IPC.VOICE_SPEAK, text),
        stop: () => electron_1.ipcRenderer.invoke(types_1.IPC.VOICE_STOP),
    },
    system: {
        getStats: () => electron_1.ipcRenderer.invoke(types_1.IPC.SYSTEM_GET_STATS),
        launchApp: (name) => electron_1.ipcRenderer.invoke(types_1.IPC.SYSTEM_LAUNCH_APP, name),
        closeApp: (name) => electron_1.ipcRenderer.invoke(types_1.IPC.SYSTEM_CLOSE_APP, name),
        openFile: (path) => electron_1.ipcRenderer.invoke(types_1.IPC.SYSTEM_OPEN_FILE, path),
        searchFiles: (query, dir) => electron_1.ipcRenderer.invoke(types_1.IPC.SYSTEM_SEARCH_FILES, query, dir),
        execute: (command) => electron_1.ipcRenderer.invoke(types_1.IPC.SYSTEM_EXECUTE, command),
        openUrl: (url) => electron_1.ipcRenderer.invoke(types_1.IPC.SYSTEM_OPEN_URL, url),
    },
    command: {
        process: (text) => electron_1.ipcRenderer.invoke(types_1.IPC.COMMAND_PROCESS, text),
    },
    memory: {
        get: (category) => electron_1.ipcRenderer.invoke(types_1.IPC.MEMORY_GET, category),
        set: (entry) => electron_1.ipcRenderer.invoke(types_1.IPC.MEMORY_SET, entry),
        delete: (id) => electron_1.ipcRenderer.invoke(types_1.IPC.MEMORY_DELETE, id),
        search: (query) => electron_1.ipcRenderer.invoke(types_1.IPC.MEMORY_SEARCH, query),
    },
    chat: {
        getHistory: (limit) => electron_1.ipcRenderer.invoke(types_1.IPC.CHAT_GET_HISTORY, limit),
        saveMessage: (message) => electron_1.ipcRenderer.invoke(types_1.IPC.CHAT_SAVE_MESSAGE, message),
        clear: () => electron_1.ipcRenderer.invoke(types_1.IPC.CHAT_CLEAR),
    },
    workflow: {
        getAll: () => electron_1.ipcRenderer.invoke(types_1.IPC.WORKFLOW_GET_ALL),
        save: (workflow) => electron_1.ipcRenderer.invoke(types_1.IPC.WORKFLOW_SAVE, workflow),
        delete: (id) => electron_1.ipcRenderer.invoke(types_1.IPC.WORKFLOW_DELETE, id),
        run: (id) => electron_1.ipcRenderer.invoke(types_1.IPC.WORKFLOW_RUN, id),
    },
    window: {
        hide: (mode) => electron_1.ipcRenderer.invoke(types_1.IPC.WINDOW_HIDE, mode),
        show: () => electron_1.ipcRenderer.invoke(types_1.IPC.WINDOW_SHOW),
        setMode: (mode) => electron_1.ipcRenderer.invoke(types_1.IPC.WINDOW_SET_MODE, mode),
        getMode: () => electron_1.ipcRenderer.invoke(types_1.IPC.WINDOW_GET_MODE),
        minimize: () => electron_1.ipcRenderer.invoke(types_1.IPC.WINDOW_MINIMIZE),
    },
    settings: {
        get: () => electron_1.ipcRenderer.invoke(types_1.IPC.SETTINGS_GET),
        save: (settings) => electron_1.ipcRenderer.invoke(types_1.IPC.SETTINGS_SAVE, settings),
    },
    plugin: {
        getAll: () => electron_1.ipcRenderer.invoke(types_1.IPC.PLUGIN_GET_ALL),
        enable: (id) => electron_1.ipcRenderer.invoke(types_1.IPC.PLUGIN_ENABLE, id),
        disable: (id) => electron_1.ipcRenderer.invoke(types_1.IPC.PLUGIN_DISABLE, id),
    },
    notify: (payload) => electron_1.ipcRenderer.invoke(types_1.IPC.NOTIFY, payload),
    on: (channel, callback) => {
        const handler = (_, ...args) => callback(...args);
        electron_1.ipcRenderer.on(channel, handler);
        return () => electron_1.ipcRenderer.removeListener(channel, handler);
    },
};
electron_1.contextBridge.exposeInMainWorld('jarvis', api);
//# sourceMappingURL=preload.js.map