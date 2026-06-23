import type { Workflow, WorkflowAction } from '../../shared/types';
import { workflowService } from './settings-service';
import { systemService } from './system-service';
import { aiService } from './ai-service';
import { generateId } from '../security/encryption';

export class AutomationEngine {
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private batteryCheckInterval: NodeJS.Timeout | null = null;

  initialize(): void {
    this.runStartupWorkflows();
    this.setupSchedules();
    this.startBatteryMonitor();
  }

  private runStartupWorkflows(): void {
    const workflows = workflowService.getEnabled();
    for (const workflow of workflows) {
      if (workflow.trigger.type === 'startup') {
        this.executeWorkflow(workflow).catch(console.error);
      }
    }
  }

  private setupSchedules(): void {
    const workflows = workflowService.getEnabled();
    for (const workflow of workflows) {
      if (workflow.trigger.type === 'schedule') {
        this.scheduleWorkflow(workflow);
      }
    }
  }

  private scheduleWorkflow(workflow: Workflow): void {
    const config = workflow.trigger.config;
    const cronExpression = config.cron as string | undefined;
    const intervalMs = config.intervalMs as number | undefined;

    if (intervalMs) {
      const job = setInterval(() => {
        this.executeWorkflow(workflow).catch(console.error);
      }, intervalMs);
      this.scheduledJobs.set(workflow.id, job);
    }

    // Simple time-based scheduling (e.g., "every morning at 8")
    if (config.time && typeof config.time === 'string') {
      const checkSchedule = () => {
        const now = new Date();
        const [hours, minutes] = (config.time as string).split(':').map(Number);
        if (now.getHours() === hours && now.getMinutes() === minutes) {
          this.executeWorkflow(workflow).catch(console.error);
        }
      };
      const job = setInterval(checkSchedule, 60000);
      this.scheduledJobs.set(workflow.id, job);
    }
  }

  private startBatteryMonitor(): void {
    this.batteryCheckInterval = setInterval(async () => {
      const stats = await systemService.getStats();
      if (stats.battery && stats.battery.percent < 15 && !stats.battery.charging) {
        const workflows = workflowService.getEnabled();
        for (const workflow of workflows) {
          if (workflow.trigger.type === 'battery') {
            const threshold = (workflow.trigger.config.threshold as number) ?? 15;
            if (stats.battery.percent <= threshold) {
              await this.executeWorkflow(workflow);
            }
          }
        }
      }
    }, 60000);
  }

  async executeWorkflow(workflow: Workflow): Promise<void> {
    console.log(`Executing workflow: ${workflow.name}`);
    for (const action of workflow.actions) {
      await this.executeAction(action);
    }
  }

  private async executeAction(action: WorkflowAction): Promise<void> {
    switch (action.type) {
      case 'launch':
        await systemService.launchApp(action.config.app as string);
        break;
      case 'close':
        await systemService.closeApp(action.config.app as string);
        break;
      case 'speak':
        // Speech handled via renderer IPC event
        break;
      case 'notify':
        // Notification handled via notification service
        break;
      case 'command':
        await systemService.execute(action.config.command as string);
        break;
      case 'ai': {
        const prompt = action.config.prompt as string;
        if (prompt) await aiService.chat(prompt);
        break;
      }
      case 'delay':
        await new Promise((r) => setTimeout(r, (action.config.ms as number) ?? 1000));
        break;
    }
  }

  async runById(id: string): Promise<void> {
    const workflows = workflowService.getAll();
    const workflow = workflows.find((w) => w.id === id);
    if (workflow) await this.executeWorkflow(workflow);
  }

  createDefaultWorkflows(): void {
    const existing = workflowService.getAll();
    if (existing.length > 0) return;

    const morningBriefing: Workflow = {
      id: generateId(),
      name: 'Morning Briefing',
      trigger: { type: 'schedule', config: { time: '08:00' } },
      actions: [
        { type: 'ai', config: { prompt: 'Give me a brief morning briefing including the date, time, and an inspirational quote.' } },
        { type: 'speak', config: { text: 'Good morning sir. Here is your briefing.' } },
      ],
      enabled: false,
      createdAt: new Date().toISOString(),
    };

    const lowBattery: Workflow = {
      id: generateId(),
      name: 'Low Battery Alert',
      trigger: { type: 'battery', config: { threshold: 15 } },
      actions: [
        { type: 'notify', config: { title: 'Low Battery', body: 'Battery below 15%. Consider charging, sir.' } },
        { type: 'speak', config: { text: 'Sir, your battery is critically low.' } },
      ],
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    workflowService.save(morningBriefing);
    workflowService.save(lowBattery);
  }

  shutdown(): void {
    for (const job of this.scheduledJobs.values()) clearInterval(job);
    this.scheduledJobs.clear();
    if (this.batteryCheckInterval) clearInterval(this.batteryCheckInterval);
  }
}

export const automationEngine = new AutomationEngine();
