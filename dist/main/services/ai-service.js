"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const settings_service_1 = require("./settings-service");
const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini'],
        headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
        formatRequest: (model, messages, settings) => ({
            model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
        }),
        parseResponse: (data) => data.choices[0].message.content,
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
        parseResponse: (data) => data.content[0].text,
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
        parseResponse: (data) => data.candidates[0].content.parts[0].text,
    },
    grok: {
        name: 'Grok',
        baseUrl: 'https://api.x.ai/v1/chat/completions',
        models: ['grok-2', 'grok-2-mini'],
        headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
        formatRequest: (model, messages, settings) => ({
            model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
        }),
        parseResponse: (data) => data.choices[0].message.content,
    },
    deepseek: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1/chat/completions',
        models: ['deepseek-chat', 'deepseek-reasoner'],
        headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
        formatRequest: (model, messages, settings) => ({
            model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
        }),
        parseResponse: (data) => data.choices[0].message.content,
    },
    perplexity: {
        name: 'Perplexity',
        baseUrl: 'https://api.perplexity.ai/chat/completions',
        models: ['sonar', 'sonar-pro', 'sonar-reasoning'],
        headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
        formatRequest: (model, messages, settings) => ({
            model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
        }),
        parseResponse: (data) => data.choices[0].message.content,
    },
    mistral: {
        name: 'Mistral',
        baseUrl: 'https://api.mistral.ai/v1/chat/completions',
        models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'codestral-latest'],
        headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
        formatRequest: (model, messages, settings) => ({
            model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
        }),
        parseResponse: (data) => data.choices[0].message.content,
    },
    ollama: {
        name: 'Ollama',
        baseUrl: 'http://localhost:11434/api/chat',
        models: ['llama3.2', 'mistral', 'codellama', 'phi3'],
        headers: () => ({ 'Content-Type': 'application/json' }),
        formatRequest: (model, messages) => ({ model, messages, stream: false }),
        parseResponse: (data) => data.message.content,
    },
    lmstudio: {
        name: 'LM Studio',
        baseUrl: 'http://localhost:1234/v1/chat/completions',
        models: ['local-model'],
        headers: () => ({ 'Content-Type': 'application/json' }),
        formatRequest: (model, messages, settings) => ({
            model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
        }),
        parseResponse: (data) => data.choices[0].message.content,
    },
    custom: {
        name: 'Custom API',
        baseUrl: '',
        models: ['custom-model'],
        headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
        formatRequest: (model, messages, settings) => ({
            model, messages, temperature: settings.temperature, max_tokens: settings.maxTokens,
        }),
        parseResponse: (data) => data.choices[0].message.content,
    },
};
const JARVIS_SYSTEM_PROMPT = `You are JARVIS (Just A Rather Very Intelligent System), a sophisticated AI desktop assistant inspired by Iron Man's AI. 
You are helpful, witty, and professional. Address the user as "sir" or "ma'am" when appropriate.
Keep responses concise (2-4 sentences) unless asked for detail.
You have access to the user's computer and can help with system tasks, productivity, research, and automation.`;
class AIService {
    stats = {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        status: 'idle',
    };
    getStats() {
        return { ...this.stats };
    }
    getProviderModels(provider) {
        return PROVIDERS[provider]?.models ?? [];
    }
    getAllProviders() {
        return Object.entries(PROVIDERS).map(([id, config]) => ({
            id: id,
            name: config.name,
            models: config.models,
        }));
    }
    resolveModel(taskType) {
        const settings = settings_service_1.settingsService.getAISettings();
        if (taskType && settings.taskModelMap[taskType]) {
            const model = settings.taskModelMap[taskType];
            const provider = this.findProviderForModel(model) ?? settings.activeProvider;
            return { provider, model };
        }
        return { provider: settings.activeProvider, model: settings.activeModel };
    }
    findProviderForModel(model) {
        for (const [provider, config] of Object.entries(PROVIDERS)) {
            if (config.models.includes(model))
                return provider;
        }
        return null;
    }
    async chat(userMessage, taskType) {
        const settings = settings_service_1.settingsService.getAISettings();
        const { provider, model } = this.resolveModel(taskType);
        const config = PROVIDERS[provider];
        const apiKey = settings.apiKeys[provider];
        if (!apiKey && provider !== 'ollama' && provider !== 'lmstudio') {
            return this.fallbackResponse(userMessage);
        }
        this.stats = { provider, model, status: 'processing' };
        const startTime = Date.now();
        try {
            const memories = settings_service_1.memoryService.search(userMessage).slice(0, 5);
            const memoryContext = memories.length > 0
                ? `\nRelevant memories:\n${memories.map((m) => `- ${m.key}: ${m.value}`).join('\n')}`
                : '';
            const history = settings_service_1.chatService.getHistory(10).reverse();
            const messages = [
                { role: 'system', content: JARVIS_SYSTEM_PROMPT + memoryContext },
                ...history.map((h) => ({ role: h.role, content: h.content })),
                { role: 'user', content: userMessage },
            ];
            let url = config.baseUrl;
            if (provider === 'gemini') {
                url = `${config.baseUrl}/${model}:generateContent?key=${apiKey}`;
            }
            else if (provider === 'custom' && settings.customApiUrl) {
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
            settings_service_1.chatService.saveMessage({ role: 'user', content: userMessage, provider, model });
            settings_service_1.chatService.saveMessage({ role: 'assistant', content: text, provider, model });
            return text;
        }
        catch (error) {
            this.stats = { provider, model, status: 'error' };
            console.error('AI chat error:', error);
            return this.fallbackResponse(userMessage);
        }
    }
    fallbackResponse(message) {
        const cmd = message.toLowerCase();
        if (cmd.includes('hello') || cmd.includes('hi'))
            return 'Hello sir, JARVIS at your service. How may I assist you?';
        if (cmd.includes('time'))
            return `It is ${new Date().toLocaleTimeString()}, sir.`;
        if (cmd.includes('date'))
            return `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}, sir.`;
        if (cmd.includes('help'))
            return 'I can assist with system control, web searches, productivity tasks, and more. Configure an AI provider in Settings for enhanced capabilities, sir.';
        if (cmd.includes('name'))
            return 'I am JARVIS — Just A Rather Very Intelligent System, sir.';
        if (cmd.includes('how are you'))
            return 'All systems operational, sir. Ready to assist.';
        return 'I apologize sir, but I need an API key configured to process that request. Please add your AI provider credentials in Settings.';
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
//# sourceMappingURL=ai-service.js.map