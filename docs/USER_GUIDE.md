# JARVIS User Guide

## Getting Started

1. **Install** JARVIS using the installer for your platform
2. **Launch** from Start Menu / Applications / Desktop shortcut
3. **Configure** AI provider in Settings → AI Provider
4. **Activate** voice by clicking the Voice button or saying "Hey Jarvis"

## Interface Overview

### Core View
The main JARVIS interface with animated avatar, voice controls, transcript, and command reference.

- **Activate** — Start/stop listening
- **Voice** — Toggle wake word mode
- **Hide** — Minimize to system tray
- **Orb** — Switch to floating orb
- **Stealth** — Invisible mode (no taskbar)
- **Widget** — Mini HUD overlay

### Dashboard
Real-time monitoring of AI status, CPU/RAM/Disk/Battery, running applications, and assistant state.

### Automation
Create and manage workflow automations triggered by startup, schedule, battery level, or voice commands.

### Settings
Configure AI providers, voice, themes, hotkeys, and plugins.

## Voice Commands

### System
- "Open Chrome" / "Launch VS Code" / "Open Discord"
- "Close Spotify"
- "Show Downloads folder"
- "Create folder called Work"
- "System status"

### Web
- "Search for [topic]"
- "YouTube search [query]"
- "Open Google" / "Open YouTube"

### Productivity
- "What time is it"
- "Set reminder to [task]"
- "Add task [description]"

### JARVIS Control
- "Hide Jarvis" / "Show Jarvis"
- "Stealth mode" / "Orb mode" / "Widget mode"

### AI Conversation
Any natural language question when no specific command matches is routed to your configured AI provider.

## System Tray

Right-click the JARVIS tray icon for:
- Show/Hide JARVIS
- Voice On/Off
- Orb Mode / Widget Mode
- Settings
- Restart / Exit

## Themes

Available in Settings → Theme:
- **Jarvis** (default cyan holographic)
- **Dark** — Minimal dark
- **Light** — Light mode
- **Cyberpunk** — Pink/teal
- **Holographic** — Purple/cyan

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Microphone not working | Check Windows Privacy → Microphone permissions |
| AI not responding | Verify API key in Settings |
| App won't start | Delete `%APPDATA%/jarvis-desktop/jarvis.db` and restart |
| High CPU usage | Disable particle effects or switch to widget mode |

## Data Location

- **Database:** `%APPDATA%/jarvis-desktop/jarvis.db`
- **Plugins:** `%APPDATA%/jarvis-desktop/plugins/`
- **Encryption key:** `%APPDATA%/jarvis-desktop/.jarvis-key`
