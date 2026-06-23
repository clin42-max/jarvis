"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationEngine = exports.AutomationEngine = void 0;
const settings_service_1 = require("./settings-service");
const system_service_1 = require("./system-service");
const ai_service_1 = require("./ai-service");
const encryption_1 = require("../security/encryption");
class AutomationEngine {
    scheduledJobs = new Map();
    batteryCheckInterval = null;
    initialize() {
        this.runStartupWorkflows();
        this.setupSchedules();
        this.startBatteryMonitor();
    }
    runStartupWorkflows() {
        const workflows = settings_service_1.workflowService.getEnabled();
        for (const workflow of workflows) {
            if (workflow.trigger.type === 'startup') {
                this.executeWorkflow(workflow).catch(console.error);
            }
        }
    }
    setupSchedules() {
        const workflows = settings_service_1.workflowService.getEnabled();
        for (const workflow of workflows) {
            if (workflow.trigger.type === 'schedule') {
                this.scheduleWorkflow(workflow);
            }
        }
    }
    scheduleWorkflow(workflow) {
        const config = workflow.trigger.config;
        const cronExpression = config.cron;
        const intervalMs = config.intervalMs;
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
                const [hours, minutes] = config.time.split(':').map(Number);
                if (now.getHours() === hours && now.getMinutes() === minutes) {
                    this.executeWorkflow(workflow).catch(console.error);
                }
            };
            const job = setInterval(checkSchedule, 60000);
            this.scheduledJobs.set(workflow.id, job);
        }
    }
    startBatteryMonitor() {
        this.batteryCheckInterval = setInterval(async () => {
            const stats = await system_service_1.systemService.getStats();
            if (stats.battery && stats.battery.percent < 15 && !stats.battery.charging) {
                const workflows = settings_service_1.workflowService.getEnabled();
                for (const workflow of workflows) {
                    if (workflow.trigger.type === 'battery') {
                        const threshold = workflow.trigger.config.threshold ?? 15;
                        if (stats.battery.percent <= threshold) {
                            await this.executeWorkflow(workflow);
                        }
                    }
                }
            }
        }, 60000);
    }
    async executeWorkflow(workflow) {
        console.log(`Executing workflow: ${workflow.name}`);
        for (const action of workflow.actions) {
            await this.executeAction(action);
        }
    }
    async executeAction(action) {
        switch (action.type) {
            case 'launch':
                await system_service_1.systemService.launchApp(action.config.app);
                break;
            case 'close':
                await system_service_1.systemService.closeApp(action.config.app);
                break;
            case 'speak':
                // Speech handled via renderer IPC event
                break;
            case 'notify':
                // Notification handled via notification service
                break;
            case 'command':
                await system_service_1.systemService.execute(action.config.command);
                break;
            case 'ai': {
                const prompt = action.config.prompt;
                if (prompt)
                    await ai_service_1.aiService.chat(prompt);
                break;
            }
            case 'delay':
                await new Promise((r) => setTimeout(r, action.config.ms ?? 1000));
                break;
        }
    }
    async runById(id) {
        const workflows = settings_service_1.workflowService.getAll();
        const workflow = workflows.find((w) => w.id === id);
        if (workflow)
            await this.executeWorkflow(workflow);
    }
    createDefaultWorkflows() {
        const existing = settings_service_1.workflowService.getAll();
        if (existing.length > 0)
            return;
        const morningBriefing = {
            id: (0, encryption_1.generateId)(),
            name: 'Morning Briefing',
            trigger: { type: 'schedule', config: { time: '08:00' } },
            actions: [
                { type: 'ai', config: { prompt: 'Give me a brief morning briefing including the date, time, and an inspirational quote.' } },
                { type: 'speak', config: { text: 'Good morning sir. Here is your briefing.' } },
            ],
            enabled: false,
            createdAt: new Date().toISOString(),
        };
        const lowBattery = {
            id: (0, encryption_1.generateId)(),
            name: 'Low Battery Alert',
            trigger: { type: 'battery', config: { threshold: 15 } },
            actions: [
                { type: 'notify', config: { title: 'Low Battery', body: 'Battery below 15%. Consider charging, sir.' } },
                { type: 'speak', config: { text: 'Sir, your battery is critically low.' } },
            ],
            enabled: true,
            createdAt: new Date().toISOString(),
        };
        settings_service_1.workflowService.save(morningBriefing);
        settings_service_1.workflowService.save(lowBattery);
    }
    shutdown() {
        for (const job of this.scheduledJobs.values())
            clearInterval(job);
        this.scheduledJobs.clear();
        if (this.batteryCheckInterval)
            clearInterval(this.batteryCheckInterval);
    }
}
exports.AutomationEngine = AutomationEngine;
exports.automationEngine = new AutomationEngine();
//# sourceMappingURL=automation-engine.js.map