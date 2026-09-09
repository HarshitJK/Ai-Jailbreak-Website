import { Trophy, CheckCircle, Home, Sparkles } from 'lucide-react'

export default function CompletionScreen({ onReturnHome }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-bg-dark p-6 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] -top-32 -left-32 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-pink-600/15 blur-[120px] -bottom-32 -right-32 pointer-events-none" />

      <div className="glass max-w-lg w-full rounded-2xl p-8 md:p-10 text-center border border-purple-500/20 shadow-2xl relative z-10 animate-fade-in-up">
        {/* Celebration Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-[0_0_40px_rgba(236,72,153,0.3)] animate-float">
          <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center">
            <Trophy size={36} className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" />
          </div>
        </div>

        {/* Heading */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono mb-3">
          <Sparkles size={13} className="text-accent-cyan" />
          MISSION SUCCESSFUL
        </div>

        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-white tracking-tight mb-2">
          # HEIST COMPLETED
        </h1>

        <p className="text-sm md:text-base text-text-muted mb-8">
          You successfully cracked all prompts.
        </p>

        {/* Metric Box */}
        <div className="p-4 rounded-xl bg-surface-2/60 border border-white/5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle size={16} className="text-emerald-400" />
            </div>
            <span className="text-xs text-text-muted font-medium text-left">
              Final Evaluation
            </span>
          </div>
          <span className="font-mono text-sm font-bold text-accent-cyan bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
            6 / 6 Challenges Completed
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onReturnHome}
          className="btn-gradient w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25 transition-all"
        >
          <Home size={16} className="relative z-10" />
          <span className="relative z-10">Return Home</span>
        </button>
      </div>
    </div>
  )
}
