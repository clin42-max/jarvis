// Shared types between main and renderer processes

export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'grok'
  | 'deepseek'
  | 'perplexity'
  | 'mistral'
  | 'ollama'
  | 'lmstudio'
  | 'custom';

export type TaskType =
  | 'general'
  | 'reasoning'
  | 'coding'
  | 'research'
  | 'automation'
  | 'creative';

export type HideMode = 'none' | 'quick' | 'stealth' | 'orb' | 'widget';

export type VoiceMode = 'continuous' | 'push-to-talk' | 'wake-word';

export interface AIProfile {
  id: string;
  name: string;
  provider: AIProvider;
  model: string;
  personality: string;
  customInstructions: string;
  taskTypes: TaskType[];
  isDefault: boolean;
  createdAt: string;
}

export interface AISettings {
  activeProvider: AIProvider;
  activeModel: string;
  apiKeys: Partial<Record<AIProvider, string>>;
  customApiUrl?: string;
  profiles: AIProfile[];
  taskModelMap: Partial<Record<TaskType, string>>;
  temperature: number;
  maxTokens: number;
}

export interface VoiceSettings {
  enabled: boolean;
  mode: VoiceMode;
  wakeWords: string[];
  recognitionEngine: 'browser' | 'whisper' | 'whisper-local' | 'azure' | 'google';
  synthesisEngine: 'browser' | 'openai' | 'elevenlabs' | 'azure';
  voiceName?: string;
  voiceRate: number;
  voicePitch: number;
  noiseReduction: boolean;
  pushToTalkKey?: string;
}

export interface AppSettings {
  theme: 'jarvis' | 'dark' | 'light' | 'cyberpunk' | 'holographic' | 'custom';
  hideMode: HideMode;
  startupWithSystem: boolean;
  minimizeToTray: boolean;
  hotkeys: {
    showHide: string;
    pushToTalk: string;
  };
  notifications: {
    desktop: boolean;
    voice: boolean;
    priority: boolean;
  };
  privacy: {
  encryptKeys: boolean;
    confirmDestructive: boolean;
  };
}

export interface MemoryEntry {
  id: string;
  category: 'preference' | 'app' | 'command' | 'voice' | 'routine' | 'workflow' | 'fact';
  key: string;
  value: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: AIProvider;
  model?: string;
  timestamp: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  enabled: boolean;
  createdAt: string;
}

export interface WorkflowTrigger {
  type: 'startup' | 'schedule' | 'battery' | 'voice' | 'event';
  config: Record<string, unknown>;
}

export interface WorkflowAction {
  type: 'launch' | 'close' | 'speak' | 'notify' | 'command' | 'ai' | 'delay';
  config: Record<string, unknown>;
}

export interface SystemStats {
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  gpu?: { usage: number; model: string };
  battery?: { percent: number; charging: boolean };
  network: { online: boolean; type?: string };
  processes: { name: string; pid: number; cpu: number; mem: number }[];
}

export interface AIStats {
  provider: AIProvider;
  model: string;
  status: 'idle' | 'processing' | 'error';
  lastResponseMs?: number;
  memoryUsage?: number;
}

export interface AssistantStats {
  listening: boolean;
  wakeWordActive: boolean;
  voiceEnabled: boolean;
  activeTasks: number;
  activeAutomations: number;
}

export interface CommandResult {
  success: boolean;
  response: string;
  action?: string;
  data?: unknown;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  commands: { pattern: string; handler: string }[];
  enabled: boolean;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high';
  speak?: boolean;
}

// IPC Channel definitions
export const IPC = {
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
} as const;

export interface JarvisAPI {
  ai: {
    chat: (message: string, taskType?: TaskType) => Promise<string>;
    getSettings: () => Promise<AISettings>;
    saveSettings: (settings: Partial<AISettings>) => Promise<void>;
    getProfiles: () => Promise<AIProfile[]>;
    saveProfile: (profile: AIProfile) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;
    getStats: () => Promise<AIStats>;
  };
  voice: {
    getSettings: () => Promise<VoiceSettings>;
    saveSettings: (settings: Partial<VoiceSettings>) => Promise<void>;
    speak: (text: string) => Promise<void>;
    stop: () => Promise<void>;
  };
  system: {
    getStats: () => Promise<SystemStats>;
    launchApp: (name: string) => Promise<boolean>;
    closeApp: (name: string) => Promise<boolean>;
    openFile: (path: string) => Promise<boolean>;
    searchFiles: (query: string, directory?: string) => Promise<string[]>;
    execute: (command: string) => Promise<string>;
    openUrl: (url: string) => Promise<void>;
  };
  command: {
    process: (text: string) => Promise<CommandResult>;
  };
  memory: {
    get: (category?: string) => Promise<MemoryEntry[]>;
    set: (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MemoryEntry>;
    delete: (id: string) => Promise<void>;
    search: (query: string) => Promise<MemoryEntry[]>;
  };
  chat: {
    getHistory: (limit?: number) => Promise<ChatMessage[]>;
    saveMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
    clear: () => Promise<void>;
  };
  workflow: {
    getAll: () => Promise<Workflow[]>;
    save: (workflow: Workflow) => Promise<void>;
    delete: (id: string) => Promise<void>;
    run: (id: string) => Promise<void>;
  };
  window: {
    hide: (mode?: HideMode) => Promise<void>;
    show: () => Promise<void>;
    setMode: (mode: HideMode) => Promise<void>;
    getMode: () => Promise<HideMode>;
    minimize: () => Promise<void>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    save: (settings: Partial<AppSettings>) => Promise<void>;
  };
  plugin: {
    getAll: () => Promise<PluginManifest[]>;
    enable: (id: string) => Promise<void>;
    disable: (id: string) => Promise<void>;
  };
  notify: (payload: Omit<NotificationPayload, 'id'>) => Promise<void>;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

declare global {
  interface Window {
    jarvis: JarvisAPI;
  }
}
