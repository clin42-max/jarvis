import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import type { PluginManifest } from '../../shared/types';
import { getDatabase } from '../database/database';
import { generateId } from '../security/encryption';

export interface PluginHandler {
  (args: string[]): Promise<string>;
}

export class PluginManager {
  private plugins: Map<string, { manifest: PluginManifest; handler?: PluginHandler }> = new Map();
  private pluginsDir: string;

  constructor() {
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
    fs.mkdirSync(this.pluginsDir, { recursive: true });
  }

  async initialize(): Promise<void> {
    this.registerBuiltInPlugins();
    await this.loadInstalledPlugins();
  }

  private registerBuiltInPlugins(): void {
    const builtIns: PluginManifest[] = [
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

    const db = getDatabase();
    for (const plugin of builtIns) {
      const existing = db.prepare('SELECT id FROM plugins WHERE id = ?').get(plugin.id);
      if (!existing) {
        db.prepare(`INSERT INTO plugins (id, name, version, description, author, commands, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run(plugin.id, plugin.name, plugin.version, plugin.description, plugin.author, JSON.stringify(plugin.commands), plugin.enabled ? 1 : 0);
      }
      this.plugins.set(plugin.id, { manifest: plugin });
    }
  }

  private async loadInstalledPlugins(): Promise<void> {
    const entries = fs.readdirSync(this.pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(this.pluginsDir, entry.name, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as PluginManifest;
          this.plugins.set(manifest.id, { manifest });
        } catch { /* skip invalid plugins */ }
      }
    }
  }

  getAll(): PluginManifest[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM plugins ORDER BY name').all().map((row) => {
      const r = row as { id: string; name: string; version: string; description: string; author: string; commands: string; enabled: number };
      return {
        id: r.id, name: r.name, version: r.version, description: r.description,
        author: r.author, commands: JSON.parse(r.commands), enabled: r.enabled === 1,
      };
    });
  }

  enable(id: string): void {
    getDatabase().prepare('UPDATE plugins SET enabled = 1 WHERE id = ?').run(id);
  }

  disable(id: string): void {
    getDatabase().prepare('UPDATE plugins SET enabled = 0 WHERE id = ?').run(id);
  }

  matchCommand(text: string): { pluginId: string; handler: string } | null {
    const cmd = text.toLowerCase();
    for (const [id, { manifest }] of this.plugins) {
      if (!manifest.enabled) continue;
      for (const command of manifest.commands) {
        if (cmd.includes(command.pattern)) {
          return { pluginId: id, handler: command.handler };
        }
      }
    }
    return null;
  }

  getSDKReadme(): string {
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

export const pluginManager = new PluginManager();
