import { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, ShieldCheck, FileText, Target, Briefcase, TrendingUp } from 'lucide-react'
import { useAuthStore, hashPassword } from '@/store/useAuthStore'
import { toast } from 'sonner'
import invobukLogoShort from '@/assets/invobuk-logo-short.png'

const FEATURES = [
  { icon: FileText, title: 'Create Invoices', desc: 'Professional invoices in seconds' },
  { icon: Target, title: 'Track Payments', desc: 'Get paid faster with easy tracking' },
  { icon: Briefcase, title: 'Manage Business', desc: 'Customers, products & more in one place' },
  { icon: TrendingUp, title: 'Grow Confidently', desc: 'Reports & insights to grow your business' },
]

export default function Login() {
  const { setupDone, passwordHash, setPassword, login } = useAuthStore()

  const [password, setPasswordInput] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

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
    <div className="min-h-screen bg-brand-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-20 w-[420px] h-[420px] bg-brand-700 rounded-[40%_60%_55%_45%] opacity-60" />
          <div className="absolute -top-10 right-10 w-64 h-64 bg-brand-600 rounded-[55%_45%_60%_40%] opacity-40" />
          <div className="absolute bottom-10 -left-24 w-72 h-72 bg-amber-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute top-1/3 left-10 w-3 h-3 bg-amber-400 rounded-full opacity-70" />
          <div className="absolute top-1/2 left-24 w-2 h-2 bg-amber-300 rounded-full opacity-50" />
        </div>

        <div className={`relative w-full max-w-md transition-all duration-200 ${shake ? 'animate-shake' : ''}`}>
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="px-8 pt-8 pb-2">
              <div className="flex items-center gap-2.5 mb-1">
                <img src={invobukLogoShort} alt="Invobuk" className="h-10 w-10 object-contain rounded-xl" />
                <span className="font-extrabold text-2xl tracking-tight text-gray-900">Invo<span className="text-amber-500">buk</span></span>
              </div>
              <p className="text-xs text-gray-400 ml-0.5">Smart Billing, Simple Business</p>
            </div>

            <div className="px-8 pt-5 pb-7">
              <h1 className="text-xl font-bold text-gray-900">{setupDone ? 'Welcome Back!' : 'Welcome!'}</h1>
              <p className="text-sm text-gray-500 mt-1 mb-5">
                {setupDone
                  ? 'Sign in to your account and manage your business.'
                  : 'Set a password to secure the app and get started.'}
              </p>

              <div className="flex items-center gap-2 mb-4 text-xs font-semibold">
                {setupDone
                  ? <><Lock className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-500">Enter your password to continue</span></>
                  : <><ShieldCheck className="w-3.5 h-3.5 text-brand-500" /><span className="text-brand-700">First time setup</span></>
                }
              </div>

              <form onSubmit={setupDone ? handleLogin : handleSetup} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder={setupDone ? 'Password' : 'Create password (min. 4 characters)'}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {!setupDone && (
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || (!setupDone && !confirmPassword)}
                  className="w-full bg-gradient-to-r from-brand-800 to-brand-600 hover:from-brand-900 hover:to-brand-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? 'Please wait…' : setupDone ? 'Sign In' : 'Set Password & Continue'}
                </button>
              </form>
            </div>

            <div className="px-8 pb-6 text-center">
              <p className="text-xs text-gray-400">© {new Date().getFullYear()} NesVed. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div className="bg-brand-900 px-6 pb-8 pt-2">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-brand-800/60 border border-brand-700/50 rounded-2xl p-4">
              <div className="w-9 h-9 bg-brand-700 rounded-xl flex items-center justify-center mb-3">
                <f.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-white text-sm font-semibold">{f.title}</p>
              <p className="text-brand-300 text-xs mt-0.5">{f.desc}</p>
            </div>
          ))}
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
