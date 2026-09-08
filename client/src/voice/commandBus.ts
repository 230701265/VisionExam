import type { CommandId, ParsedVoiceCommand } from './types';

export type VoiceCommandHandler = (command: ParsedVoiceCommand) => void;

/**
 * The single dispatch point between recognized speech and application actions.
 * UI adapters register one scoped handler; recognition never calls page actions directly.
 */
export class VoiceCommandBus {
  private handlers = new Map<CommandId, VoiceCommandHandler>();

  register(commandId: CommandId, handler: VoiceCommandHandler) {
    this.handlers.set(commandId, handler);
    return () => this.handlers.delete(commandId);
  }

  dispatch(command: ParsedVoiceCommand) {
    this.handlers.get(command.definition.id)?.(command);
  }

  clear() {
    this.handlers.clear();
  }
}