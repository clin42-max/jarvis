import React, { useState, useEffect } from 'react'

const Dashboard: React.FC = () => {
  const [cpu, setCpu] = useState(Math.random() * 50 + 20)
  const [ram, setRam] = useState(Math.random() * 40 + 40)
  const [network, setNetwork] = useState(Math.random() * 100)
  const [battery, setBattery] = useState(85)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    const statInterval = setInterval(() => {
      setCpu(Math.random() * 50 + 20)
      setRam(Math.random() * 40 + 40)
      setNetwork(Math.random() * 100)
    }, 3000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(statInterval)
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="w-80 flex flex-col gap-4">
      <div className="glassmorphism neon-border p-4">
        <h3 className="text-cyan-400 neon-glow font-bold mb-4">SYSTEM STATUS</h3>
        <div className="text-cyan-300 font-mono text-3xl mb-2">{formatTime(currentTime)}</div>
        <div className="text-cyan-400/70 font-mono text-sm">{formatDate(currentTime)}</div>
      </div>

      <div className="glassmorphism neon-border p-4">
        <h3 className="text-cyan-400 neon-glow font-bold mb-4">PERFORMANCE</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-cyan-300 font-mono text-sm mb-1">
              <span>CPU</span>
              <span>{cpu.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000"
                style={{ width: `${cpu}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-cyan-300 font-mono text-sm mb-1">
              <span>RAM</span>
              <span>{ram.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-1000"
                style={{ width: `${ram}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-cyan-300 font-mono text-sm mb-1">
              <span>NETWORK</span>
              <span>{network.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${network}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-cyan-300 font-mono text-sm mb-1">
              <span>BATTERY</span>
              <span>{battery}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all duration-1000"
                style={{ width: `${battery}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glassmorphism neon-border p-4">
        <h3 className="text-cyan-400 neon-glow font-bold mb-4">AI PROVIDER</h3>
        <div className="space-y-2">
          <button className="w-full glassmorphism p-3 text-cyan-400 font-mono text-sm text-left hover:bg-cyan-500/20 transition-all">
            OpenAI GPT-4
          </button>
          <button className="w-full glassmorphism p-3 text-cyan-400/50 font-mono text-sm text-left hover:bg-cyan-500/20 transition-all">
            Claude 3 Opus
          </button>
          <button className="w-full glassmorphism p-3 text-cyan-400/50 font-mono text-sm text-left hover:bg-cyan-500/20 transition-all">
            Gemini Pro
          </button>
          <button className="w-full glassmorphism p-3 text-cyan-400/50 font-mono text-sm text-left hover:bg-cyan-500/20 transition-all">
            Ollama
          </button>
        </div>
      </div>

      <div className="glassmorphism neon-border p-4">
        <h3 className="text-cyan-400 neon-glow font-bold mb-4">QUICK ACTIONS</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="glassmorphism p-3 text-cyan-400 font-mono text-xs hover:bg-cyan-500/20 transition-all">
            Open App
          </button>
          <button className="glassmorphism p-3 text-cyan-400 font-mono text-xs hover:bg-cyan-500/20 transition-all">
            System Info
          </button>
          <button className="glassmorphism p-3 text-cyan-400 font-mono text-xs hover:bg-cyan-500/20 transition-all">
            Files
          </button>
          <button className="glassmorphism p-3 text-cyan-400 font-mono text-xs hover:bg-cyan-500/20 transition-all">
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
