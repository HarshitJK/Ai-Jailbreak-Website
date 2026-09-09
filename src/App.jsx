import { useState } from 'react'
import AuthPage from './components/auth/AuthPage'
import ChallengeLayout from './components/challenge/ChallengeLayout'
import CompletionScreen from './components/completion/CompletionScreen'

export default function App() {
  const [screen, setScreen] = useState('auth') // 'auth' | 'challenge' | 'complete'
  const [teamName, setTeamName] = useState('')

  function handleLogin(name) {
    setTeamName(name)
    setScreen('challenge')
  }

  function handleComplete() {
    setScreen('complete')
  }

  function handleReturnHome() {
    setTeamName('')
    setScreen('auth')
  }

  if (screen === 'auth')     return <AuthPage onLogin={handleLogin} />
  if (screen === 'challenge') return <ChallengeLayout teamName={teamName} onComplete={handleComplete} onLogout={handleReturnHome} />
  if (screen === 'complete')  return <CompletionScreen onReturnHome={handleReturnHome} />
}
