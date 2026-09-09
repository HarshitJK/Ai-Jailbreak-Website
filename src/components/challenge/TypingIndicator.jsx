export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="text-xs text-text-muted mr-1">Challenge Control is typing</span>
      {[0,1,2].map(i => (
        <span
          key={i}
          className="typing-dot w-1.5 h-1.5 rounded-full bg-purple-400 inline-block"
        />
      ))}
    </div>
  )
}
