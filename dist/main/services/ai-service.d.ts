import type { AIProvider, TaskType, AIStats } from '../../shared/types';
export declare class AIService {
    private stats;
    getStats(): AIStats;
    getProviderModels(provider: AIProvider): string[];
    getAllProviders(): {
        id: AIProvider;
        name: string;
        models: string[];
    }[];
    resolveModel(taskType?: TaskType): {
        provider: AIProvider;
        model: string;
    };
    private findProviderForModel;
    chat(userMessage: string, taskType?: TaskType): Promise<string>;
    private fallbackResponse;
}
export declare const aiService: AIService;
//# sourceMappingURL=ai-service.d.ts.map