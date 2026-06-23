import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { shell } from 'electron';
import si from 'systeminformation';
import type { SystemStats } from '../../shared/types';

const execAsync = promisify(exec);

const APP_ALIASES: Record<string, { win?: string; mac?: string; linux?: string; url?: string }> = {
  chrome: { win: 'chrome', mac: 'Google Chrome', linux: 'google-chrome', url: 'https://google.com' },
  'google chrome': { win: 'chrome', mac: 'Google Chrome', linux: 'google-chrome' },
  firefox: { win: 'firefox', mac: 'Firefox', linux: 'firefox' },
  edge: { win: 'msedge', mac: 'Microsoft Edge', linux: 'microsoft-edge' },
  vscode: { win: 'code', mac: 'Visual Studio Code', linux: 'code' },
  'vs code': { win: 'code', mac: 'Visual Studio Code', linux: 'code' },
  discord: { win: 'Discord', mac: 'Discord', linux: 'discord' },
  spotify: { win: 'Spotify', mac: 'Spotify', linux: 'spotify' },
  notepad: { win: 'notepad', mac: 'TextEdit', linux: 'gedit' },
  calculator: { win: 'calc', mac: 'Calculator', linux: 'gnome-calculator', url: 'https://www.google.com/search?q=calculator' },
  terminal: { win: 'wt', mac: 'Terminal', linux: 'gnome-terminal' },
  explorer: { win: 'explorer', mac: 'Finder', linux: 'nautilus' },
  youtube: { url: 'https://youtube.com' },
  google: { url: 'https://google.com' },
  gmail: { url: 'https://gmail.com' },
  netflix: { url: 'https://netflix.com' },
  twitter: { url: 'https://twitter.com' },
  facebook: { url: 'https://facebook.com' },
  instagram: { url: 'https://instagram.com' },
  amazon: { url: 'https://amazon.com' },
  maps: { url: 'https://maps.google.com' },
  news: { url: 'https://news.google.com' },
  calendar: { url: 'https://calendar.google.com' },
  photos: { url: 'https://photos.google.com' },
  reddit: { url: 'https://reddit.com' },
  wikipedia: { url: 'https://wikipedia.org' },
};

export class SystemService {
  private cachedStats: SystemStats | null = null;
  private lastFetch = 0;

  async getStats(force = false): Promise<SystemStats> {
    const now = Date.now();
    if (!force && this.cachedStats && now - this.lastFetch < 2000) {
      return this.cachedStats;
    }

    try {
      const [cpu, mem, disk, battery, network, processes] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.battery().catch(() => null),
        si.networkInterfaces(),
        si.processes(),
      ]);

      const mainDisk = disk[0] ?? { used: 0, size: 1 };
      const online = network.some((n) => n.operstate === 'up' && !n.internal);

      const topProcesses = (processes.list ?? [])
        .sort((a, b) => (b.memRss ?? 0) - (a.memRss ?? 0))
        .slice(0, 10)
        .map((p) => ({
          name: p.name,
          pid: p.pid,
          cpu: p.cpu ?? 0,
          mem: p.memRss ?? 0,
        }));

      this.cachedStats = {
        cpu: { usage: Math.round(cpu.currentLoad), cores: os.cpus().length },
        memory: {
          used: mem.active,
          total: mem.total,
          percent: Math.round((mem.active / mem.total) * 100),
        },
        disk: {
          used: mainDisk.used,
          total: mainDisk.size,
          percent: Math.round((mainDisk.used / mainDisk.size) * 100),
        },
        battery: battery ? { percent: battery.percent, charging: battery.isCharging } : undefined,
        network: { online },
        processes: topProcesses,
      };
      this.lastFetch = now;
      return this.cachedStats;
    } catch {
      return {
        cpu: { usage: 0, cores: os.cpus().length },
        memory: { used: 0, total: os.totalmem(), percent: 0 },
        disk: { used: 0, total: 1, percent: 0 },
        network: { online: true },
        processes: [],
      };
    }
  }

  async launchApp(name: string): Promise<boolean> {
    const normalized = name.toLowerCase().trim();
    const alias = APP_ALIASES[normalized];

    if (alias?.url) {
      await shell.openExternal(alias.url);
      return true;
    }

    const platform = process.platform as 'win32' | 'darwin' | 'linux';
    const appName = alias?.[platform === 'win32' ? 'win' : platform === 'darwin' ? 'mac' : 'linux'] ?? name;

    try {
      if (platform === 'win32') {
        await execAsync(`start "" "${appName}"`, { shell: 'cmd.exe' });
      } else if (platform === 'darwin') {
        await execAsync(`open -a "${appName}"`);
      } else {
        spawn(appName, [], { detached: true, stdio: 'ignore' }).unref();
      }
      return true;
    } catch {
      if (alias?.url) {
        await shell.openExternal(alias.url);
        return true;
      }
      return false;
    }
  }

  async closeApp(name: string): Promise<boolean> {
    const platform = process.platform;
    try {
      if (platform === 'win32') {
        await execAsync(`taskkill /IM "${name}*" /F`, { shell: 'cmd.exe' });
      } else if (platform === 'darwin') {
        await execAsync(`pkill -f "${name}"`);
      } else {
        await execAsync(`pkill -f "${name}"`);
      }
      return true;
    } catch {
      return false;
    }
  }

  async openFile(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        await shell.openPath(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async openFolder(folderName: string): Promise<boolean> {
    const folders: Record<string, string> = {
      downloads: path.join(os.homedir(), 'Downloads'),
      documents: path.join(os.homedir(), 'Documents'),
      desktop: path.join(os.homedir(), 'Desktop'),
      pictures: path.join(os.homedir(), 'Pictures'),
      music: path.join(os.homedir(), 'Music'),
      videos: path.join(os.homedir(), 'Videos'),
      home: os.homedir(),
      projects: path.join(os.homedir(), 'Projects'),
    };

    const target = folders[folderName.toLowerCase()] ?? folderName;
    if (fs.existsSync(target)) {
      await shell.openPath(target);
      return true;
    }
    return false;
  }

  async searchFiles(query: string, directory?: string): Promise<string[]> {
    const searchDir = directory ?? os.homedir();
    const results: string[] = [];

    try {
      const search = async (dir: string, depth = 0): Promise<void> => {
        if (depth > 4 || results.length >= 50) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.name.toLowerCase().includes(query.toLowerCase())) {
            results.push(fullPath);
          }
          if (entry.isDirectory() && depth < 3) {
            try { await search(fullPath, depth + 1); } catch { /* skip inaccessible */ }
          }
        }
      };
      await search(searchDir);
    } catch { /* ignore */ }

    return results;
  }

  async createFolder(name: string, parentDir?: string): Promise<string | null> {
    const dir = parentDir ?? path.join(os.homedir(), 'Desktop');
    const folderPath = path.join(dir, name);
    try {
      fs.mkdirSync(folderPath, { recursive: true });
      return folderPath;
    } catch {
      return null;
    }
  }

  async openUrl(url: string): Promise<void> {
    let finalUrl = url;
    if (!url.startsWith('http')) {
      finalUrl = `https://${url}`;
    }
    await shell.openExternal(finalUrl);
  }

  async searchWeb(query: string, engine = 'google'): Promise<void> {
    const engines: Record<string, string> = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      reddit: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
      wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
    };
    await shell.openExternal(engines[engine] ?? engines.google);
  }

  async execute(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(command, { timeout: 30000 });
      return stdout.trim();
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  }
}

export const systemService = new SystemService();
