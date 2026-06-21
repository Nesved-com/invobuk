import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Share2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuotationStore } from '@/store/useQuotationStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import ShareModal from '@/components/shared/ShareModal'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { DocumentStatus } from '@/types'

export default function QuotationView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { quotations, updateQuotation, deleteQuotation } = useQuotationStore()
  const doc = quotations.find(q => q.id === id)
  const [showShare, setShowShare] = useState(false)
  const confirm = useConfirm()

  if (!doc) return <div className="text-center py-16 text-gray-400"><p>Quotation not found.</p><Link to="/quotations" className="text-brand-600 hover:underline mt-2 block">Back</Link></div>

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/quotations')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="flex items-center gap-2">
          <select value={doc.status} onChange={e => { updateQuotation(id!, { status: e.target.value as DocumentStatus }); toast.success('Status updated') }}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none bg-white">
            {['draft','sent','accepted','rejected','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <button onClick={() => navigate(`/quotations/${doc.id}/edit`)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button onClick={() => setShowShare(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-medium">
            <Share2 className="w-4 h-4" /> Share / Print
          </button>
          <button onClick={async () => { if (await confirm(`This will permanently delete quotation ${doc.number} for ${doc.customerName}.`, { title: 'Delete this quotation?' })) { deleteQuotation(doc.id); navigate('/quotations') }}} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-purple-700">{doc.number}</h2>
            <p className="text-gray-500 text-sm mt-1">Created {formatDate(doc.createdAt)}</p>
          </div>
          <StatusBadge status={doc.status} />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Customer</p><p className="font-semibold">{doc.customerName}</p></div>
          <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Date</p><p className="font-semibold">{formatDate(doc.date)}</p></div>
          {doc.validUntil && <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Valid Until</p><p className="font-semibold">{formatDate(doc.validUntil)}</p></div>}
        </div>
        <table className="w-full text-sm mb-4">
          <thead className="bg-purple-900 text-white text-xs">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-center">Qty</th>
              <th className="px-4 py-2 text-right">Rate</th>
              <th className="px-4 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {doc.items.map((item, idx) => (
              <tr key={item.id} className={idx%2===0?'bg-white':'bg-gray-50'}>
                <td className="px-4 py-2.5 text-gray-500">{idx+1}</td>
                <td className="px-4 py-2.5 font-medium">{item.description}</td>
                <td className="px-4 py-2.5 text-center">{item.quantity} {item.unit}</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(item.rate)}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(doc.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>GST</span><span>{formatCurrency(doc.totalGst)}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 text-purple-700"><span>Grand Total</span><span>{formatCurrency(doc.grandTotal)}</span></div>
          </div>
        </div>
      </div>

      {showShare && <ShareModal document={{ ...doc, type: 'quotation' }} onClose={() => setShowShare(false)} />}
    </div>
  )
}
