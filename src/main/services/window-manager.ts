import { BrowserWindow, Tray, Menu, nativeImage, globalShortcut, screen, app } from 'electron';
import path from 'path';
import type { HideMode } from '../../shared/types';
import { settingsService } from './settings-service';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private orbWindow: BrowserWindow | null = null;
  private widgetWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private currentMode: HideMode = 'none';

  createMainWindow(): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.mainWindow = new BrowserWindow({
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
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
      icon: this.getIcon(),
    });

    const rendererPath = path.join(__dirname, '../renderer/index.html');
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173');
    } else {
      this.mainWindow.loadFile(rendererPath);
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('close', (e) => {
      const settings = settingsService.getAppSettings();
      if (settings.minimizeToTray) {
        e.preventDefault();
        this.hide('quick');
      }
    });

    return this.mainWindow;
  }

  createTray(): void {
    const icon = this.getIcon();
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
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
      { label: 'Restart', click: () => { app.relaunch(); app.exit(0); } },
      { label: 'Exit', click: () => app.quit() },
    ]);

    this.tray.setToolTip('JARVIS - AI Assistant');
    this.tray.setContextMenu(contextMenu);
    this.tray.on('double-click', () => this.show());
  }

  registerHotkeys(): void {
    const settings = settingsService.getAppSettings();

    globalShortcut.register(settings.hotkeys.showHide, () => {
      if (this.currentMode === 'none' && this.mainWindow?.isVisible()) {
        this.hide('quick');
      } else {
        this.show();
      }
    });
  }

  hide(mode: HideMode = 'quick'): void {
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

    settingsService.saveAppSettings({ hideMode: mode });
  }

  show(): void {
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

    settingsService.saveAppSettings({ hideMode: 'none' });
  }

  setMode(mode: HideMode): void {
    if (mode === 'none') {
      this.show();
    } else {
      this.hide(mode);
    }
  }

  getMode(): HideMode {
    return this.currentMode;
  }

  minimize(): void {
    this.mainWindow?.minimize();
  }

  private createOrbWindow(): void {
    if (this.orbWindow) return;

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.orbWindow = new BrowserWindow({
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
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const orbPath = path.join(__dirname, '../renderer/orb.html');
    if (process.env.NODE_ENV === 'development') {
      this.orbWindow.loadURL('http://localhost:5173/orb.html');
    } else {
      this.orbWindow.loadFile(orbPath);
    }

    this.orbWindow.on('closed', () => { this.orbWindow = null; });
  }

  private createWidgetWindow(): void {
    if (this.widgetWindow) return;

    const { width } = screen.getPrimaryDisplay().workAreaSize;

    this.widgetWindow = new BrowserWindow({
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
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const widgetPath = path.join(__dirname, '../renderer/widget.html');
    if (process.env.NODE_ENV === 'development') {
      this.widgetWindow.loadURL('http://localhost:5173/widget.html');
    } else {
      this.widgetWindow.loadFile(widgetPath);
    }

    this.widgetWindow.on('closed', () => { this.widgetWindow = null; });
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  private getIcon(): Electron.NativeImage {
    const iconPath = path.join(__dirname, '../../assets/icon.svg');
    try {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) return icon;
    } catch { /* fallback */ }
    return nativeImage.createEmpty();
  }

  cleanup(): void {
    globalShortcut.unregisterAll();
    this.tray?.destroy();
    this.orbWindow?.close();
    this.widgetWindow?.close();
  }
}

export const windowManager = new WindowManager();
