import type { AISettings, AppSettings, VoiceSettings, MemoryEntry, ChatMessage, Workflow } from '../../shared/types';
export declare class SettingsService {
    get<T>(key: string, defaultValue: T): T;
    set(key: string, value: unknown): void;
    getAISettings(): AISettings;
    saveAISettings(settings: Partial<AISettings>): void;
    getVoiceSettings(): VoiceSettings;
    saveVoiceSettings(settings: Partial<VoiceSettings>): void;
    getAppSettings(): AppSettings;
    saveAppSettings(settings: Partial<AppSettings>): void;
}
export declare class MemoryService {
    getAll(category?: string): MemoryEntry[];
    set(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): MemoryEntry;
    delete(id: string): void;
    search(query: string): MemoryEntry[];
    rememberPreference(key: string, value: string): void;
    getPreference(key: string): string | null;
}
export declare class ChatService {
    getHistory(limit?: number): ChatMessage[];
    saveMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage;
    clear(): void;
}
export declare class WorkflowService {
    getAll(): Workflow[];
    save(workflow: Workflow): void;
    delete(id: string): void;
    getEnabled(): Workflow[];
}
export declare const settingsService: SettingsService;
export declare const memoryService: MemoryService;
export declare const chatService: ChatService;
export declare const workflowService: WorkflowService;
//# sourceMappingURL=settings-service.d.ts.map