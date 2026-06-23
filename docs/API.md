# JARVIS API Reference

## Renderer API (`window.jarvis`)

All methods return Promises unless noted.

### AI

```typescript
jarvis.ai.chat(message: string, taskType?: TaskType): Promise<string>
jarvis.ai.getSettings(): Promise<AISettings>
jarvis.ai.saveSettings(settings: Partial<AISettings>): Promise<void>
jarvis.ai.getProfiles(): Promise<AIProfile[]>
jarvis.ai.saveProfile(profile: AIProfile): Promise<void>
jarvis.ai.deleteProfile(id: string): Promise<void>
jarvis.ai.getStats(): Promise<AIStats>
```

### Voice

```typescript
jarvis.voice.getSettings(): Promise<VoiceSettings>
jarvis.voice.saveSettings(settings: Partial<VoiceSettings>): Promise<void>
jarvis.voice.speak(text: string): Promise<void>
jarvis.voice.stop(): Promise<void>
```

### System

```typescript
jarvis.system.getStats(): Promise<SystemStats>
jarvis.system.launchApp(name: string): Promise<boolean>
jarvis.system.closeApp(name: string): Promise<boolean>
jarvis.system.openFile(path: string): Promise<boolean>
jarvis.system.searchFiles(query: string, directory?: string): Promise<string[]>
jarvis.system.execute(command: string): Promise<string>
jarvis.system.openUrl(url: string): Promise<void>
```

### Commands

```typescript
jarvis.command.process(text: string): Promise<CommandResult>
```

### Memory

```typescript
jarvis.memory.get(category?: string): Promise<MemoryEntry[]>
jarvis.memory.set(entry): Promise<MemoryEntry>
jarvis.memory.delete(id: string): Promise<void>
jarvis.memory.search(query: string): Promise<MemoryEntry[]>
```

### Chat

```typescript
jarvis.chat.getHistory(limit?: number): Promise<ChatMessage[]>
jarvis.chat.saveMessage(message): Promise<void>
jarvis.chat.clear(): Promise<void>
```

### Workflows

```typescript
jarvis.workflow.getAll(): Promise<Workflow[]>
jarvis.workflow.save(workflow: Workflow): Promise<void>
jarvis.workflow.delete(id: string): Promise<void>
jarvis.workflow.run(id: string): Promise<void>
```

### Window

```typescript
jarvis.window.hide(mode?: HideMode): Promise<void>
jarvis.window.show(): Promise<void>
jarvis.window.setMode(mode: HideMode): Promise<void>
jarvis.window.getMode(): Promise<HideMode>
jarvis.window.minimize(): Promise<void>
```

### Settings

```typescript
jarvis.settings.get(): Promise<AppSettings>
jarvis.settings.save(settings: Partial<AppSettings>): Promise<void>
```

### Plugins

```typescript
jarvis.plugin.getAll(): Promise<PluginManifest[]>
jarvis.plugin.enable(id: string): Promise<void>
jarvis.plugin.disable(id: string): Promise<void>
```

### Notifications

```typescript
jarvis.notify(payload: { title, body, priority, speak? }): Promise<void>
```

### Events

```typescript
const unsubscribe = jarvis.on(channel: string, callback: (...args) => void): () => void
```

#### Event Channels

| Channel | Payload | Direction |
|---------|---------|-----------|
| `event:system-stats` | `SystemStats` | Main → Renderer |
| `event:ai-status` | `AIStats` | Main → Renderer |
| `event:wake-word` | `string` | Main → Renderer |
| `voice:speak` | `string` | Main → Renderer |
| `voice:stop` | — | Main → Renderer |
| `notify:speak` | `string` | Main → Renderer |
| `tray:voice-on` | — | Main → Renderer |
| `tray:voice-off` | — | Main → Renderer |
| `navigate` | `string` | Main → Renderer |

## Types

See `src/shared/types.ts` for full TypeScript definitions.
