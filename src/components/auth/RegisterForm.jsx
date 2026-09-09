import { useState } from 'react'
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function RegisterForm({ onSwitchToLogin }) {
  const [form, setForm]     = useState({ team: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [show, setShow]     = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (!form.team.trim())          e.team = 'Team name is required'
    if (!form.email.trim())         e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)             e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSuccess(true)
    setTimeout(() => { setSuccess(false); onSwitchToLogin() }, 2000)
  }

  const Field = ({ id, icon: Icon, label, type, field, placeholder }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          id={id}
          type={type === 'pw' ? (show ? 'text' : 'password') : type}
          value={form[field]}
          onChange={ev => setForm(f => ({ ...f, [field]: ev.target.value }))}
          placeholder={placeholder}
          className={`w-full bg-surface-2 border ${errors[field] ? 'border-red-500/60' : 'border-white/8'} rounded-xl pl-9 pr-${type === 'pw' ? '10' : '4'} py-3 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all`}
        />
        {type === 'pw' && (
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {errors[field] && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={12} /> {errors[field]}
        </p>
      )}
    </div>
  )

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <p className="font-heading font-semibold text-text-primary">Account Created!</p>
        <p className="text-sm text-text-muted">Redirecting to login…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field id="reg-team"  icon={User} label="Team Name"  type="text"  field="team"     placeholder="e.g. Team Alpha" />
      <Field id="reg-email" icon={Mail} label="Email ID"   type="email" field="email"    placeholder="you@college.edu" />
      <Field id="reg-pass"  icon={Lock} label="Password"   type="pw"    field="password" placeholder="Min. 6 characters" />

      <button
        id="register-btn"
        type="submit"
        disabled={loading}
        className="btn-gradient relative w-full py-3.5 rounded-xl text-sm font-semibold text-white mt-2 disabled:opacity-60"
      >
        <span className="relative z-10">{loading ? 'Creating Account…' : 'Create Account'}</span>
      </button>
    </form>
  )
}
