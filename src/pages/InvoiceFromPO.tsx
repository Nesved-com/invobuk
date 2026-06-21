import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, ArrowLeft, FileText } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useSupplierPOStore } from '@/store/useSupplierPOStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { calculateLineItem } from '@/lib/calculations'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getStateCode } from '@/lib/states'
import { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard } from '@/components/ui/table'
import type { LineItem } from '@/types'

export default function InvoiceFromPO() {
  const { orders } = useSupplierPOStore()
  const { customers, addCustomer } = useCustomerStore()
  const { invoices } = useInvoiceStore()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const usedPOIds = new Set(invoices.map(i => i.sourcePOId).filter(Boolean))

  const filtered = orders.filter(o =>
    o.number.toLowerCase().includes(search.toLowerCase()) ||
    o.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    o.supplierInvoiceNo.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (poId: string) => {
    if (usedPOIds.has(poId)) return
    const po = orders.find(o => o.id === poId)
    if (!po) return

    // Find or create a matching customer from the PO's supplier details
    const existing = customers.find(c =>
      (po.supplierGST && c.gstNumber === po.supplierGST) ||
      c.name.trim().toLowerCase() === po.supplierName.trim().toLowerCase()
    )
    const customerId = existing
      ? existing.id
      : addCustomer({
          name: po.supplierName,
          address: po.supplierAddress,
          gstNumber: po.supplierGST,
          vendorCode: po.vendorCode,
          state: po.supplierState,
          stateCode: getStateCode(po.supplierState),
          phone: '',
        }).id

    const items: LineItem[] = po.items.map(it => calculateLineItem({
      id: uuidv4(),
      description: it.description,
      hsnCode: it.hsnCode,
      quantity: it.quantity,
      unit: it.unit,
      rate: it.rate,
      discount: 0,
      gstRate: it.gstRate,
    }) as LineItem)

    const initialData = {
      customerId,
      date: new Date().toISOString().split('T')[0],
      gstType: po.gstType,
      items,
      poNumber: po.supplierInvoiceNo,
      poDate: po.date,
      vendorCode: po.vendorCode,
      paymentTerms: po.paymentTerms,
      sourcePOId: po.id,
    }

    navigate('/invoices/new', { state: { initialData } })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice from Incoming Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select a purchase order to pull its items and details into a new invoice</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search purchase orders…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-56" />
        </div>
      </div>

      <TableCard>
        <Table>
          <Thead>
            <THeadRow>
              <Th>PO #</Th>
              <Th>Supplier Invoice No</Th>
              <Th>Supplier</Th>
              <Th align="center">Date</Th>
              <Th align="right">Amount</Th>
              <Th align="center">Action</Th>
            </THeadRow>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <TEmpty colSpan={6} icon={<FileText className="w-10 h-10" />} message="No incoming purchase orders found"
                action={<Link to="/incoming-purchase-orders" className="text-brand-600 hover:underline text-sm">Go to Incoming Purchase Order</Link>} />
            ) : filtered.map(po => {
              const used = usedPOIds.has(po.id)
              return (
                <Tr key={po.id} clickable={!used} onClick={() => handleSelect(po.id)} className={used ? 'opacity-60' : ''}>
                  <Td><span className="font-bold text-brand-700 font-mono text-xs">{po.number}</span></Td>
                  <Td muted>{po.supplierInvoiceNo || '—'}</Td>
                  <Td><p className="font-semibold text-gray-800 text-sm">{po.supplierName}</p></Td>
                  <Td align="center" muted>{formatDate(po.date)}</Td>
                  <Td align="right"><span className="font-bold text-gray-900">{formatCurrency(po.grandTotal)}</span></Td>
                  <Td align="center">
                    {used ? (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-semibold cursor-not-allowed" title="An invoice has already been created from this purchase order">
                        Invoice Created
                      </span>
                    ) : (
                      <button onClick={() => handleSelect(po.id)} className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors">
                        Use this PO
                      </button>
                    )}
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </TableCard>
    </div>
  )
}
