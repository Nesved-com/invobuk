import { useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLicenseStore } from '@/store/useLicenseStore'
import { activateLicense, formatExpiry } from '@/lib/license'
import invobukLogoShort from '@/assets/invobuk-logo-short.png'

export default function LicenseActivation() {
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-brand-800 rounded-[35%_65%_60%_40%]" />
        <div className="absolute -top-16 left-44 w-44 h-44 bg-white rounded-full" />
        <div className="absolute top-[38%] -left-10 w-24 h-24 bg-amber-500 rounded-full" />
        <div className="absolute bottom-32 left-12 w-3 h-3 bg-gray-300 rounded-full" />
        <div className="absolute top-1/4 right-16 w-2.5 h-2.5 bg-gray-300 rounded-full" />
        <div className="absolute top-1/3 right-28 w-1.5 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5">
        <div className={`w-full bg-white rounded-3xl shadow-2xl shadow-black/10 overflow-hidden transition-all duration-200 ${shake ? 'animate-shake' : ''}`}>
          <div className="px-8 pt-8 pb-2">
            <div className="flex items-center gap-2.5 mb-1">
              <img src={invobukLogoShort} alt="Invobuk" className="h-10 w-10 object-contain rounded-xl" />
              <span className="font-extrabold text-2xl tracking-tight text-gray-900">Invo<span className="text-amber-500">buk</span></span>
            </div>
            <p className="text-xs text-gray-400 ml-0.5">Smart Billing, Simple Business</p>
          </div>

          <div className="px-8 pt-5 pb-7">
            <h1 className="text-xl font-bold text-gray-900">Activate Invobuk</h1>
            <p className="text-sm text-gray-500 mt-1 mb-5">Enter your license key to start using the app.</p>

            <div className="flex items-center gap-2 mb-4 text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-brand-700">One key activates this computer</span>
            </div>

            <form onSubmit={handleActivate} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="INV-XXXX-XXXX-XXXX"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-mono uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !key.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Activating…' : 'Activate'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">Don't have a license key? Contact contact@nesved.com</p>
          </div>

          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} NesVed. All rights reserved.</p>
          </div>
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
