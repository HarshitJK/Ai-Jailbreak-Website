import NeuralCanvas from './NeuralCanvas'
import { Zap, Brain, Trophy } from 'lucide-react'

const features = [
  { icon: Zap,    label: 'AI Challenge',       desc: '6 elite prompt engineering challenges' },
  { icon: Brain,  label: 'Prompt Engineering', desc: 'Test your skills against real evaluators' },
  { icon: Trophy, label: 'Compete & Win',      desc: 'Rise to the top — only the best heist wins' },
]

export default function HeroSection() {
  return (
    <div className="relative flex-1 flex flex-col justify-center px-10 py-16 overflow-hidden">
      <NeuralCanvas />
      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-medium text-purple-300 tracking-widest uppercase">College AI Event 2025</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl xl:text-6xl font-heading font-bold leading-tight mb-3 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <span className="gradient-text">PROMPT</span>
          <br />
          <span className="text-white">HEIST</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl text-text-muted font-light mb-2 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          Think Different. <span className="text-accent-cyan">Prompt Smarter.</span>
        </p>
        <p className="text-sm text-text-muted/70 mb-10 animate-fade-in-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
          Crack the Prompt. Unlock the Future.
        </p>

        {/* Features */}
        <div className="flex flex-col gap-4">
          {features.map(({ icon: Icon, label, desc }, i) => (
            <div
              key={label}
              className="flex items-center gap-4 animate-fade-in-up"
              style={{ animationDelay: `${0.3 + i * 0.1}s`, opacity: 0 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/15 border border-purple-500/20 shrink-0">
                <Icon size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
