import React from 'react'

interface FloatingOrbProps {
  onClick: () => void
}

const FloatingOrb: React.FC<FloatingOrbProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="w-20 h-20 rounded-full glassmorphism neon-border flex items-center justify-center cursor-pointer animate-float"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 animate-pulse-glow flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-cyan-300" />
      </div>
    </div>
  )
}

export default FloatingOrb
