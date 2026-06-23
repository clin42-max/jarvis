# JARVIS Plugin SDK

## Overview

Plugins extend JARVIS with custom voice commands and integrations. Built-in plugins include Discord, Spotify, YouTube, GitHub, and Home Assistant.

## Plugin Structure

```
plugins/
└── my-plugin/
    ├── manifest.json
    └── index.js
```

## Manifest Format

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": "Your Name",
  "commands": [
    { "pattern": "my command phrase", "handler": "handleMyCommand" }
  ],
  "enabled": true
}
```

## Command Patterns

Patterns are matched as substring includes (case-insensitive). When a user says a phrase containing the pattern, the plugin handler is invoked.

## Built-in Plugin Commands

| Plugin | Pattern | Action |
|--------|---------|--------|
| Discord | "open discord" | Launch Discord |
| Spotify | "play music" | Media control |
| YouTube | "youtube" | YouTube search |
| GitHub | "github" | Open GitHub |
| Home Assistant | "turn on lights" | Smart home |

## Creating a Custom Plugin

1. Create folder in `%APPDATA%/jarvis-desktop/plugins/my-plugin/`
2. Write `manifest.json` with your commands
3. Restart JARVIS or enable in Settings → Plugins

## Plugin API (Future)

```javascript
// index.js
module.exports = {
  handleMyCommand: async (args, context) => {
    await context.launchApp('my-app');
    await context.speak('Done, sir.');
    return 'Command executed';
  }
};
```

## Enabling/Disabling

Use Settings → Plugins or IPC:
```typescript
await window.jarvis.plugin.enable('my-plugin');
await window.jarvis.plugin.disable('my-plugin');
```
