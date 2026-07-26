import { useState } from 'react'
import { X, IndianRupee } from 'lucide-react'

interface Props {
  documentNumber: string
  grandTotal: number
  currentAmount?: number
  onSave: (amount: number) => void
  onClose: () => void
}

export default function PaymentModal({ documentNumber, grandTotal, currentAmount, onSave, onClose }: Props) {
  const [amount, setAmount] = useState(String(currentAmount || ''))

  const handleSave = () => {
    const value = Number(amount)
    if (amount.trim() === '' || isNaN(value) || value < 0) return
    onSave(value)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Add Payment</h2>
              <p className="text-sm text-gray-500 mt-0.5">{documentNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount Received (₹)</label>
        <input
          type="number"
          min={0}
          autoFocus
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="0"
        />
        <p className="text-xs text-gray-400 mt-1.5">Total amount: ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold text-sm shadow-lg shadow-brand-200 transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
