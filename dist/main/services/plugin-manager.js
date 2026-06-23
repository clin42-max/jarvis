"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = exports.PluginManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const database_1 = require("../database/database");
class PluginManager {
    plugins = new Map();
    pluginsDir;
    constructor() {
        this.pluginsDir = path_1.default.join(electron_1.app.getPath('userData'), 'plugins');
        fs_1.default.mkdirSync(this.pluginsDir, { recursive: true });
    }
    async initialize() {
        this.registerBuiltInPlugins();
        await this.loadInstalledPlugins();
    }
    registerBuiltInPlugins() {
        const builtIns = [
            {
                id: 'discord', name: 'Discord', version: '1.0.0',
                description: 'Control Discord via voice commands',
                author: 'JARVIS', commands: [{ pattern: 'open discord', handler: 'launch' }],
                enabled: true,
            },
            {
                id: 'spotify', name: 'Spotify', version: '1.0.0',
                description: 'Music control for Spotify',
                author: 'JARVIS', commands: [{ pattern: 'play music', handler: 'media' }],
                enabled: true,
            },
            {
                id: 'youtube', name: 'YouTube', version: '1.0.0',
                description: 'YouTube search and playback',
                author: 'JARVIS', commands: [{ pattern: 'youtube', handler: 'search' }],
                enabled: true,
            },
            {
                id: 'github', name: 'GitHub', version: '1.0.0',
                description: 'GitHub repository management',
                author: 'JARVIS', commands: [{ pattern: 'github', handler: 'open' }],
                enabled: false,
            },
            {
                id: 'home-assistant', name: 'Home Assistant', version: '1.0.0',
                description: 'Smart home control',
                author: 'JARVIS', commands: [{ pattern: 'turn on lights', handler: 'smart_home' }],
                enabled: false,
            },
        ];
        const db = (0, database_1.getDatabase)();
        for (const plugin of builtIns) {
            const existing = db.prepare('SELECT id FROM plugins WHERE id = ?').get(plugin.id);
            if (!existing) {
                db.prepare(`INSERT INTO plugins (id, name, version, description, author, commands, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)`)
                    .run(plugin.id, plugin.name, plugin.version, plugin.description, plugin.author, JSON.stringify(plugin.commands), plugin.enabled ? 1 : 0);
            }
            this.plugins.set(plugin.id, { manifest: plugin });
        }
    }
    async loadInstalledPlugins() {
        const entries = fs_1.default.readdirSync(this.pluginsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const manifestPath = path_1.default.join(this.pluginsDir, entry.name, 'manifest.json');
            if (fs_1.default.existsSync(manifestPath)) {
                try {
                    const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
                    this.plugins.set(manifest.id, { manifest });
                }
                catch { /* skip invalid plugins */ }
            }
        }
    }
    getAll() {
        const db = (0, database_1.getDatabase)();
        return db.prepare('SELECT * FROM plugins ORDER BY name').all().map((row) => {
            const r = row;
            return {
                id: r.id, name: r.name, version: r.version, description: r.description,
                author: r.author, commands: JSON.parse(r.commands), enabled: r.enabled === 1,
            };
        });
    }
    enable(id) {
        (0, database_1.getDatabase)().prepare('UPDATE plugins SET enabled = 1 WHERE id = ?').run(id);
    }
    disable(id) {
        (0, database_1.getDatabase)().prepare('UPDATE plugins SET enabled = 0 WHERE id = ?').run(id);
    }
    matchCommand(text) {
        const cmd = text.toLowerCase();
        for (const [id, { manifest }] of this.plugins) {
            if (!manifest.enabled)
                continue;
            for (const command of manifest.commands) {
                if (cmd.includes(command.pattern)) {
                    return { pluginId: id, handler: command.handler };
                }
            }
        }
        return null;
    }
    getSDKReadme() {
        return `# JARVIS Plugin SDK

## Creating a Plugin

1. Create a folder in the plugins directory
2. Add a manifest.json:

\`\`\`json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Description",
  "author": "Your Name",
  "commands": [
    { "pattern": "my command", "handler": "handleCommand" }
  ],
  "enabled": true
}
\`\`\`

3. Add index.js with your handler logic

## API

Plugins can access JARVIS services via the plugin context:
- launchApp(name)
- openUrl(url)
- speak(text)
- notify(title, body)
- aiChat(message)
`;
    }
}
exports.PluginManager = PluginManager;
exports.pluginManager = new PluginManager();
//# sourceMappingURL=plugin-manager.js.map