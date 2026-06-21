import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useQuotationStore } from '@/store/useQuotationStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import ShareModal from '@/components/shared/ShareModal'
import { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard } from '@/components/ui/table'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { Quotation } from '@/types'

export default function Quotations() {
  const { quotations, deleteQuotation } = useQuotationStore()
  const [search, setSearch] = useState('')
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null)
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
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 w-56" />
          </div>
          <Link to="/quotations/new" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold text-sm shadow-lg shadow-purple-200 transition-colors">
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
              <Th align="center">Actions</Th>
            </THeadRow>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <TEmpty colSpan={6} icon={<FileCheck className="w-10 h-10" />} message="No quotations yet"
                action={<Link to="/quotations/new" className="text-purple-600 hover:underline text-sm">Create first quotation</Link>} />
            ) : filtered.map((q, i) => (
              <Tr key={q.id} clickable onClick={() => navigate(`/quotations/${q.id}/edit`)}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="font-bold text-purple-700 font-mono text-xs">{q.number}</span>
                  </div>
                </Td>
                <Td><p className="font-semibold text-gray-800 text-sm">{q.customerName}</p></Td>
                <Td align="center" muted>{formatDate(q.date)}</Td>
                <Td align="center" muted>{q.validUntil ? formatDate(q.validUntil) : '—'}</Td>
                <Td align="right"><span className="font-bold text-gray-900">{formatCurrency(q.grandTotal)}</span></Td>
                <Td align="center" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => navigate(`/quotations/${q.id}/edit`)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-purple-500 hover:bg-purple-50 hover:border-purple-200 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
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
    </div>
  )
}
