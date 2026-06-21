import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2, Receipt, ChevronDown, FileText, FilePlus } from 'lucide-react'
import { toast } from 'sonner'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import ShareModal from '@/components/shared/ShareModal'
import { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard } from '@/components/ui/table'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { Invoice } from '@/types'

export default function Invoices() {
  const { invoices, deleteInvoice } = useInvoiceStore()
  const [search, setSearch] = useState('')
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const navigate = useNavigate()
  const confirm = useConfirm()

  const filtered = invoices.filter(i =>
    i.number.toLowerCase().includes(search.toLowerCase()) ||
    i.customerName.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation()
    if (await confirm(`This will permanently delete invoice ${inv.number} for ${inv.customerName}.`, { title: 'Delete this invoice?' })) {
      deleteInvoice(inv.id); toast.success('Invoice deleted')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-56" />
          </div>
          <div className="relative">
            <button onClick={() => setShowNewMenu(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold text-sm shadow-lg shadow-brand-200 transition-colors">
              <Plus className="w-4 h-4" /> New Invoice <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showNewMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNewMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <Link to="/invoices/new" onClick={() => setShowNewMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <FilePlus className="w-4 h-4 text-gray-400" /> Create Manually
                  </Link>
                  <Link to="/invoices/new/from-po" onClick={() => setShowNewMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                    <FileText className="w-4 h-4 text-gray-400" /> From Incoming Purchase Order
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <TableCard>
        <Table>
          <Thead>
            <THeadRow>
              <Th>Invoice #</Th>
              <Th>Customer</Th>
              <Th align="center">Created Date</Th>
              <Th align="center">Due Date</Th>
              <Th align="right">Amount</Th>
              <Th align="center">Actions</Th>
            </THeadRow>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <TEmpty colSpan={6} icon={<Receipt className="w-10 h-10" />} message="No invoices yet" />
            ) : filtered.map((inv, i) => (
              <Tr key={inv.id} clickable onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="font-bold text-brand-700 font-mono text-xs">{inv.number}</span>
                  </div>
                </Td>
                <Td>
                  <p className="font-semibold text-gray-800 text-sm">{inv.customerName}</p>
                </Td>
                <Td align="center" muted>{formatDate(inv.createdAt)}</Td>
                <Td align="center">
                  {inv.dueDate
                    ? <span className={new Date(inv.dueDate) < new Date() && inv.status !== 'paid' ? 'text-red-500 font-semibold text-xs' : 'text-gray-400 text-xs'}>
                        {formatDate(inv.dueDate)}
                      </span>
                    : <span className="text-gray-300">—</span>}
                </Td>
                <Td align="right">
                  <span className="font-bold text-gray-900">{formatCurrency(inv.grandTotal)}</span>
                </Td>
                <Td align="center" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => navigate(`/invoices/${inv.id}/edit`)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-brand-500 hover:bg-brand-50 hover:border-brand-200 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setPreviewInvoice(inv)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                    <button onClick={e => handleDelete(inv, e)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableCard>

      {previewInvoice && (
        <ShareModal document={{ ...previewInvoice, type: 'invoice' }} onClose={() => setPreviewInvoice(null)} />
      )}
    </div>
  )
}
