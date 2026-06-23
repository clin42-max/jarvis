import type { AIProvider, AISettings, TaskType, AIStats } from '../../shared/types';
import { settingsService, memoryService, chatService } from './settings-service';
import { generateId } from '../security/encryption';

interface ProviderConfig {
  name: string;
  baseUrl: string;
  models: string[];
  headers: (apiKey: string) => Record<string, string>;
  formatRequest: (model: string, messages: ChatMessage[], settings: AISettings) => unknown;
  parseResponse: (data: unknown) => string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini'],
    headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    formatRequest: (model, messages, settings) => ({
      model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
    }),
    parseResponse: (data) => (data as { choices: { message: { content: string } }[] }).choices[0].message.content,
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    headers: (key) => ({
      'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json',
    }),
    formatRequest: (model, messages, settings) => ({
      model, max_tokens: settings.maxTokens,
      messages: messages.filter((m) => m.role !== 'system'),
      system: messages.find((m) => m.role === 'system')?.content,
    }),
    parseResponse: (data) => (data as { content: { text: string }[] }).content[0].text,
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    headers: () => ({ 'Content-Type': 'application/json' }),
    formatRequest: (model, messages) => ({
      contents: messages.filter((m) => m.role !== 'system').map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    }),
    parseResponse: (data) => (data as { candidates: { content: { parts: { text: string }[] } }[] }).candidates[0].content.parts[0].text,
  },
  grok: {
    name: 'Grok',
    baseUrl: 'https://api.x.ai/v1/chat/completions',
    models: ['grok-2', 'grok-2-mini'],
    headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    formatRequest: (model, messages, settings) => ({
      model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
    }),
    parseResponse: (data) => (data as { choices: { message: { content: string } }[] }).choices[0].message.content,
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    formatRequest: (model, messages, settings) => ({
      model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
    }),
    parseResponse: (data) => (data as { choices: { message: { content: string } }[] }).choices[0].message.content,
  },
  perplexity: {
    name: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai/chat/completions',
    models: ['sonar', 'sonar-pro', 'sonar-reasoning'],
    headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    formatRequest: (model, messages, settings) => ({
      model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
    }),
    parseResponse: (data) => (data as { choices: { message: { content: string } }[] }).choices[0].message.content,
  },
  mistral: {
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'codestral-latest'],
    headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    formatRequest: (model, messages, settings) => ({
      model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
    }),
    parseResponse: (data) => (data as { choices: { message: { content: string } }[] }).choices[0].message.content,
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/api/chat',
    models: ['llama3.2', 'mistral', 'codellama', 'phi3'],
    headers: () => ({ 'Content-Type': 'application/json' }),
    formatRequest: (model, messages) => ({ model, messages, stream: false }),
    parseResponse: (data) => (data as { message: { content: string } }).message.content,
  },
  lmstudio: {
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1/chat/completions',
    models: ['local-model'],
    headers: () => ({ 'Content-Type': 'application/json' }),
    formatRequest: (model, messages, settings) => ({
      model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
    }),
    parseResponse: (data) => (data as { choices: { message: { content: string } }[] }).choices[0].message.content,
  },
  custom: {
    name: 'Custom API',
    baseUrl: '',
    models: ['custom-model'],
    headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    formatRequest: (model, messages, settings) => ({
      model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
    }),
    parseResponse: (data) => (data as { choices: { message: { content: string } }[] }).choices[0].message.content,
  },
};

const JARVIS_SYSTEM_PROMPT = `You are JARVIS (Just A Rather Very Intelligent System), a sophisticated AI desktop assistant inspired by Iron Man's AI. 
You are helpful, witty, and professional. Address the user as "sir" or "ma'am" when appropriate.
Keep responses concise (2-4 sentences) unless asked for detail.
You have access to the user's computer and can help with system tasks, productivity, research, and automation.`;

export class AIService {
  private stats: AIStats = {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    status: 'idle',
  };

  getStats(): AIStats {
    return { ...this.stats };
  }

  getProviderModels(provider: AIProvider): string[] {
    return PROVIDERS[provider]?.models ?? [];
  }

  getAllProviders(): { id: AIProvider; name: string; models: string[] }[] {
    return Object.entries(PROVIDERS).map(([id, config]) => ({
      id: id as AIProvider,
      name: config.name,
      models: config.models,
    }));
  }

  resolveModel(taskType?: TaskType): { provider: AIProvider; model: string } {
    const settings = settingsService.getAISettings();

    if (taskType && settings.taskModelMap[taskType]) {
      const model = settings.taskModelMap[taskType]!;
      const provider = this.findProviderForModel(model) ?? settings.activeProvider;
      return { provider, model };
    }

    return { provider: settings.activeProvider, model: settings.activeModel };
  }

  private findProviderForModel(model: string): AIProvider | null {
    for (const [provider, config] of Object.entries(PROVIDERS)) {
      if (config.models.includes(model)) return provider as AIProvider;
    }
    return null;
  }

  async chat(userMessage: string, taskType?: TaskType): Promise<string> {
    const settings = settingsService.getAISettings();
    const { provider, model } = this.resolveModel(taskType);
    const config = PROVIDERS[provider];

    const apiKey = settings.apiKeys[provider];
    if (!apiKey && provider !== 'ollama' && provider !== 'lmstudio') {
      return this.fallbackResponse(userMessage);
    }

    this.stats = { provider, model, status: 'processing' };
    const startTime = Date.now();

    try {
      const memories = memoryService.search(userMessage).slice(0, 5);
      const memoryContext = memories.length > 0
        ? `\nRelevant memories:\n${memories.map((m) => `- ${m.key}: ${m.value}`).join('\n')}`
        : '';

      const history = chatService.getHistory(10).reverse();
      const messages: ChatMessage[] = [
        { role: 'system', content: JARVIS_SYSTEM_PROMPT + memoryContext },
        ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user', content: userMessage },
      ];

      let url = config.baseUrl;
      if (provider === 'gemini') {
        url = `${config.baseUrl}/${model}:generateContent?key=${apiKey}`;
      } else if (provider === 'custom' && settings.customApiUrl) {
        url = settings.customApiUrl;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: config.headers(apiKey ?? ''),
        body: JSON.stringify(config.formatRequest(model, messages, settings)),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = config.parseResponse(data);

      const elapsed = Date.now() - startTime;
      this.stats = { provider, model, status: 'idle', lastResponseMs: elapsed };

      chatService.saveMessage({ role: 'user', content: userMessage, provider, model });
      chatService.saveMessage({ role: 'assistant', content: text, provider, model });

      return text;
    } catch (error) {
      this.stats = { provider, model, status: 'error' };
      console.error('AI chat error:', error);
      return this.fallbackResponse(userMessage);
    }
  }

  private fallbackResponse(message: string): string {
    const cmd = message.toLowerCase();

    if (cmd.includes('hello') || cmd.includes('hi')) return 'Hello sir, JARVIS at your service. How may I assist you?';
    if (cmd.includes('time')) return `It is ${new Date().toLocaleTimeString()}, sir.`;
    if (cmd.includes('date')) return `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}, sir.`;
    if (cmd.includes('help')) return 'I can assist with system control, web searches, productivity tasks, and more. Configure an AI provider in Settings for enhanced capabilities, sir.';
    if (cmd.includes('name')) return 'I am JARVIS — Just A Rather Very Intelligent System, sir.';
    if (cmd.includes('how are you')) return 'All systems operational, sir. Ready to assist.';

    return 'I apologize sir, but I need an API key configured to process that request. Please add your AI provider credentials in Settings.';
  }
}

export const aiService = new AIService();
