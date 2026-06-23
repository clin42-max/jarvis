# JARVIS Developer Guide

## Development Setup

```bash
git clone <repo>
cd jarvis
npm install
npm run dev
```

This starts Vite dev server (renderer), TypeScript watch (main), and Electron.

## Adding a New AI Provider

1. Add provider type to `src/shared/types.ts`:
```typescript
export type AIProvider = ... | 'newprovider';
```

2. Add config in `src/main/services/ai-service.ts`:
```typescript
newprovider: {
  name: 'New Provider',
  baseUrl: 'https://api.example.com/v1/chat/completions',
  models: ['model-1', 'model-2'],
  headers: (key) => ({ Authorization: `Bearer ${key}` }),
  formatRequest: (model, messages, settings) => ({ model, messages }),
  parseResponse: (data) => data.choices[0].message.content,
}
```

3. Add option to settings UI in `src/renderer/index.html`.

## Adding IPC Channels

1. Define channel in `src/shared/types.ts` → `IPC` object
2. Add handler in `src/main/ipc/handlers.ts`
3. Expose in `src/main/preload.ts`
4. Add to `JarvisAPI` interface in types

## Adding Commands

Edit `src/main/services/command-processor.ts`:

```typescript
const COMMAND_PATTERNS = {
  mycommand: ['trigger phrase', 'another phrase'],
};

// In process() switch:
case 'mycommand':
  return { success: true, response: 'Done, sir.', action: 'mycommand' };
```

## Building Plugins

See [Plugin SDK](PLUGIN_SDK.md).

## Testing

```bash
npm run build    # Compile TypeScript + Vite
npm start        # Run production build
npm run pack     # Package without installer
npm run dist:win # Full Windows installer
```

## Code Style

- TypeScript strict mode
- Services as singletons exported from `services/`
- IPC channels as constants in shared types
- Renderer uses `window.jarvis` API only (no direct Node access)

## Debugging

- Main process: `electron --inspect` or DevTools from tray
- Renderer: `Ctrl+Shift+I` in dev mode
- Database: Open `jarvis.db` with any SQLite browser
