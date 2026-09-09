import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { CHALLENGES } from '../../data/challenges'
import Sidebar from './Sidebar'
import ChatArea from './ChatArea'
import RulesModal from './RulesModal'

export default function ChallengeLayout({ teamName, onComplete, onLogout }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'control',
      text: 'Welcome Agent. Your objective is to complete six AI prompt challenges. Good luck.',
      isEvaluation: false,
    },
    {
      id: 2,
      sender: 'control',
      text: `Objective 01: ${CHALLENGES[0].prompt}\n\nTask: ${CHALLENGES[0].description}`,
      isEvaluation: false,
    },
  ])

  function handleSubmitPrompt(promptText) {
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: promptText,
    }

    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    // Simulate AI evaluator response
    setTimeout(() => {
      setIsTyping(false)
      const currentCh = CHALLENGES[currentIndex]
      const evalMsg = {
        id: Date.now() + 1,
        sender: 'control',
        text: currentCh.evaluatorResponse,
        isEvaluation: true,
      }

      const nextCompleted = completedCount + 1
      setCompletedCount(nextCompleted)

      if (currentIndex + 1 < CHALLENGES.length) {
        const nextIndex = currentIndex + 1
        setCurrentIndex(nextIndex)

        const nextCh = CHALLENGES[nextIndex]
        const nextPromptMsg = {
          id: Date.now() + 2,
          sender: 'control',
          text: `Objective 0${nextIndex + 1}: ${nextCh.prompt}\n\nTask: ${nextCh.description}`,
          isEvaluation: false,
        }

        setMessages((prev) => [...prev, evalMsg, nextPromptMsg])
      } else {
        // Final challenge completed!
        setMessages((prev) => [...prev, evalMsg])
        setTimeout(() => {
          onComplete()
        }, 1800)
      }
    }, 1400)
  }

  const currentChallenge = CHALLENGES[currentIndex]

  return (
    <div className="h-screen w-screen flex bg-bg-dark overflow-hidden select-none">
      {/* Desktop Sidebar (280px) */}
      <div className="hidden md:flex h-full">
        <Sidebar
          challenges={CHALLENGES}
          currentIndex={currentIndex}
          completedCount={completedCount}
          onOpenRules={() => setIsRulesOpen(true)}
          onLogout={onLogout}
          teamName={teamName}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 h-full w-[280px]">
            <Sidebar
              challenges={CHALLENGES}
              currentIndex={currentIndex}
              completedCount={completedCount}
              onOpenRules={() => {
                setIsRulesOpen(true)
                setMobileMenuOpen(false)
              }}
              onLogout={onLogout}
              teamName={teamName}
            />
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <span className="font-heading font-bold text-sm tracking-wider gradient-text">
              PROMPT HEIST
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-surface-2 text-text-muted hover:text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <ChatArea
          currentChallenge={currentChallenge}
          messages={messages}
          isTyping={isTyping}
          onSubmitPrompt={handleSubmitPrompt}
          isCompleted={completedCount === CHALLENGES.length}
        />
      </div>

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  )
}
