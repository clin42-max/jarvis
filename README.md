# JARVIS AI Assistant

A futuristic desktop AI assistant inspired by the Iron Man movies, built as a Progressive Web App (PWA) with React, TypeScript, and Tailwind CSS.

## ✨ Features

- 🎯 Futuristic HUD interface with glassmorphism design
- 🎙️ Voice recognition and speech synthesis
- 📊 Real-time system monitoring (CPU, RAM, Network, Battery)
- 🔮 Floating orb widget when minimized
- 🎨 Animated particle background
- 🤖 Multiple AI provider support (UI ready)
- ⚡ Quick actions and commands
- 💻 Installable on Windows as a standalone app (PWA)

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 🪟 Install as Windows App (Super Easy!)

### Method 1: Install as PWA (Recommended)

1. Run the app: `npm run dev`
2. Open Chrome/Edge browser to `http://localhost:5173`
3. Look for the **Install** icon in the address bar (it looks like a small computer with a down arrow)
4. Click "Install JARVIS AI Assistant"
5. That's it! Now you have JARVIS as a standalone Windows app!

### Method 2: Build and Host

1. Build the app: `npm run build`
2. Host the `dist` folder on any web server (even GitHub Pages works)
3. Visit the URL in Chrome/Edge and install as PWA

### Method 3: Use WebView2 (For EXE)

If you really want an EXE file, you can use [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) or tools like:
- [PWA Builder](https://www.pwabuilder.com/) - Convert PWA to Windows app
- [Nativefier](https://github.com/nativefier/nativefier) - Wrap web app as desktop app

## 📁 Project Structure

```
jarvis-ai/
├── src/
│   └── renderer/
│       ├── components/      # React components
│       │   ├── AICore.tsx
│       │   ├── Dashboard.tsx
│       │   ├── ParticleBackground.tsx
│       │   └── VoiceSystem.tsx
│       ├── styles/
│       │   └── index.css    # Tailwind styles
│       ├── App.tsx          # Main app component
│       └── main.tsx         # React entry point
├── public/
│   └── manifest.json        # PWA manifest
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **PWA** - Installable web app

## 📝 Usage

- Click **▶ ACTIVATE** to start voice recognition
- Click **🎤 VOICE** to toggle voice features
- Click **↓ HIDE** to minimize to floating orb
- Use the dashboard to monitor system stats

## 🎨 Customization

Edit the files in `src/renderer/components/` to customize the UI!

## 📄 License

MIT
