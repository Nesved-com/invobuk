import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { usePurchaseOrderStore } from '@/store/usePurchaseOrderStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import ShareModal from '@/components/shared/ShareModal'
import { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard } from '@/components/ui/table'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { PurchaseOrder } from '@/types'

export default function PurchaseOrders() {
  const { purchaseOrders, deletePO } = usePurchaseOrderStore()
  const [search, setSearch] = useState('')
  const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null)
  const navigate = useNavigate()
  const confirm = useConfirm()

  const filtered = purchaseOrders.filter(po =>
    po.number.toLowerCase().includes(search.toLowerCase()) ||
    po.customerName.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (po: PurchaseOrder, e: React.MouseEvent) => {
    e.stopPropagation()
    if (await confirm(`This will permanently delete purchase order ${po.number} for ${po.customerName}.`, { title: 'Delete this purchase order?' })) {
      deletePO(po.id); toast.success('Deleted')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-0.5">{purchaseOrders.length} total order{purchaseOrders.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-56" />
          </div>
          <Link to="/purchase-orders/new" className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold text-sm shadow-lg shadow-amber-200 transition-colors">
            <Plus className="w-4 h-4" /> New Purchase Order
          </Link>
        </div>
      </div>

      <TableCard>
        <Table>
          <Thead>
            <THeadRow>
              <Th>Order #</Th>
              <Th>Customer</Th>
              <Th align="center">Date</Th>
              <Th align="center">Delivery</Th>
              <Th align="right">Amount</Th>
              <Th align="center">Actions</Th>
            </THeadRow>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <TEmpty colSpan={6} icon={<ShoppingCart className="w-10 h-10" />} message="No purchase orders yet"
                action={<Link to="/purchase-orders/new" className="text-amber-600 hover:underline text-sm">Create first order</Link>} />
            ) : filtered.map((po, i) => (
              <Tr key={po.id} clickable onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="font-bold text-amber-700 font-mono text-xs">{po.number}</span>
                  </div>
                </Td>
                <Td><p className="font-semibold text-gray-800 text-sm">{po.customerName}</p></Td>
                <Td align="center" muted>{formatDate(po.date)}</Td>
                <Td align="center" muted>{po.expectedDelivery ? formatDate(po.expectedDelivery) : '—'}</Td>
                <Td align="right"><span className="font-bold text-gray-900">{formatCurrency(po.grandTotal)}</span></Td>
                <Td align="center" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => navigate(`/purchase-orders/${po.id}/edit`)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-amber-500 hover:bg-amber-50 hover:border-amber-200 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setPreviewPO(po)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                    <button onClick={e => handleDelete(po, e)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableCard>

      {previewPO && (
        <ShareModal document={{ ...previewPO, type: 'purchase-order' }} onClose={() => setPreviewPO(null)} />
      )}
    </div>
  )
}
