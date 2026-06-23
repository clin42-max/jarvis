import { getDatabase } from '../database/database';
import { encrypt, decrypt, generateId } from '../security/encryption';
import type { AISettings, AIProfile, AppSettings, VoiceSettings, MemoryEntry, ChatMessage, Workflow } from '../../shared/types';

const DEFAULT_AI_SETTINGS: AISettings = {
  activeProvider: 'anthropic',
  activeModel: 'claude-sonnet-4-20250514',
  apiKeys: {},
  profiles: [],
  taskModelMap: {
    reasoning: 'claude-sonnet-4-20250514',
    coding: 'gpt-4o',
    research: 'gemini-2.0-flash',
    automation: 'deepseek-chat',
  },
  temperature: 0.7,
  maxTokens: 2048,
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  mode: 'wake-word',
  wakeWords: ['hey jarvis', 'jarvis', 'computer', 'assistant', 'friday'],
  recognitionEngine: 'browser',
  synthesisEngine: 'browser',
  voiceRate: 1.0,
  voicePitch: 1.0,
  noiseReduction: true,
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'jarvis',
  hideMode: 'none',
  startupWithSystem: false,
  minimizeToTray: true,
  hotkeys: {
    showHide: 'CommandOrControl+Shift+J',
    pushToTalk: 'CommandOrControl+Shift+Space',
  },
  notifications: {
    desktop: true,
    voice: true,
    priority: true,
  },
  privacy: {
    encryptKeys: true,
    confirmDestructive: true,
  },
};

export class SettingsService {
  get<T>(key: string, defaultValue: T): T {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    if (!row) return defaultValue;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return defaultValue;
    }
  }

  set(key: string, value: unknown): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, JSON.stringify(value));
  }

  getAISettings(): AISettings {
    const settings = this.get<AISettings>('ai_settings', DEFAULT_AI_SETTINGS);
    // Decrypt API keys
    const decrypted: Partial<Record<string, string>> = {};
    for (const [provider, encryptedKey] of Object.entries(settings.apiKeys)) {
      if (encryptedKey) {
        decrypted[provider] = decrypt(encryptedKey);
      }
    }
    return { ...settings, apiKeys: decrypted as AISettings['apiKeys'] };
  }

  saveAISettings(settings: Partial<AISettings>): void {
    const current = this.getAISettings();
    const merged = { ...current, ...settings };

    // Encrypt API keys before saving
    const encrypted: Partial<Record<string, string>> = {};
    for (const [provider, key] of Object.entries(merged.apiKeys)) {
      if (key) {
        encrypted[provider] = encrypt(key);
      }
    }
    merged.apiKeys = encrypted as AISettings['apiKeys'];

    this.set('ai_settings', merged);
  }

  getVoiceSettings(): VoiceSettings {
    return this.get('voice_settings', DEFAULT_VOICE_SETTINGS);
  }

  saveVoiceSettings(settings: Partial<VoiceSettings>): void {
    const current = this.getVoiceSettings();
    this.set('voice_settings', { ...current, ...settings });
  }

  getAppSettings(): AppSettings {
    return this.get('app_settings', DEFAULT_APP_SETTINGS);
  }

  saveAppSettings(settings: Partial<AppSettings>): void {
    const current = this.getAppSettings();
    this.set('app_settings', { ...current, ...settings });
  }
}

export class MemoryService {
  getAll(category?: string): MemoryEntry[] {
    const db = getDatabase();
    if (category) {
      return db.prepare('SELECT * FROM memory WHERE category = ? ORDER BY updated_at DESC').all(category) as MemoryEntry[];
    }
    return db.prepare('SELECT * FROM memory ORDER BY updated_at DESC').all() as MemoryEntry[];
  }

  set(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): MemoryEntry {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM memory WHERE category = ? AND key = ?').get(entry.category, entry.key) as { id: string } | undefined;

    if (existing) {
      db.prepare(`UPDATE memory SET value = ?, metadata = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(entry.value, entry.metadata ?? null, existing.id);
      return db.prepare('SELECT * FROM memory WHERE id = ?').get(existing.id) as MemoryEntry;
    }

    const id = generateId();
    db.prepare(`INSERT INTO memory (id, category, key, value, metadata) VALUES (?, ?, ?, ?, ?)`)
      .run(id, entry.category, entry.key, entry.value, entry.metadata ?? null);
    return db.prepare('SELECT * FROM memory WHERE id = ?').get(id) as MemoryEntry;
  }

  delete(id: string): void {
    getDatabase().prepare('DELETE FROM memory WHERE id = ?').run(id);
  }

  search(query: string): MemoryEntry[] {
    const db = getDatabase();
    const pattern = `%${query}%`;
    return db.prepare(`SELECT * FROM memory WHERE key LIKE ? OR value LIKE ? ORDER BY updated_at DESC LIMIT 50`)
      .all(pattern, pattern) as MemoryEntry[];
  }

  rememberPreference(key: string, value: string): void {
    this.set({ category: 'preference', key, value });
  }

  getPreference(key: string): string | null {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM memory WHERE category = ? AND key = ?').get('preference', key) as { value: string } | undefined;
    return row?.value ?? null;
  }
}

export class ChatService {
  getHistory(limit = 50): ChatMessage[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT ?').all(limit) as ChatMessage[];
  }

  saveMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const db = getDatabase();
    const id = generateId();
    db.prepare(`INSERT INTO chat_history (id, role, content, provider, model) VALUES (?, ?, ?, ?, ?)`)
      .run(id, message.role, message.content, message.provider ?? null, message.model ?? null);
    return db.prepare('SELECT * FROM chat_history WHERE id = ?').get(id) as ChatMessage;
  }

  clear(): void {
    getDatabase().prepare('DELETE FROM chat_history').run();
  }
}

export class WorkflowService {
  getAll(): Workflow[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM workflows ORDER BY created_at DESC').all() as Array<{
      id: string; name: string; trigger_type: string; trigger_config: string;
      actions: string; enabled: number; created_at: string;
    }>;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      trigger: { type: r.trigger_type as Workflow['trigger']['type'], config: JSON.parse(r.trigger_config) },
      actions: JSON.parse(r.actions),
      enabled: r.enabled === 1,
      createdAt: r.created_at,
    }));
  }

  save(workflow: Workflow): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO workflows (id, name, trigger_type, trigger_config, actions, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, trigger_type = excluded.trigger_type,
        trigger_config = excluded.trigger_config, actions = excluded.actions, enabled = excluded.enabled
    `).run(
      workflow.id, workflow.name, workflow.trigger.type,
      JSON.stringify(workflow.trigger.config), JSON.stringify(workflow.actions),
      workflow.enabled ? 1 : 0
    );
  }

  delete(id: string): void {
    getDatabase().prepare('DELETE FROM workflows WHERE id = ?').run(id);
  }

  getEnabled(): Workflow[] {
    return this.getAll().filter((w) => w.enabled);
  }
}

export const settingsService = new SettingsService();
export const memoryService = new MemoryService();
export const chatService = new ChatService();
export const workflowService = new WorkflowService();
