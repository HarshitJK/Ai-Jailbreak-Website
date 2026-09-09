import { X, ShieldAlert } from 'lucide-react'
import { RULES, TEAM_NOTE } from '../../data/rules'

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-white/10 shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <ShieldAlert size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white">Competition Rules</h2>
              <p className="text-xs text-text-muted">PROMPT HEIST — Protocol & Directives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Rules content */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 text-sm text-text-primary">
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
            <strong>Notice:</strong> {TEAM_NOTE}
          </div>

          <div className="grid gap-3">
            {RULES.map((rule) => (
              <div
                key={rule.number}
                className="p-3.5 rounded-xl bg-surface-2/60 border border-white/5 flex gap-3.5"
              >
                <div className="font-heading font-bold text-xs text-accent-cyan px-2 py-1 rounded bg-cyan-500/10 h-fit">
                  {rule.number}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-0.5">{rule.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold tracking-wide transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}
