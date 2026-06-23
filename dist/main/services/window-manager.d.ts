import { BrowserWindow } from 'electron';
import type { HideMode } from '../../shared/types';
export declare class WindowManager {
    private mainWindow;
    private orbWindow;
    private widgetWindow;
    private tray;
    private currentMode;
    createMainWindow(): BrowserWindow;
    createTray(): void;
    registerHotkeys(): void;
    hide(mode?: HideMode): void;
    show(): void;
    setMode(mode: HideMode): void;
    getMode(): HideMode;
    minimize(): void;
    private createOrbWindow;
    private createWidgetWindow;
    getMainWindow(): BrowserWindow | null;
    private getIcon;
    cleanup(): void;
}
export declare const windowManager: WindowManager;
//# sourceMappingURL=window-manager.d.ts.map