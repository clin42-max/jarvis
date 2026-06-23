# JARVIS Architecture

## Overview

JARVIS uses a secure Electron IPC architecture separating the main process (system access) from the renderer process (UI).

```
┌─────────────────────────────────────────────────────────┐
│                    Renderer Process                      │
│  ┌──────────┐  ┌───────────┐  ┌────────────────────┐  │
│  │ Jarvis UI│  │ Voice Eng │  │ Dashboard / Settings│  │
│  └────┬─────┘  └─────┬─────┘  └─────────┬──────────┘  │
│       │              │                     │             │
│       └──────────────┼─────────────────────┘             │
│                      │ preload.ts (contextBridge)        │
├──────────────────────┼───────────────────────────────────┤
│                      │ IPC Channels                      │
├──────────────────────┼───────────────────────────────────┤
│                    Main Process                          │
│  ┌──────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │ IPC      │  │ AI Service│  │ Command Processor  │   │
│  │ Handlers │  │ (Multi)   │  │ (200+ commands)    │   │
│  └────┬─────┘  └─────┬─────┘  └─────────┬──────────┘   │
│       │              │                     │              │
│  ┌────┴──────────────┴─────────────────────┴──────────┐  │
│  │              SQLite Database (jarvis.db)            │  │
│  │  settings │ memory │ chat │ workflows │ plugins    │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌──────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │ System   │  │ Automation│  │ Window Manager     │   │
│  │ Service  │  │ Engine    │  │ (hide/orb/widget)  │   │
│  └──────────┘  └───────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Process Separation

| Layer | Responsibility | Access |
|-------|---------------|--------|
| Renderer | UI, voice recognition, speech synthesis | Sandboxed, no Node.js |
| Preload | IPC bridge via contextBridge | Limited |
| Main | System ops, AI APIs, database, tray | Full Node.js + Electron |

## AI Provider Architecture

Each provider implements a common interface:

```
ProviderConfig {
  baseUrl, models, headers(), formatRequest(), parseResponse()
}
```

Task routing maps command types to optimal models:
- **Reasoning** → Claude
- **Coding** → GPT-4o
- **Research** → Gemini
- **Automation** → DeepSeek

## Voice Pipeline

```
Microphone → Browser SpeechRecognition → Wake Word Filter → Command Processor
                                                              ↓
                                                         AI Service (fallback)
                                                              ↓
                                                         Speech Synthesis → Speaker
```

## Hide Mode State Machine

```
[Full UI] ──hide──→ [Quick Hide] ──stealth──→ [Stealth]
    ↑                    │                        │
    │                    ├──orb──→ [Orb Window]  │
    │                    │                        │
    └──show/restore──────┴────widget──→ [Widget]─┘
```

## Security Model

- API keys encrypted with AES-256-GCM at rest
- Context isolation enabled (no nodeIntegration)
- Sandbox enabled on renderer
- Destructive commands require confirmation
- Path sanitization on file operations
- External navigation blocked in main window

## Auto-Update

Uses `electron-updater` with GitHub releases provider. Checks on startup in production builds.
