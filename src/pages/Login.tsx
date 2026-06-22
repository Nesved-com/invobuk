import { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, ShieldCheck, User, Mail, Phone } from 'lucide-react'
import { useAuthStore, hashPassword } from '@/store/useAuthStore'
import { useUserStore } from '@/store/useUserStore'
import { useLicenseStore } from '@/store/useLicenseStore'
import { updateLicenseContact } from '@/lib/license'
import { toast } from 'sonner'
import AuthShell from '@/components/auth/AuthShell'

export default function Login() {
  const { setupDone, passwordHash, setPassword, login } = useAuthStore()
  const { setUser } = useUserStore()
  const license = useLicenseStore()

  const [password, setPasswordInput] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const [setupFirstName, setSetupFirstName] = useState('')
  const [setupLastName, setSetupLastName] = useState('')
  const [setupEmail, setSetupEmail] = useState('')
  const [setupPhone, setSetupPhone] = useState('')

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
    if (!setupFirstName.trim()) { toast.error('First name is required'); return }
    if (password.length < 4) { toast.error('Password must be at least 4 characters'); return }
    if (password !== confirmPassword) { triggerShake(); toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const hash = await hashPassword(password)
      setPassword(hash)
      setUser(setupFirstName.trim(), setupLastName.trim(), setupEmail.trim(), setupPhone.trim())
      login()
      toast.success('Password set! You are now logged in.')

      // Best-effort: let NesVed know who's actually using this license, even if the
      // admin didn't have the customer's email/phone when issuing the key.
      if (license.licenseKey && (setupEmail.trim() || setupPhone.trim())) {
        updateLicenseContact(license.licenseKey, setupEmail.trim() || undefined, setupPhone.trim() || undefined)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full border-[1.5px] border-gray-200 rounded-[10px] pl-[42px] pr-4 py-3 text-sm text-gray-900 bg-[#FAFAFA] focus:outline-none focus:border-[#005A40] focus:ring-[3px] focus:ring-[#005A40]/10 transition-colors"

  return (
    <AuthShell>
      <div className={`transition-all duration-200 ${shake ? 'animate-shake' : ''}`}>
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold text-gray-900 mb-1.5 tracking-tight">
            {setupDone ? 'Welcome Back! 👋' : 'Welcome!'}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {setupDone
              ? 'Sign in to your account and manage your business.'
              : 'Set a password to secure the app and get started.'}
          </p>
        </div>

        {!setupDone && (
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#007a55]" />
            <span className="text-[#007a55]">First time setup</span>
          </div>
        )}

        <form onSubmit={setupDone ? handleLogin : handleSetup} className="flex flex-col gap-4">
          {!setupDone && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" />
                  <input value={setupFirstName} onChange={e => setSetupFirstName(e.target.value)} placeholder="First name *" className={inputCls} />
                </div>
                <input value={setupLastName} onChange={e => setSetupLastName(e.target.value)} placeholder="Last name"
                  className="w-full border-[1.5px] border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 bg-[#FAFAFA] focus:outline-none focus:border-[#005A40] focus:ring-[3px] focus:ring-[#005A40]/10 transition-colors" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" />
                <input type="email" value={setupEmail} onChange={e => setSetupEmail(e.target.value)} placeholder="Email address" className={inputCls} />
              </div>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" />
                <input type="tel" value={setupPhone} onChange={e => setSetupPhone(e.target.value)} placeholder="Phone number" className={inputCls} />
              </div>
            </>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" />
              <input
                id="password-input"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder={setupDone ? 'Enter your password' : 'Min. 4 characters'}
                className={`${inputCls} pr-11`}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
              </button>
            </div>
          </div>

          {!setupDone && (
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`${inputCls} pr-11`}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || (!setupDone && !confirmPassword)}
            className="w-full py-3.5 bg-[#005A40] hover:bg-[#003D2B] text-white border-none rounded-[10px] text-[15px] font-bold transition-all shadow-[0_4px_14px_rgba(27,60,42,0.35)] disabled:opacity-50 disabled:cursor-not-allowed mt-1 active:scale-[0.98]"
          >
            {loading ? 'Please wait…' : setupDone ? 'Sign In' : 'Set Password & Continue'}
          </button>
        </form>

        <p className="text-center mt-7 text-xs text-gray-400">© {new Date().getFullYear()} NesVed. All rights reserved.</p>
      </div>
    </AuthShell>
  )
}
