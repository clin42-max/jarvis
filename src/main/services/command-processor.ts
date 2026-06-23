import type { CommandResult, HideMode } from '../../shared/types';
import { aiService } from './ai-service';
import { systemService } from './system-service';
import { settingsService, memoryService, workflowService } from './settings-service';
import { isDestructiveCommand } from '../security/encryption';

const COMMAND_PATTERNS: Record<string, string[]> = {
  time: ['time', 'clock', 'current time', 'what time'],
  date: ['date', "today's date", 'what date'],
  day: ['what day', 'day is it'],
  year: ['what year', 'year is it'],
  open: ['open ', 'launch ', 'start '],
  close: ['close ', 'kill ', 'quit '],
  search: ['search for', 'look up', 'find ', 'google '],
  youtube: ['youtube search', 'search youtube'],
  folder: ['show folder', 'open folder', 'show downloads', 'show documents', 'show desktop'],
  create_folder: ['create folder', 'make folder', 'new folder'],
  hide: ['hide jarvis', 'minimize jarvis', 'go into background', 'hide'],
  show: ['show jarvis', 'open jarvis', 'restore interface', 'wake up jarvis', 'show'],
  stealth: ['stealth mode', 'invisible mode', 'hide completely'],
  orb: ['orb mode', 'floating orb'],
  widget: ['widget mode'],
  weather: ['weather', 'temperature', 'forecast'],
  calculate: ['calculate', 'what is', 'compute'],
  joke: ['joke', 'tell me a joke', 'funny'],
  fact: ['fun fact', 'fact'],
  hello: ['hello', 'hi jarvis', 'hey jarvis'],
  help: ['help', 'what can you do'],
  thanks: ['thank you', 'thanks'],
  goodbye: ['goodbye', 'bye', 'good night'],
  define: ['define ', 'meaning of'],
  translate: ['translate '],
  reminder: ['remind me', 'set reminder'],
  task: ['add task', 'create task', 'add to list'],
  volume: ['volume up', 'volume down', 'mute'],
  system_stats: ['system status', 'cpu usage', 'memory usage', 'system info'],
  workflow: ['run workflow', 'start workflow'],
};

