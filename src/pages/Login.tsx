import { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, Zap, ShieldCheck } from 'lucide-react'
import { useAuthStore, hashPassword } from '@/store/useAuthStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { toast } from 'sonner'
import invobukLogoShort from '@/assets/invobuk-logo-short.png'

export default function Login() {
  const { setupDone, passwordHash, setPassword, login } = useAuthStore()
  const { company } = useCompanyStore()

  const [password, setPasswordInput] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const companyName = company?.name || 'Renuka Electronics & Electricals'

  // Auto-focus input on mount
  useEffect(() => {
    const el = document.getElementById('password-input')
    el?.focus()
  }, [])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    try {
      const hash = await hashPassword(password)
      if (hash === passwordHash) {
        login()
      } else {
        triggerShake()
        toast.error('Incorrect password')
        setPasswordInput('')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 4) { toast.error('Password must be at least 4 characters'); return }
    if (password !== confirmPassword) { triggerShake(); toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const hash = await hashPassword(password)
      setPassword(hash)
      login()
      toast.success('Password set! You are now logged in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className={`relative w-full max-w-sm transition-all duration-200 ${shake ? 'animate-shake' : ''}`}>
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-700 to-brand-500 px-8 pt-8 pb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white font-bold text-xl leading-tight">{companyName}</h1>
            <p className="text-brand-100 text-sm mt-1">Billing Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <div className="flex items-center gap-2 mb-5">
              {setupDone
                ? <><Lock className="w-4 h-4 text-gray-400" /><p className="text-sm text-gray-600 font-medium">Enter your password to continue</p></>
                : <><ShieldCheck className="w-4 h-4 text-brand-500" /><p className="text-sm text-brand-700 font-semibold">First time? Set a password to secure the app</p></>
              }
            </div>

            <form onSubmit={setupDone ? handleLogin : handleSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                  {setupDone ? 'Password' : 'Create Password'}
                </label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder={setupDone ? 'Enter password' : 'Min. 4 characters'}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!setupDone && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || (!setupDone && !confirmPassword)}
                className="w-full bg-gradient-to-r from-brand-700 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? 'Please wait…' : setupDone ? 'Unlock App' : 'Set Password & Continue'}
              </button>
            </form>
          </div>

          <div className="px-8 pb-5 text-center">
            <p className="text-xs text-gray-400">Renuka Electronics & Electricals — Billing v1.0</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-1.5">
          <a href="https://www.nesved.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
            <img src={invobukLogoShort} alt="Invobuk" className="h-7 w-7 object-contain rounded-md" />
            <span className="font-bold text-white text-lg">Invo<span className="text-amber-400">buk</span></span>
          </a>
          <p className="text-[11px] text-brand-100/70">© {new Date().getFullYear()} NesVed. All rights reserved.</p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
