import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Terminal } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

export default function ChatArea({
  currentChallenge,
  messages,
  isTyping,
  onSubmitPrompt,
  isCompleted,
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || isTyping || isCompleted) return
    onSubmitPrompt(input.trim())
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-dark relative overflow-hidden">
      {/* Current Objective Banner */}
      {currentChallenge && (
        <div className="p-4 border-b border-white/5 bg-surface/70 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-3xl mx-auto flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
              <Terminal size={16} className="text-accent-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-accent-cyan tracking-wider uppercase">
                  {currentChallenge.title}
                </span>
                <span className="text-text-muted/40">•</span>
                <span className="text-xs font-medium text-white truncate">
                  {currentChallenge.short}
                </span>
              </div>
              <p className="text-xs md:text-sm font-heading font-medium text-purple-200 mt-1 leading-snug">
                {currentChallenge.prompt}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <div className="max-w-3xl mx-auto flex flex-col space-y-4 min-h-full justify-end">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="animate-fade-in">
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area (Strictly no mic, files, or extraneous buttons) */}
      <div className="p-4 border-t border-white/5 bg-surface/40 backdrop-blur-md">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping || isCompleted}
            placeholder={
              isCompleted
                ? 'All challenges completed! Good job agent.'
                : 'Formulate your prompt here... (Press Enter to submit)'
            }
            className="w-full bg-surface-2/90 border border-white/10 rounded-2xl pl-4 pr-14 py-3 text-sm text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 resize-none transition-all shadow-inner disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTyping || isCompleted}
            className="btn-gradient absolute right-2.5 bottom-3 w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 disabled:pointer-events-none transition-transform active:scale-95 shadow-md"
            title="Submit Prompt"
          >
            <Send size={15} className="relative z-10" />
          </button>
        </form>

        <div className="max-w-3xl mx-auto mt-2 flex items-center justify-between text-[11px] text-text-muted/50 px-1">
          <span>Target AI Evaluator Active</span>
          <span>Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  )
}
