import { Bot, User } from 'lucide-react'

export default function MessageBubble({ message }) {
  const isControl = message.sender === 'control'

  if (isControl) {
    return (
      <div className="flex items-start gap-3 animate-fade-in-up max-w-[85%]">
        <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={16} className="text-purple-400" />
        </div>
        <div className="bubble-control px-4 py-3 text-sm text-text-primary leading-relaxed shadow-lg">
          <div className="text-xs font-semibold text-purple-400 mb-1 flex items-center gap-1.5">
            <span>Challenge Control</span>
            {message.isEvaluation && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono">
                EVALUATION
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-end gap-3 animate-fade-in-up self-end max-w-[85%] ml-auto">
      <div className="bubble-user px-4 py-3 text-sm text-text-primary leading-relaxed shadow-lg">
        <div className="text-xs font-semibold text-accent-pink mb-1 text-right">
          You (Agent)
        </div>
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
      <div className="w-8 h-8 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <User size={16} className="text-pink-400" />
      </div>
    </div>
  )
}
