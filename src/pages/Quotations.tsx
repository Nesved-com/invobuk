import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2, FileCheck, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { useQuotationStore } from '@/store/useQuotationStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import ShareModal from '@/components/shared/ShareModal'
import PaymentModal from '@/components/shared/PaymentModal'
import { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard } from '@/components/ui/table'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { Quotation } from '@/types'

export default function Quotations() {
  const { quotations, deleteQuotation, updateQuotation } = useQuotationStore()
  const [search, setSearch] = useState('')
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null)
  const [paymentQuotation, setPaymentQuotation] = useState<Quotation | null>(null)
  const navigate = useNavigate()
  const confirm = useConfirm()

  const filtered = quotations.filter(q =>
    q.number.toLowerCase().includes(search.toLowerCase()) ||
    q.customerName.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (q: Quotation, e: React.MouseEvent) => {
    e.stopPropagation()
    if (await confirm(`This will permanently delete quotation ${q.number} for ${q.customerName}.`, { title: 'Delete this quotation?' })) {
      deleteQuotation(q.id); toast.success('Deleted')
    }
  }

  const handleSavePayment = (amount: number) => {
    if (!paymentQuotation) return
    updateQuotation(paymentQuotation.id, { paidAmount: amount })
    toast.success('Payment updated')
    setPaymentQuotation(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{quotations.length} total quotation{quotations.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quotations…"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 w-56" />
          </div>
          <Link to="/quotations/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-xl hover:brightness-105 font-semibold text-sm shadow-lg shadow-brand-900/20 transition-colors">
            <Plus className="w-4 h-4" /> New Quotation
          </Link>
        </div>
      </div>

      <TableCard>
        <Table>
          <Thead>
            <THeadRow>
              <Th>Quotation #</Th>
              <Th>Customer</Th>
              <Th align="center">Date</Th>
              <Th align="center">Valid Until</Th>
              <Th align="right">Amount</Th>
              <Th align="right">Paid</Th>
              <Th align="center">Actions</Th>
            </THeadRow>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <TEmpty colSpan={7} icon={<FileCheck className="w-10 h-10" />} message="No quotations yet"
                action={<Link to="/quotations/new" className="text-brand-700 hover:underline text-sm">Create first quotation</Link>} />
            ) : filtered.map((q, i) => (
              <Tr key={q.id} clickable onClick={() => navigate(`/quotations/${q.id}/edit`)}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="font-bold text-brand-700 font-mono text-xs">{q.number}</span>
                  </div>
                </Td>
                <Td><p className="font-semibold text-gray-800 text-sm">{q.customerName}</p></Td>
                <Td align="center" muted>{formatDate(q.date)}</Td>
                <Td align="center" muted>{q.validUntil ? formatDate(q.validUntil) : '—'}</Td>
                <Td align="right">
                  <span className="font-bold text-gray-900">{formatCurrency(q.grandTotal)}</span>
                </Td>
                <Td align="right">
                  {!!q.paidAmount ? <span className="font-bold text-green-600">{formatCurrency(q.paidAmount)}</span> : <span className="text-gray-300">—</span>}
                </Td>
                <Td align="center" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => navigate(`/quotations/${q.id}/edit`)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-brand-600 hover:bg-brand-50 hover:border-brand-200 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); setPaymentQuotation(q) }} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-green-500 hover:bg-green-50 hover:border-green-200 rounded-lg transition-colors" title="Add Payment"><IndianRupee className="w-4 h-4" /></button>
                    <button onClick={() => setPreviewQuotation(q)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                    <button onClick={e => handleDelete(q, e)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableCard>

      {previewQuotation && (
        <ShareModal document={{ ...previewQuotation, type: 'quotation' }} onClose={() => setPreviewQuotation(null)} />
      )}

      {paymentQuotation && (
        <PaymentModal
          documentNumber={paymentQuotation.number}
          grandTotal={paymentQuotation.grandTotal}
          currentAmount={paymentQuotation.paidAmount}
          onSave={handleSavePayment}
          onClose={() => setPaymentQuotation(null)}
        />
      )}
    </div>
  )
}
