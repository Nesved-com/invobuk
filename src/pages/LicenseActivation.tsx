import { useState } from 'react'
import { KeyRound, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useLicenseStore } from '@/store/useLicenseStore'
import { activateLicense, formatExpiry } from '@/lib/license'
import AuthShell from '@/components/auth/AuthShell'

export default function LicenseActivation({ trialMessage }: { trialMessage?: string }) {
  const { activate } = useLicenseStore()
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    try {
      const result = await activateLicense(key)
      if (!result.valid) {
        setShake(true)
        setTimeout(() => setShake(false), 500)
        toast.error(result.reason || 'Invalid license key')
        return
      }
      activate(key.trim().toUpperCase(), result.customerName!, result.expiresAt!)
      toast.success(`License activated — valid until ${formatExpiry(result.expiresAt!)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className={`transition-all duration-200 ${shake ? 'animate-shake' : ''}`}>
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold text-gray-900 mb-1.5 tracking-tight">
            {trialMessage ? 'Your trial has ended' : 'Activate Invobuk'}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {trialMessage || 'Enter your license key to start using the app.'}
          </p>
        </div>

        {trialMessage && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Enter a license key below to upgrade and keep using Invobuk.
          </div>
        )}

        <div className="flex items-center gap-2 mb-4 text-xs font-semibold">
          <KeyRound className="w-3.5 h-3.5 text-[#007a55]" />
          <span className="text-[#007a55]">One key activates this computer</span>
        </div>

        <form onSubmit={handleActivate} className="flex flex-col gap-4">
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" />
            <input
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="INV-XXXX-XXXX-XXXX"
              className="w-full border-[1.5px] border-gray-200 rounded-[10px] pl-[42px] pr-4 py-3 text-sm font-mono uppercase tracking-wide text-gray-900 bg-[#FAFAFA] focus:outline-none focus:border-[#005A40] focus:ring-[3px] focus:ring-[#005A40]/10 transition-colors"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#005A40] hover:bg-[#003D2B] text-white border-none rounded-[10px] text-[15px] font-bold transition-all shadow-[0_4px_14px_rgba(27,60,42,0.35)] disabled:opacity-50 disabled:cursor-not-allowed mt-1 active:scale-[0.98]"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Activating…' : 'Activate'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">Don't have a license key? Contact contact@nesved.com</p>
        <p className="text-center mt-5 text-xs text-gray-400">© {new Date().getFullYear()} NesVed. All rights reserved.</p>
      </div>
    </AuthShell>
  )
}
