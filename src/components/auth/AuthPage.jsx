import { useState } from 'react'
import HeroSection from './HeroSection'
import RegisterForm from './RegisterForm'
import LoginForm from './LoginForm'

export default function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('register') // 'register' | 'login'

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-bg-dark">
      {/* Left — Hero (hidden on mobile) */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(147,51,234,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <HeroSection />
      </div>

      {/* Right — Auth Card */}
      <div className="w-full lg:w-[460px] flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-heading font-bold gradient-text">PROMPT HEIST</h1>
            <p className="text-sm text-text-muted mt-1">Think Different. Prompt Smarter.</p>
          </div>

          {/* Card */}
          <div className="glass rounded-2xl p-8">
            {/* Tabs */}
            <div className="flex bg-surface-2 rounded-xl p-1 mb-8">
              {['register', 'login'].map(t => (
                <button
                  key={t}
                  id={`tab-${t}`}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    tab === t
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {t === 'register' ? 'Register' : 'Login'}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-xl font-heading font-semibold text-text-primary">
                {tab === 'register' ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-text-muted mt-1">
                {tab === 'register'
                  ? 'Register your team to begin the heist'
                  : 'Login and continue your mission'}
              </p>
            </div>

            {/* Forms */}
            {tab === 'register'
              ? <RegisterForm onSwitchToLogin={() => setTab('login')} />
              : <LoginForm onLogin={onLogin} />
            }
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-text-muted/50 mt-6">
            PROMPT HEIST · College AI Challenge · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
