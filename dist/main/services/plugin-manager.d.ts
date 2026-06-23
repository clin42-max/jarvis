import type { PluginManifest } from '../../shared/types';
export interface PluginHandler {
    (args: string[]): Promise<string>;
}
export declare class PluginManager {
    private plugins;
    private pluginsDir;
    constructor();
    initialize(): Promise<void>;
    private registerBuiltInPlugins;
    private loadInstalledPlugins;
    getAll(): PluginManifest[];
    enable(id: string): void;
    disable(id: string): void;
    matchCommand(text: string): {
        pluginId: string;
        handler: string;
    } | null;
    getSDKReadme(): string;
}
export declare const pluginManager: PluginManager;
//# sourceMappingURL=plugin-manager.d.ts.map