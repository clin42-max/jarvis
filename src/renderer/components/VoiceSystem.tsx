import React, { useState, useRef, useEffect } from 'react'

interface VoiceSystemProps {
  onStartListening: () => void
  onStopListening: () => void
  isListening: boolean
}

const VoiceSystem: React.FC<VoiceSystemProps> = ({ onStartListening, onStopListening, isListening }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 400
    canvas.height = 80

    let animationId: number

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 26, 0.8)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (isListening && dataArrayRef.current && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)
        const barWidth = (canvas.width / dataArrayRef.current.length) * 2.5
        let x = 0

        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const barHeight = (dataArrayRef.current[i] / 255) * canvas.height
          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
          gradient.addColorStop(0, '#00ffff')
          gradient.addColorStop(1, '#0066ff')
          ctx.fillStyle = gradient
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
          x += barWidth
        }
      } else {
        const time = Date.now() / 1000
        for (let i = 0; i < 50; i++) {
          const barHeight = Math.sin(time + i * 0.2) * 20 + 30
          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
          gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)')
          gradient.addColorStop(1, 'rgba(0, 102, 255, 0.3)')
          ctx.fillStyle = gradient
          ctx.fillRect(i * 8, canvas.height - barHeight, 6, barHeight)
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => cancelAnimationFrame(animationId)
  }, [isListening])

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)
      setVoiceEnabled(true)
      onStartListening()
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }

  const stopVoice = () => {
    setVoiceEnabled(false)
    onStopListening()
  }

  return (
    <div className="glassmorphism p-6">
      <div className="flex gap-4 mb-4">
        <button
          onClick={isListening ? stopVoice : startVoice}
          className={`flex-1 glassmorphism p-4 font-mono font-bold transition-all ${
            isListening
              ? 'bg-red-500/30 text-red-400 border-red-500'
              : 'text-cyan-400 hover:bg-cyan-500/20'
          }`}
        >
          {isListening ? '⏹ STOP' : '▶ ACTIVATE'}
        </button>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`glassmorphism px-6 py-4 font-mono font-bold transition-all ${
            voiceEnabled
              ? 'bg-green-500/30 text-green-400 border-green-500'
              : 'text-cyan-400 hover:bg-cyan-500/20'
          }`}
        >
          {voiceEnabled ? '🎤 ON' : '🎤 VOICE'}
        </button>

      </div>
      <canvas
        ref={canvasRef}
        className="w-full glassmorphism rounded-lg"
      />
      <div className="mt-4 glassmorphism p-4 text-center">
        <p className="text-cyan-400/70 font-mono text-sm">
          Awaiting your command, sir...
        </p>
      </div>
      <details className="mt-4">
        <summary className="glassmorphism p-3 text-cyan-400 cursor-pointer font-mono">
          ⚡ COMMANDS (200+)
        </summary>
        <div className="glassmorphism p-4 mt-2 text-cyan-300/70 font-mono text-sm">
          <p>• "Open Chrome"</p>
          <p>• "Check system status"</p>
          <p>• "What's the weather?"</p>
          <p>• "Play music"</p>
          <p>• "Run diagnostics"</p>
        </div>
      </details>
    </div>
  )
}

export default VoiceSystem
