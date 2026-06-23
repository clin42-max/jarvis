import type { Workflow } from '../../shared/types';
export declare class AutomationEngine {
    private scheduledJobs;
    private batteryCheckInterval;
    initialize(): void;
    private runStartupWorkflows;
    private setupSchedules;
    private scheduleWorkflow;
    private startBatteryMonitor;
    executeWorkflow(workflow: Workflow): Promise<void>;
    private executeAction;
    runById(id: string): Promise<void>;
    createDefaultWorkflows(): void;
    shutdown(): void;
}
export declare const automationEngine: AutomationEngine;
//# sourceMappingURL=automation-engine.d.ts.map