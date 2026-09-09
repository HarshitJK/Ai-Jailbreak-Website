import { Check, Zap, BookOpen, LogOut } from 'lucide-react'

export default function Sidebar({
  challenges,
  currentIndex,
  completedCount,
  onOpenRules,
  onLogout,
  teamName,
}) {
  const total = challenges.length
  const progressPercent = Math.round((completedCount / total) * 100)

  return (
    <aside className="w-[280px] h-full flex flex-col bg-surface border-r border-white/5 select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan shadow-[0_0_10px_#22D3EE] animate-pulse" />
          <h1 className="font-heading font-bold text-lg tracking-wider text-white">
            PROMPT <span className="gradient-text">HEIST</span>
          </h1>
        </div>
        {teamName && (
          <p className="text-xs text-text-muted mt-1.5 truncate">
            Agent: <span className="text-purple-300 font-medium">{teamName}</span>
          </p>
        )}
      </div>

      {/* Progress Section */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-text-muted uppercase tracking-wider font-semibold">Progress</span>
          <span className="font-mono text-purple-300 font-bold">
            {completedCount} / {total} Completed
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden border border-white/5">
          <div
            className="h-full progress-bar transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Challenge List (STRICT: Absolutely NO lock icon) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted/60 px-2 mb-2">
          Mission Objectives
        </p>

        {challenges.map((challenge, idx) => {
          const isCompleted = idx < completedCount
          const isActive = idx === currentIndex
          const isSubdued = !isCompleted && !isActive

          let statusBadge = null
          let containerClasses = ''

          if (isCompleted) {
            containerClasses = 'bg-surface-2/60 border border-green-500/20 text-text-primary hover:border-green-500/40'
            statusBadge = (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <Check size={12} strokeWidth={3} />
                Completed
              </span>
            )
          } else if (isActive) {
            containerClasses = 'bg-gradient-to-r from-purple-900/30 to-surface-2 border border-purple-500/40 shadow-[0_0_15px_rgba(147,51,234,0.15)] text-white'
            statusBadge = (
              <span className="flex items-center gap-1 text-[11px] font-medium text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30 animate-pulse">
                <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                Active
              </span>
            )
          } else {
            // Subdued (Strictly NO lock icons)
            containerClasses = 'opacity-35 bg-surface-2/20 border border-transparent text-text-muted cursor-not-allowed pointer-events-none'
            statusBadge = (
              <span className="text-[11px] text-text-muted/60">
                Queued
              </span>
            )
          }

          return (
            <div
              key={challenge.id}
              className={`p-3 rounded-xl transition-all duration-200 flex flex-col gap-1.5 ${containerClasses}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-semibold tracking-wide">
                  {challenge.title}
                </span>
                {statusBadge}
              </div>
              <p className="text-[11px] text-text-muted line-clamp-1">
                {challenge.short}
              </p>
            </div>
          )
        })}
      </div>

      {/* Sidebar bottom: ONLY Rules and Logout */}
      <div className="p-4 border-t border-white/5 flex flex-col gap-2">
        <button
          onClick={onOpenRules}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-white hover:bg-surface-2 border border-white/5 transition-all"
        >
          <BookOpen size={15} className="text-purple-400" />
          Rules
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/10 border border-red-500/10 transition-all"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  )
}
