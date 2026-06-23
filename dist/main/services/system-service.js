"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemService = exports.SystemService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const electron_1 = require("electron");
const systeminformation_1 = __importDefault(require("systeminformation"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const APP_ALIASES = {
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
class SystemService {
    cachedStats = null;
    lastFetch = 0;
    async getStats(force = false) {
        const now = Date.now();
        if (!force && this.cachedStats && now - this.lastFetch < 2000) {
            return this.cachedStats;
        }
        try {
            const [cpu, mem, disk, battery, network, processes] = await Promise.all([
                systeminformation_1.default.currentLoad(),
                systeminformation_1.default.mem(),
                systeminformation_1.default.fsSize(),
                systeminformation_1.default.battery().catch(() => null),
                systeminformation_1.default.networkInterfaces(),
                systeminformation_1.default.processes(),
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
                cpu: { usage: Math.round(cpu.currentLoad), cores: os_1.default.cpus().length },
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
        }
        catch {
            return {
                cpu: { usage: 0, cores: os_1.default.cpus().length },
                memory: { used: 0, total: os_1.default.totalmem(), percent: 0 },
                disk: { used: 0, total: 1, percent: 0 },
                network: { online: true },
                processes: [],
            };
        }
    }
    async launchApp(name) {
        const normalized = name.toLowerCase().trim();
        const alias = APP_ALIASES[normalized];
        if (alias?.url) {
            await electron_1.shell.openExternal(alias.url);
            return true;
        }
        const platform = process.platform;
        const appName = alias?.[platform === 'win32' ? 'win' : platform === 'darwin' ? 'mac' : 'linux'] ?? name;
        try {
            if (platform === 'win32') {
                await execAsync(`start "" "${appName}"`, { shell: 'cmd.exe' });
            }
            else if (platform === 'darwin') {
                await execAsync(`open -a "${appName}"`);
            }
            else {
                (0, child_process_1.spawn)(appName, [], { detached: true, stdio: 'ignore' }).unref();
            }
            return true;
        }
        catch {
            if (alias?.url) {
                await electron_1.shell.openExternal(alias.url);
                return true;
            }
            return false;
        }
    }
    async closeApp(name) {
        const platform = process.platform;
        try {
            if (platform === 'win32') {
                await execAsync(`taskkill /IM "${name}*" /F`, { shell: 'cmd.exe' });
            }
            else if (platform === 'darwin') {
                await execAsync(`pkill -f "${name}"`);
            }
            else {
                await execAsync(`pkill -f "${name}"`);
            }
            return true;
        }
        catch {
            return false;
        }
    }
    async openFile(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                await electron_1.shell.openPath(filePath);
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async openFolder(folderName) {
        const folders = {
            downloads: path_1.default.join(os_1.default.homedir(), 'Downloads'),
            documents: path_1.default.join(os_1.default.homedir(), 'Documents'),
            desktop: path_1.default.join(os_1.default.homedir(), 'Desktop'),
            pictures: path_1.default.join(os_1.default.homedir(), 'Pictures'),
            music: path_1.default.join(os_1.default.homedir(), 'Music'),
            videos: path_1.default.join(os_1.default.homedir(), 'Videos'),
            home: os_1.default.homedir(),
            projects: path_1.default.join(os_1.default.homedir(), 'Projects'),
        };
        const target = folders[folderName.toLowerCase()] ?? folderName;
        if (fs_1.default.existsSync(target)) {
            await electron_1.shell.openPath(target);
            return true;
        }
        return false;
    }
    async searchFiles(query, directory) {
        const searchDir = directory ?? os_1.default.homedir();
        const results = [];
        try {
            const search = async (dir, depth = 0) => {
                if (depth > 4 || results.length >= 50)
                    return;
                const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.name.startsWith('.'))
                        continue;
                    const fullPath = path_1.default.join(dir, entry.name);
                    if (entry.name.toLowerCase().includes(query.toLowerCase())) {
                        results.push(fullPath);
                    }
                    if (entry.isDirectory() && depth < 3) {
                        try {
                            await search(fullPath, depth + 1);
                        }
                        catch { /* skip inaccessible */ }
                    }
                }
            };
            await search(searchDir);
        }
        catch { /* ignore */ }
        return results;
    }
    async createFolder(name, parentDir) {
        const dir = parentDir ?? path_1.default.join(os_1.default.homedir(), 'Desktop');
        const folderPath = path_1.default.join(dir, name);
        try {
            fs_1.default.mkdirSync(folderPath, { recursive: true });
            return folderPath;
        }
        catch {
            return null;
        }
    }
    async openUrl(url) {
        let finalUrl = url;
        if (!url.startsWith('http')) {
            finalUrl = `https://${url}`;
        }
        await electron_1.shell.openExternal(finalUrl);
    }
    async searchWeb(query, engine = 'google') {
        const engines = {
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            reddit: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
            wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
        };
        await electron_1.shell.openExternal(engines[engine] ?? engines.google);
    }
    async execute(command) {
        try {
            const { stdout } = await execAsync(command, { timeout: 30000 });
            return stdout.trim();
        }
        catch (error) {
            return `Error: ${error.message}`;
        }
    }
}
exports.SystemService = SystemService;
exports.systemService = new SystemService();
//# sourceMappingURL=system-service.js.map