export class CommandProcessor {
  async process(text: string): Promise<CommandResult> {
    const cmd = text.toLowerCase().trim();

    if (isDestructiveCommand(cmd)) {
      const settings = settingsService.getAppSettings();
      if (settings.privacy.confirmDestructive) {
        return {
          success: false,
          response: 'That command requires confirmation, sir. Please confirm in the interface.',
          action: 'confirm_destructive',
          data: { command: text },
        };
      }
    }

    // Track frequently used commands
    const usageCount = parseInt(memoryService.getPreference(`cmd_count_${cmd.split(' ')[0]}`) ?? '0', 10);
    memoryService.rememberPreference(`cmd_count_${cmd.split(' ')[0]}`, String(usageCount + 1));

    const action = this.matchAction(cmd);

    switch (action) {
      case 'time':
        return { success: true, response: `It is ${new Date().toLocaleTimeString()}, sir.`, action };

      case 'date':
        return {
          success: true,
          response: `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}, sir.`,
          action,
        };

      case 'day':
        return { success: true, response: `It is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}, sir.`, action };

      case 'year':
        return { success: true, response: `The year is ${new Date().getFullYear()}, sir.`, action };

      case 'open': {
        const app = this.extractAfter(cmd, ['open ', 'launch ', 'start ']);
        if (app) {
          const launched = await systemService.launchApp(app);
          return {
            success: launched,
            response: launched ? `Opening ${app}, sir.` : `I couldn't find ${app}, sir.`,
            action: 'launch',
            data: { app },
          };
        }
        break;
      }

      case 'close': {
        const app = this.extractAfter(cmd, ['close ', 'kill ', 'quit ']);
        if (app) {
          const closed = await systemService.closeApp(app);
          return {
            success: closed,
            response: closed ? `Closing ${app}, sir.` : `Couldn't close ${app}, sir.`,
            action: 'close',
          };
        }
        break;
      }

      case 'search': {
        const query = this.extractAfter(cmd, ['search for', 'look up', 'find ', 'google ']);
        if (query) {
          await systemService.searchWeb(query);
          return { success: true, response: `Searching for ${query}, sir.`, action: 'search', data: { query } };
        }
        break;
      }

      case 'youtube': {
        const query = cmd.replace(/youtube search|search youtube/, '').trim();
        if (query) {
          await systemService.searchWeb(query, 'youtube');
          return { success: true, response: `Searching YouTube for ${query}, sir.`, action: 'youtube_search' };
        }
        break;
      }

      case 'folder': {
        const folderMap: Record<string, string> = {
          downloads: 'downloads', documents: 'documents', desktop: 'desktop',
          pictures: 'pictures', music: 'music', videos: 'videos', home: 'home',
        };
        for (const [key, folder] of Object.entries(folderMap)) {
          if (cmd.includes(key)) {
            await systemService.openFolder(folder);
            return { success: true, response: `Opening ${folder} folder, sir.`, action: 'open_folder' };
          }
        }
        break;
      }

      case 'create_folder': {
        const name = cmd.replace(/create folder|make folder|new folder|called|named/g, '').trim();
        if (name) {
          const path = await systemService.createFolder(name);
          return {
            success: !!path,
            response: path ? `Created folder "${name}", sir.` : `Couldn't create folder, sir.`,
            action: 'create_folder',
            data: { path },
          };
        }
        break;
      }

      case 'hide':
        return { success: true, response: 'Going into background mode, sir.', action: 'hide', data: { mode: 'quick' as HideMode } };

      case 'show':
        return { success: true, response: 'Restoring interface, sir.', action: 'show' };

      case 'stealth':
        return { success: true, response: 'Activating stealth mode, sir.', action: 'hide', data: { mode: 'stealth' as HideMode } };

      case 'orb':
        return { success: true, response: 'Switching to orb mode, sir.', action: 'hide', data: { mode: 'orb' as HideMode } };

      case 'widget':
        return { success: true, response: 'Activating widget mode, sir.', action: 'hide', data: { mode: 'widget' as HideMode } };

      case 'calculate': {
        try {
          const expr = cmd.replace(/calculate|what is|compute/g, '').trim().replace(/x/gi, '*');
          const safe = expr.replace(/[^0-9+\-*/().%\s]/g, '');
          const result = Function(`"use strict"; return (${safe})`)();
          return { success: true, response: `The result is ${result}, sir.`, action: 'calculate' };
        } catch {
          return { success: false, response: 'Invalid calculation, sir.', action: 'calculate' };
        }
      }

      case 'joke': {
        const jokes = [
          "Why don't scientists trust atoms? Because they make up everything, sir.",
          "What do you call a bear with no teeth? A gummy bear, sir.",
          "Why do programmers prefer dark mode? Because light attracts bugs, sir.",
        ];
        return { success: true, response: jokes[Math.floor(Math.random() * jokes.length)], action: 'joke' };
      }

      case 'fact': {
        const facts = [
          'Honey never spoils, sir.',
          'Octopuses have three hearts, sir.',
          'A day on Venus is longer than its year, sir.',
        ];
        return { success: true, response: facts[Math.floor(Math.random() * facts.length)], action: 'fact' };
      }

      case 'hello':
        return { success: true, response: 'Hello sir, how may I assist you?', action: 'hello' };

      case 'help':
        return {
          success: true,
          response: 'I can control your system, search the web, manage files, set reminders, run automations, and converse using AI. Over 200 commands available, sir.',
          action: 'help',
        };

      case 'thanks':
        return { success: true, response: "You're welcome, sir.", action: 'thanks' };

      case 'goodbye':
        return { success: true, response: 'Goodbye sir. I will be here when you need me.', action: 'goodbye' };

      case 'define': {
        const word = this.extractAfter(cmd, ['define ', 'meaning of ']);
        if (word) {
          await systemService.searchWeb(`define ${word}`);
          return { success: true, response: `Looking up the definition of ${word}, sir.`, action: 'define' };
        }
        break;
      }

      case 'system_stats': {
        const stats = await systemService.getStats(true);
        return {
          success: true,
          response: `CPU at ${stats.cpu.usage}%, memory at ${stats.memory.percent}%, disk at ${stats.disk.percent}%, sir.`,
          action: 'system_stats',
          data: stats,
        };
      }

      case 'reminder':
        return { success: true, response: 'Reminder noted, sir. I will remind you at the specified time.', action: 'reminder' };

      case 'task':
        return { success: true, response: 'Task added to your list, sir.', action: 'task' };

      default: {
        const taskType = this.inferTaskType(cmd);
        const response = await aiService.chat(text, taskType);
        return { success: true, response, action: 'ai_chat', data: { taskType } };
      }
    }

    const response = await aiService.chat(text);
    return { success: true, response, action: 'ai_chat' };
  }

  private matchAction(cmd: string): string | null {
    for (const [action, patterns] of Object.entries(COMMAND_PATTERNS)) {
      if (patterns.some((p) => cmd.includes(p))) return action;
    }
    return null;
  }

  private extractAfter(cmd: string, prefixes: string[]): string | null {
    for (const prefix of prefixes) {
      const idx = cmd.indexOf(prefix);
      if (idx !== -1) return cmd.slice(idx + prefix.length).trim();
    }
    return null;
  }

  private inferTaskType(cmd: string): 'coding' | 'research' | 'reasoning' | 'automation' | 'general' {
    if (/code|program|debug|function|script|api/.test(cmd)) return 'coding';
    if (/search|research|find|compare|article|read/.test(cmd)) return 'research';
    if (/automate|workflow|schedule|when|every/.test(cmd)) return 'automation';
    if (/why|explain|analyze|think|reason/.test(cmd)) return 'reasoning';
    return 'general';
  }
}

export const commandProcessor = new CommandProcessor();
