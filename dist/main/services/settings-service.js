"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowService = exports.chatService = exports.memoryService = exports.settingsService = exports.WorkflowService = exports.ChatService = exports.MemoryService = exports.SettingsService = void 0;
const database_1 = require("../database/database");
const encryption_1 = require("../security/encryption");
const DEFAULT_AI_SETTINGS = {
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
const DEFAULT_VOICE_SETTINGS = {
    enabled: true,
    mode: 'wake-word',
    wakeWords: ['hey jarvis', 'jarvis', 'computer', 'assistant', 'friday'],
    recognitionEngine: 'browser',
    synthesisEngine: 'browser',
    voiceRate: 1.0,
    voicePitch: 1.0,
    noiseReduction: true,
};
const DEFAULT_APP_SETTINGS = {
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
class SettingsService {
    get(key, defaultValue) {
        const db = (0, database_1.getDatabase)();
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        if (!row)
            return defaultValue;
        try {
            return JSON.parse(row.value);
        }
        catch {
            return defaultValue;
        }
    }
    set(key, value) {
        const db = (0, database_1.getDatabase)();
        db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, JSON.stringify(value));
    }
    getAISettings() {
        const settings = this.get('ai_settings', DEFAULT_AI_SETTINGS);
        // Decrypt API keys
        const decrypted = {};
        for (const [provider, encryptedKey] of Object.entries(settings.apiKeys)) {
            if (encryptedKey) {
                decrypted[provider] = (0, encryption_1.decrypt)(encryptedKey);
            }
        }
        return { ...settings, apiKeys: decrypted };
    }
    saveAISettings(settings) {
        const current = this.getAISettings();
        const merged = { ...current, ...settings };
        // Encrypt API keys before saving
        const encrypted = {};
        for (const [provider, key] of Object.entries(merged.apiKeys)) {
            if (key) {
                encrypted[provider] = (0, encryption_1.encrypt)(key);
            }
        }
        merged.apiKeys = encrypted;
        this.set('ai_settings', merged);
    }
    getVoiceSettings() {
        return this.get('voice_settings', DEFAULT_VOICE_SETTINGS);
    }
    saveVoiceSettings(settings) {
        const current = this.getVoiceSettings();
        this.set('voice_settings', { ...current, ...settings });
    }
    getAppSettings() {
        return this.get('app_settings', DEFAULT_APP_SETTINGS);
    }
    saveAppSettings(settings) {
        const current = this.getAppSettings();
        this.set('app_settings', { ...current, ...settings });
    }
}
exports.SettingsService = SettingsService;
class MemoryService {
    getAll(category) {
        const db = (0, database_1.getDatabase)();
        if (category) {
            return db.prepare('SELECT * FROM memory WHERE category = ? ORDER BY updated_at DESC').all(category);
        }
        return db.prepare('SELECT * FROM memory ORDER BY updated_at DESC').all();
    }
    set(entry) {
        const db = (0, database_1.getDatabase)();
        const existing = db.prepare('SELECT id FROM memory WHERE category = ? AND key = ?').get(entry.category, entry.key);
        if (existing) {
            db.prepare(`UPDATE memory SET value = ?, metadata = ?, updated_at = datetime('now') WHERE id = ?`)
                .run(entry.value, entry.metadata ?? null, existing.id);
            return db.prepare('SELECT * FROM memory WHERE id = ?').get(existing.id);
        }
        const id = (0, encryption_1.generateId)();
        db.prepare(`INSERT INTO memory (id, category, key, value, metadata) VALUES (?, ?, ?, ?, ?)`)
            .run(id, entry.category, entry.key, entry.value, entry.metadata ?? null);
        return db.prepare('SELECT * FROM memory WHERE id = ?').get(id);
    }
    delete(id) {
        (0, database_1.getDatabase)().prepare('DELETE FROM memory WHERE id = ?').run(id);
    }
    search(query) {
        const db = (0, database_1.getDatabase)();
        const pattern = `%${query}%`;
        return db.prepare(`SELECT * FROM memory WHERE key LIKE ? OR value LIKE ? ORDER BY updated_at DESC LIMIT 50`)
            .all(pattern, pattern);
    }
    rememberPreference(key, value) {
        this.set({ category: 'preference', key, value });
    }
    getPreference(key) {
        const db = (0, database_1.getDatabase)();
        const row = db.prepare('SELECT value FROM memory WHERE category = ? AND key = ?').get('preference', key);
        return row?.value ?? null;
    }
}
exports.MemoryService = MemoryService;
class ChatService {
    getHistory(limit = 50) {
        const db = (0, database_1.getDatabase)();
        return db.prepare('SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT ?').all(limit);
    }
    saveMessage(message) {
        const db = (0, database_1.getDatabase)();
        const id = (0, encryption_1.generateId)();
        db.prepare(`INSERT INTO chat_history (id, role, content, provider, model) VALUES (?, ?, ?, ?, ?)`)
            .run(id, message.role, message.content, message.provider ?? null, message.model ?? null);
        return db.prepare('SELECT * FROM chat_history WHERE id = ?').get(id);
    }
    clear() {
        (0, database_1.getDatabase)().prepare('DELETE FROM chat_history').run();
    }
}
exports.ChatService = ChatService;
class WorkflowService {
    getAll() {
        const db = (0, database_1.getDatabase)();
        const rows = db.prepare('SELECT * FROM workflows ORDER BY created_at DESC').all();
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            trigger: { type: r.trigger_type, config: JSON.parse(r.trigger_config) },
            actions: JSON.parse(r.actions),
            enabled: r.enabled === 1,
            createdAt: r.created_at,
        }));
    }
    save(workflow) {
        const db = (0, database_1.getDatabase)();
        db.prepare(`
      INSERT INTO workflows (id, name, trigger_type, trigger_config, actions, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, trigger_type = excluded.trigger_type,
        trigger_config = excluded.trigger_config, actions = excluded.actions, enabled = excluded.enabled
    `).run(workflow.id, workflow.name, workflow.trigger.type, JSON.stringify(workflow.trigger.config), JSON.stringify(workflow.actions), workflow.enabled ? 1 : 0);
    }
    delete(id) {
        (0, database_1.getDatabase)().prepare('DELETE FROM workflows WHERE id = ?').run(id);
    }
    getEnabled() {
        return this.getAll().filter((w) => w.enabled);
    }
}
exports.WorkflowService = WorkflowService;
exports.settingsService = new SettingsService();
exports.memoryService = new MemoryService();
exports.chatService = new ChatService();
exports.workflowService = new WorkflowService();
//# sourceMappingURL=settings-service.js.map