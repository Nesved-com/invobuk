import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Trash2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { useDeliveryChallanStore } from '@/store/useDeliveryChallanStore'
import { formatDate } from '@/lib/utils'
import ChallanShareModal from '@/components/shared/ChallanShareModal'
import { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard } from '@/components/ui/table'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { DeliveryChallan } from '@/types'

export default function DeliveryChallans() {
  const { challans, deleteChallan } = useDeliveryChallanStore()
  const [search, setSearch] = useState('')
  const [previewChallan, setPreviewChallan] = useState<DeliveryChallan | null>(null)
  const navigate = useNavigate()
  const confirm = useConfirm()

  const filtered = challans.filter(c =>
    c.number.toLowerCase().includes(search.toLowerCase()) ||
    c.customerName.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (c: DeliveryChallan, e: React.MouseEvent) => {
    e.stopPropagation()
    if (await confirm(`This will permanently delete delivery challan ${c.number} for ${c.customerName}.`, { title: 'Delete this delivery challan?' })) {
      deleteChallan(c.id); toast.success('Delivery challan deleted')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Challans</h1>
          <p className="text-sm text-gray-500 mt-0.5">{challans.length} total challan{challans.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search delivery challans…"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-56" />
          </div>
          <Link to="/delivery-challans/new" className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold text-sm shadow-lg shadow-brand-200 transition-colors">
            <Plus className="w-4 h-4" /> New Delivery Challan
          </Link>
        </div>
      </div>

      <TableCard>
        <Table>
          <Thead>
            <THeadRow>
              <Th>DC #</Th>
              <Th>Customer</Th>
              <Th align="center">Date</Th>
              <Th>PO Number</Th>
              <Th align="center">Actions</Th>
            </THeadRow>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <TEmpty colSpan={5} icon={<Truck className="w-10 h-10" />} message="No delivery challans yet" />
            ) : filtered.map((c, i) => (
              <Tr key={c.id} clickable onClick={() => navigate(`/delivery-challans/${c.id}/edit`)}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="font-bold text-brand-700 font-mono text-xs">{c.number}</span>
                  </div>
                </Td>
                <Td><p className="font-semibold text-gray-800 text-sm">{c.customerName}</p></Td>
                <Td align="center" muted>{formatDate(c.date)}</Td>
                <Td muted>{c.poNumber || '—'}</Td>
                <Td align="center" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => navigate(`/delivery-challans/${c.id}/edit`)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-brand-500 hover:bg-brand-50 hover:border-brand-200 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setPreviewChallan(c)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                    <button onClick={e => handleDelete(c, e)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableCard>

      {previewChallan && (
        <ChallanShareModal document={previewChallan} onClose={() => setPreviewChallan(null)} />
      )}
    </div>
  )
}
