import { useState, useEffect } from 'react'
import AICore from './components/AICore'
import Dashboard from './components/Dashboard'
import VoiceSystem from './components/VoiceSystem'
import ParticleBackground from './components/ParticleBackground'

function App() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-20 h-20 rounded-full glassmorphism neon-border flex items-center justify-center cursor-pointer animate-float"
          style={{ background: 'rgba(10, 10, 26, 0.95)' }}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 animate-pulse-glow flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-cyan-300" />
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      <ParticleBackground />
      <div className="absolute inset-0 z-10 flex flex-col">
        <div className="flex justify-between items-center p-4">
          <div className="text-cyan-400 neon-glow font-bold text-2xl">JARVIS</div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="glassmorphism px-4 py-2 text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all"
            >
              ↓ HIDE
            </button>
            <button
              onClick={() => window.close()}
              className="glassmorphism px-4 py-2 text-red-400 hover:text-white hover:bg-red-500/20 transition-all"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 flex gap-6 p-4">
          <div className="flex-1 flex flex-col gap-6">
            <AICore
              isListening={isListening}
              isSpeaking={isSpeaking}
            />
            <VoiceSystem
              onStartListening={() => setIsListening(true)}
              onStopListening={() => setIsListening(false)}
              isListening={isListening}
            />
          </div>
          <Dashboard />
        </div>
      </div>
    </div>
  )
}

export default App
