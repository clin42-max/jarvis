"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.windowManager = exports.WindowManager = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const settings_service_1 = require("./settings-service");
class WindowManager {
    mainWindow = null;
    orbWindow = null;
    widgetWindow = null;
    tray = null;
    currentMode = 'none';
    createMainWindow() {
        const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
        this.mainWindow = new electron_1.BrowserWindow({
            width: Math.min(900, width),
            height: Math.min(800, height),
            minWidth: 400,
            minHeight: 600,
            x: Math.floor((width - 900) / 2),
            y: Math.floor((height - 800) / 2),
            frame: false,
            transparent: true,
            resizable: true,
            show: false,
            backgroundColor: '#00000000',
            webPreferences: {
                preload: path_1.default.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
            },
            icon: this.getIcon(),
        });
        const rendererPath = path_1.default.join(__dirname, '../renderer/index.html');
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.loadURL('http://localhost:5173');
        }
        else {
            this.mainWindow.loadFile(rendererPath);
        }
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
        });
        this.mainWindow.on('close', (e) => {
            const settings = settings_service_1.settingsService.getAppSettings();
            if (settings.minimizeToTray) {
                e.preventDefault();
                this.hide('quick');
            }
        });
        return this.mainWindow;
    }
    createTray() {
        const icon = this.getIcon();
        this.tray = new electron_1.Tray(icon.resize({ width: 16, height: 16 }));
        const contextMenu = electron_1.Menu.buildFromTemplate([
            { label: 'Show JARVIS', click: () => this.show() },
            { label: 'Hide JARVIS', click: () => this.hide('quick') },
            { type: 'separator' },
            { label: 'Voice On', click: () => this.mainWindow?.webContents.send('tray:voice-on') },
            { label: 'Voice Off', click: () => this.mainWindow?.webContents.send('tray:voice-off') },
            { type: 'separator' },
            { label: 'Orb Mode', click: () => this.setMode('orb') },
            { label: 'Widget Mode', click: () => this.setMode('widget') },
            { type: 'separator' },
            { label: 'Settings', click: () => { this.show(); this.mainWindow?.webContents.send('navigate', 'settings'); } },
            { label: 'Restart', click: () => { electron_1.app.relaunch(); electron_1.app.exit(0); } },
            { label: 'Exit', click: () => electron_1.app.quit() },
        ]);
        this.tray.setToolTip('JARVIS - AI Assistant');
        this.tray.setContextMenu(contextMenu);
        this.tray.on('double-click', () => this.show());
    }
    registerHotkeys() {
        const settings = settings_service_1.settingsService.getAppSettings();
        electron_1.globalShortcut.register(settings.hotkeys.showHide, () => {
            if (this.currentMode === 'none' && this.mainWindow?.isVisible()) {
                this.hide('quick');
            }
            else {
                this.show();
            }
        });
    }
    hide(mode = 'quick') {
        this.currentMode = mode;
        switch (mode) {
            case 'quick':
                this.mainWindow?.hide();
                break;
            case 'stealth':
                this.mainWindow?.hide();
                if (this.mainWindow) {
                    this.mainWindow.setSkipTaskbar(true);
                }
                break;
            case 'orb':
                this.mainWindow?.hide();
                this.createOrbWindow();
                break;
            case 'widget':
                this.mainWindow?.hide();
                this.createWidgetWindow();
                break;
        }
        settings_service_1.settingsService.saveAppSettings({ hideMode: mode });
    }
    show() {
        this.currentMode = 'none';
        if (this.mainWindow) {
            this.mainWindow.setSkipTaskbar(false);
            this.mainWindow.show();
            this.mainWindow.focus();
        }
        this.orbWindow?.close();
        this.orbWindow = null;
        this.widgetWindow?.close();
        this.widgetWindow = null;
        settings_service_1.settingsService.saveAppSettings({ hideMode: 'none' });
    }
    setMode(mode) {
        if (mode === 'none') {
            this.show();
        }
        else {
            this.hide(mode);
        }
    }
    getMode() {
        return this.currentMode;
    }
    minimize() {
        this.mainWindow?.minimize();
    }
    createOrbWindow() {
        if (this.orbWindow)
            return;
        const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
        this.orbWindow = new electron_1.BrowserWindow({
            width: 80,
            height: 80,
            x: width - 100,
            y: height - 100,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            skipTaskbar: true,
            hasShadow: false,
            webPreferences: {
                preload: path_1.default.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });
        const orbPath = path_1.default.join(__dirname, '../renderer/orb.html');
        if (process.env.NODE_ENV === 'development') {
            this.orbWindow.loadURL('http://localhost:5173/orb.html');
        }
        else {
            this.orbWindow.loadFile(orbPath);
        }
        this.orbWindow.on('closed', () => { this.orbWindow = null; });
    }
    createWidgetWindow() {
        if (this.widgetWindow)
            return;
        const { width } = electron_1.screen.getPrimaryDisplay().workAreaSize;
        this.widgetWindow = new electron_1.BrowserWindow({
            width: 280,
            height: 120,
            x: width - 300,
            y: 20,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            skipTaskbar: true,
            hasShadow: false,
            webPreferences: {
                preload: path_1.default.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });
        const widgetPath = path_1.default.join(__dirname, '../renderer/widget.html');
        if (process.env.NODE_ENV === 'development') {
            this.widgetWindow.loadURL('http://localhost:5173/widget.html');
        }
        else {
            this.widgetWindow.loadFile(widgetPath);
        }
        this.widgetWindow.on('closed', () => { this.widgetWindow = null; });
    }
    getMainWindow() {
        return this.mainWindow;
    }
    getIcon() {
        const iconPath = path_1.default.join(__dirname, '../../assets/icon.svg');
        try {
            const icon = electron_1.nativeImage.createFromPath(iconPath);
            if (!icon.isEmpty())
                return icon;
        }
        catch { /* fallback */ }
        return electron_1.nativeImage.createEmpty();
    }
    cleanup() {
        electron_1.globalShortcut.unregisterAll();
        this.tray?.destroy();
        this.orbWindow?.close();
        this.widgetWindow?.close();
    }
}
exports.WindowManager = WindowManager;
exports.windowManager = new WindowManager();
//# sourceMappingURL=window-manager.js.map