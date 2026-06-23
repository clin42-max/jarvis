import type { SystemStats } from '../../shared/types';
export declare class SystemService {
    private cachedStats;
    private lastFetch;
    getStats(force?: boolean): Promise<SystemStats>;
    launchApp(name: string): Promise<boolean>;
    closeApp(name: string): Promise<boolean>;
    openFile(filePath: string): Promise<boolean>;
    openFolder(folderName: string): Promise<boolean>;
    searchFiles(query: string, directory?: string): Promise<string[]>;
    createFolder(name: string, parentDir?: string): Promise<string | null>;
    openUrl(url: string): Promise<void>;
    searchWeb(query: string, engine?: string): Promise<void>;
    execute(command: string): Promise<string>;
}
export declare const systemService: SystemService;
//# sourceMappingURL=system-service.d.ts.map