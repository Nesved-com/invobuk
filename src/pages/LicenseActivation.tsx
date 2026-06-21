import { useState, useEffect } from 'react'
import { KeyRound, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useLicenseStore } from '@/store/useLicenseStore'
import { activateLicense, formatExpiry, getMachineId } from '@/lib/license'
import invobukLogoShort from '@/assets/invobuk-logo-short.png'

export default function LicenseActivation() {
  const { activate } = useLicenseStore()
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [machineId, setMachineId] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { getMachineId().then(setMachineId) }, [])

  const handleCopyMachineId = async () => {
    await navigator.clipboard.writeText(machineId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

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
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className={`relative w-full max-w-sm transition-all duration-200 ${shake ? 'animate-shake' : ''}`}>
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-700 to-brand-500 px-8 pt-8 pb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white font-bold text-xl leading-tight">Activate Invobuk</h1>
            <p className="text-brand-100 text-sm mt-1">Enter your license key to continue</p>
          </div>

          <div className="px-8 py-7">
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">License Key</label>
                <input
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="INV-XXXX-XXXX-XXXX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !key.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Activating…' : 'Activate'}
              </button>
            </form>
          </div>

          <div className="px-8 pb-5">
            <p className="text-xs text-gray-400 text-center mb-3">Don't have a license key? Contact contact@nesved.com</p>
            {machineId && (
              <button
                type="button"
                onClick={handleCopyMachineId}
                title="Send this to NesVed if they need to manually assign your license"
                className="w-full flex items-center justify-between gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-left transition-colors"
              >
                <div className="overflow-hidden">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Machine ID</p>
                  <p className="text-xs font-mono text-gray-600 truncate">{machineId}</p>
                </div>
                {copied ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Copy className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 opacity-90">
            <img src={invobukLogoShort} alt="Invobuk" className="h-7 w-7 object-contain rounded-md" />
            <span className="font-bold text-white text-lg">Invo<span className="text-amber-400">buk</span></span>
          </div>
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
