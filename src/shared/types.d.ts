export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'grok' | 'deepseek' | 'perplexity' | 'mistral' | 'ollama' | 'lmstudio' | 'custom';
export type TaskType = 'general' | 'reasoning' | 'coding' | 'research' | 'automation' | 'creative';
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
    cpu: {
        usage: number;
        cores: number;
    };
    memory: {
        used: number;
        total: number;
        percent: number;
    };
    disk: {
        used: number;
        total: number;
        percent: number;
    };
    gpu?: {
        usage: number;
        model: string;
    };
    battery?: {
        percent: number;
        charging: boolean;
    };
    network: {
        online: boolean;
        type?: string;
    };
    processes: {
        name: string;
        pid: number;
        cpu: number;
        mem: number;
    }[];
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
    commands: {
        pattern: string;
        handler: string;
    }[];
    enabled: boolean;
}
export interface NotificationPayload {
    id: string;
    title: string;
    body: string;
    priority: 'low' | 'normal' | 'high';
    speak?: boolean;
}
export declare const IPC: {
    readonly AI_CHAT: "ai:chat";
    readonly AI_GET_SETTINGS: "ai:get-settings";
    readonly AI_SAVE_SETTINGS: "ai:save-settings";
    readonly AI_GET_PROFILES: "ai:get-profiles";
    readonly AI_SAVE_PROFILE: "ai:save-profile";
    readonly AI_DELETE_PROFILE: "ai:delete-profile";
    readonly AI_GET_STATS: "ai:get-stats";
    readonly VOICE_GET_SETTINGS: "voice:get-settings";
    readonly VOICE_SAVE_SETTINGS: "voice:save-settings";
    readonly VOICE_SPEAK: "voice:speak";
    readonly VOICE_STOP: "voice:stop";
    readonly SYSTEM_GET_STATS: "system:get-stats";
    readonly SYSTEM_LAUNCH_APP: "system:launch-app";
    readonly SYSTEM_CLOSE_APP: "system:close-app";
    readonly SYSTEM_OPEN_FILE: "system:open-file";
    readonly SYSTEM_SEARCH_FILES: "system:search-files";
    readonly SYSTEM_EXECUTE: "system:execute";
    readonly SYSTEM_OPEN_URL: "system:open-url";
    readonly COMMAND_PROCESS: "command:process";
    readonly MEMORY_GET: "memory:get";
    readonly MEMORY_SET: "memory:set";
    readonly MEMORY_DELETE: "memory:delete";
    readonly MEMORY_SEARCH: "memory:search";
    readonly CHAT_GET_HISTORY: "chat:get-history";
    readonly CHAT_SAVE_MESSAGE: "chat:save-message";
    readonly CHAT_CLEAR: "chat:clear";
    readonly WORKFLOW_GET_ALL: "workflow:get-all";
    readonly WORKFLOW_SAVE: "workflow:save";
    readonly WORKFLOW_DELETE: "workflow:delete";
    readonly WORKFLOW_RUN: "workflow:run";
    readonly WINDOW_HIDE: "window:hide";
    readonly WINDOW_SHOW: "window:show";
    readonly WINDOW_SET_MODE: "window:set-mode";
    readonly WINDOW_GET_MODE: "window:get-mode";
    readonly WINDOW_MINIMIZE: "window:minimize";
    readonly SETTINGS_GET: "settings:get";
    readonly SETTINGS_SAVE: "settings:save";
    readonly PLUGIN_GET_ALL: "plugin:get-all";
    readonly PLUGIN_ENABLE: "plugin:enable";
    readonly PLUGIN_DISABLE: "plugin:disable";
    readonly NOTIFY: "notify:send";
    readonly EVENT_SYSTEM_STATS: "event:system-stats";
    readonly EVENT_AI_STATUS: "event:ai-status";
    readonly EVENT_WAKE_WORD: "event:wake-word";
    readonly EVENT_COMMAND: "event:command";
};
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
//# sourceMappingURL=types.d.ts.map