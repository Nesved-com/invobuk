import { FileText, CreditCard, TrendingUp } from 'lucide-react'
import invobukLogoShort from '@/assets/invobuk-logo-short.png'

const FEATURES = [
  { icon: FileText, title: 'Create Professional Invoices', desc: 'Generate in seconds, send instantly' },
  { icon: CreditCard, title: 'Track Payments Easily', desc: 'Get paid faster with smart reminders' },
  { icon: TrendingUp, title: 'Business Reports & Insights', desc: 'Grow confidently with real-time data' },
]

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[46%] bg-[#005A40] relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full animate-[blobFloat_7s_ease-in-out_infinite]" />
        <div className="absolute top-20 right-10 w-40 h-40 bg-white/[0.04] rounded-full animate-[blobFloat2_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-white/[0.04] rounded-full animate-[blobFloat_11s_ease-in-out_infinite]" />
        <div className="absolute bottom-40 -right-8 w-36 h-36 bg-amber-500/10 rounded-full" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img src={invobukLogoShort} alt="Invobuk" className="w-[58px] h-[58px] rounded-2xl object-contain shadow-lg" />
          <div>
            <div className="text-[32px] font-extrabold leading-none tracking-tight">
              <span className="text-white">Invo</span><span className="text-amber-500">buk</span>
            </div>
            <div className="text-xs text-white/55 font-medium mt-0.5 tracking-wide">Smart Billing, Simple Business</div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="text-[34px] font-extrabold text-white leading-[1.2] mb-3.5">
            The smarter way<br />to run your business.
          </div>
          <div className="text-[15px] text-white/60 leading-relaxed max-w-xs">
            Invoicing, purchase orders, and delivery challans — all in one place, fully offline.
          </div>

          <div className="flex flex-col gap-3.5 mt-10">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-white/10 rounded-[10px] flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-white/85" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{f.title}</div>
                  <div className="text-xs text-white/50 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom branding */}
        <div className="relative z-10">
          <a href="https://www.nesved.com" target="_blank" rel="noreferrer" className="text-xs font-bold text-white hover:text-amber-400 transition-colors">
            Powered by NesVed
          </a>
          <div className="text-[11px] text-white/50 mt-0.5">© {new Date().getFullYear()} NesVed. All rights reserved.</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-[#F4F7F5] flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#005A40]/[0.04] rounded-full" />
        <div className="absolute -bottom-20 -left-10 w-52 h-52 bg-amber-500/[0.06] rounded-full" />

        <div className="relative z-10 w-full max-w-[460px] bg-white rounded-[20px] p-11 pb-10 shadow-[0_8px_40px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.06)]">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes blobFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-18px) scale(1.03); } }
        @keyframes blobFloat2 { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(14px) scale(0.97); } }
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
