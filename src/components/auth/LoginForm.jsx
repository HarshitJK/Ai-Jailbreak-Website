import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginForm({ onLogin }) {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [show, setShow]     = useState(false)
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (!form.email.trim())   e.email = 'Email is required'
    if (!form.password)       e.password = 'Password is required'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    // Extract "team name" from email prefix as display name
    const name = form.email.split('@')[0].replace(/[._]/g, ' ')
    onLogin(name)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Email */}
      <div>
        <label htmlFor="login-email" className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Email ID</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            id="login-email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@college.edu"
            className={`w-full bg-surface-2 border ${errors.email ? 'border-red-500/60' : 'border-white/8'} rounded-xl pl-9 pr-4 py-3 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all`}
          />
        </div>
        {errors.email && <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12}/>{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="login-pass" className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            id="login-pass"
            type={show ? 'text' : 'password'}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Your password"
            className={`w-full bg-surface-2 border ${errors.password ? 'border-red-500/60' : 'border-white/8'} rounded-xl pl-9 pr-10 py-3 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all`}
          />
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12}/>{errors.password}</p>}
      </div>

      <button
        id="login-btn"
        type="submit"
        disabled={loading}
        className="btn-gradient relative w-full py-3.5 rounded-xl text-sm font-semibold text-white mt-2 disabled:opacity-60"
      >
        <span className="relative z-10">{loading ? 'Authenticating…' : 'Start Challenge'}</span>
      </button>
    </form>
  )
}
