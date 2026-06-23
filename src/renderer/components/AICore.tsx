import React from 'react'

interface AICoreProps {
  isListening: boolean
  isSpeaking: boolean
}

const AICore: React.FC<AICoreProps> = ({ isListening, isSpeaking }) => {
  return (
    <div className="glassmorphism p-8 flex-1 flex flex-col items-center justify-center neon-border">
      <div className="relative">
        <div className={`w-48 h-48 rounded-full border-4 border-cyan-500 ${isListening ? 'animate-pulse-glow' : ''} flex items-center justify-center`}>
          <div className={`w-32 h-32 rounded-full border-2 border-cyan-400 ${isListening ? 'animate-spin-slow' : ''} flex items-center justify-center`}>
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 ${isSpeaking ? 'animate-pulse' : 'animate-float'}`} />
          </div>
        </div>
        {isListening && (
          <div className="absolute inset-0 animate-ping">
            <div className="w-full h-full rounded-full border-2 border-cyan-400 opacity-50" />
          </div>
        )}
      </div>
      <h2 className="text-cyan-400 neon-glow text-4xl font-bold mt-8">JARVIS</h2>
      <p className="text-cyan-300/70 text-sm mt-2">JUST A RATHER VERY INTELLIGENT SYSTEM</p>
      <div className="mt-8 glassmorphism p-4 w-full text-center">
        <p className="text-cyan-400 font-mono">
          {isListening ? '🎤 LISTENING...' : isSpeaking ? '🔊 SPEAKING...' : '✓ JARVIS READY'}
        </p>
      </div>
    </div>
  )
}

export default AICore
