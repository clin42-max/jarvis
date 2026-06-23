"use strict";
// Shared types between main and renderer processes
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC = void 0;
// IPC Channel definitions
exports.IPC = {
    // AI
    AI_CHAT: 'ai:chat',
    AI_GET_SETTINGS: 'ai:get-settings',
    AI_SAVE_SETTINGS: 'ai:save-settings',
    AI_GET_PROFILES: 'ai:get-profiles',
    AI_SAVE_PROFILE: 'ai:save-profile',
    AI_DELETE_PROFILE: 'ai:delete-profile',
    AI_GET_STATS: 'ai:get-stats',
    // Voice
    VOICE_GET_SETTINGS: 'voice:get-settings',
    VOICE_SAVE_SETTINGS: 'voice:save-settings',
    VOICE_SPEAK: 'voice:speak',
    VOICE_STOP: 'voice:stop',
    // System
    SYSTEM_GET_STATS: 'system:get-stats',
    SYSTEM_LAUNCH_APP: 'system:launch-app',
    SYSTEM_CLOSE_APP: 'system:close-app',
    SYSTEM_OPEN_FILE: 'system:open-file',
    SYSTEM_SEARCH_FILES: 'system:search-files',
    SYSTEM_EXECUTE: 'system:execute',
    SYSTEM_OPEN_URL: 'system:open-url',
    // Commands
    COMMAND_PROCESS: 'command:process',
    // Memory
    MEMORY_GET: 'memory:get',
    MEMORY_SET: 'memory:set',
    MEMORY_DELETE: 'memory:delete',
    MEMORY_SEARCH: 'memory:search',
    // Chat history
    CHAT_GET_HISTORY: 'chat:get-history',
    CHAT_SAVE_MESSAGE: 'chat:save-message',
    CHAT_CLEAR: 'chat:clear',
    // Workflows
    WORKFLOW_GET_ALL: 'workflow:get-all',
    WORKFLOW_SAVE: 'workflow:save',
    WORKFLOW_DELETE: 'workflow:delete',
    WORKFLOW_RUN: 'workflow:run',
    // Window
    WINDOW_HIDE: 'window:hide',
    WINDOW_SHOW: 'window:show',
    WINDOW_SET_MODE: 'window:set-mode',
    WINDOW_GET_MODE: 'window:get-mode',
    WINDOW_MINIMIZE: 'window:minimize',
    // Settings
    SETTINGS_GET: 'settings:get',
    SETTINGS_SAVE: 'settings:save',
    // Plugins
    PLUGIN_GET_ALL: 'plugin:get-all',
    PLUGIN_ENABLE: 'plugin:enable',
    PLUGIN_DISABLE: 'plugin:disable',
    // Notifications
    NOTIFY: 'notify:send',
    // Events (main -> renderer)
    EVENT_SYSTEM_STATS: 'event:system-stats',
    EVENT_AI_STATUS: 'event:ai-status',
    EVENT_WAKE_WORD: 'event:wake-word',
    EVENT_COMMAND: 'event:command',
};
//# sourceMappingURL=types.js.map