import type { CommandResult } from '../../shared/types';
export declare class CommandProcessor {
    process(text: string): Promise<CommandResult>;
    private matchAction;
    private extractAfter;
    private inferTaskType;
}
export declare const commandProcessor: CommandProcessor;
//# sourceMappingURL=command-processor.d.ts.map