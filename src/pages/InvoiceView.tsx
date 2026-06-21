import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Share2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import ShareModal from '@/components/shared/ShareModal'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { DocumentStatus } from '@/types'

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { invoices, updateInvoice, deleteInvoice } = useInvoiceStore()
  const { customers } = useCustomerStore()
  const { company } = useCompanyStore()
  const invoice = invoices.find(i => i.id === id)
  const customer = customers.find(c => c.id === invoice?.customerId)
  const [showShare, setShowShare] = useState(false)
  const confirm = useConfirm()

  if (!invoice) return (
    <div className="text-center py-16 text-gray-400">
      <p>Invoice not found.</p>
      <Link to="/invoices" className="text-brand-600 hover:underline mt-2 block">Back to invoices</Link>
    </div>
  )

  const handleDelete = async () => {
    if (await confirm(`This will permanently delete invoice ${invoice.number} for ${invoice.customerName}.`, { title: 'Delete this invoice?' })) {
      deleteInvoice(invoice.id)
      toast.success('Invoice deleted')
      navigate('/invoices')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <select value={invoice.status} onChange={e => { updateInvoice(id!, { status: e.target.value as DocumentStatus }); toast.success('Status updated') }}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            {['draft','sent','accepted','paid','cancelled','overdue'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <button onClick={() => navigate(`/invoices/${invoice.id}/edit`)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button onClick={() => setShowShare(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 text-sm font-medium transition-colors">
            <Share2 className="w-4 h-4" /> Share / Print
          </button>
          <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-700">{invoice.number}</h2>
            <p className="text-gray-500 text-sm mt-1">Created {formatDate(invoice.createdAt)}</p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Billed By</p>
            <p className="font-semibold text-gray-800">{company.name}</p>
            <p className="text-xs text-gray-500 mt-1">{company.address}</p>
            <p className="text-xs text-gray-500">{company.city}, {company.state} {company.pincode}</p>
            <p className="text-xs text-gray-500 mt-1">GSTIN: {company.gstNumber}</p>
            {company.phone && <p className="text-xs text-gray-500">Phone: {company.phone}</p>}
            {company.email && <p className="text-xs text-gray-500">Email: {company.email}</p>}
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Billed To</p>
            <p className="font-semibold text-gray-800">{invoice.customerName}</p>
            {customer && (
              <>
                <p className="text-xs text-gray-500 mt-1">{customer.address}</p>
                <p className="text-xs text-gray-500">{customer.state}</p>
                <p className="text-xs text-gray-500 mt-1">GSTIN: {customer.gstNumber || '—'}</p>
                {customer.vendorCode && <p className="text-xs text-gray-500">Vendor Code: {customer.vendorCode}</p>}
                {customer.phone && <p className="text-xs text-gray-500">Phone: {customer.phone}</p>}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Invoice Date</p>
            <p className="font-semibold text-gray-800">{formatDate(invoice.date)}</p>
          </div>
          {invoice.dueDate && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Due Date</p>
              <p className={`font-semibold ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' ? 'text-red-600' : 'text-gray-800'}`}>{formatDate(invoice.dueDate)}</p>
            </div>
          )}
          {invoice.poNumber && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">PO Number</p>
              <p className="font-semibold text-gray-800">{invoice.poNumber}</p>
            </div>
          )}
          {invoice.poDate && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">PO Date</p>
              <p className="font-semibold text-gray-800">{formatDate(invoice.poDate)}</p>
            </div>
          )}
          {invoice.vendorCode && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Vendor Code</p>
              <p className="font-semibold text-gray-800">{invoice.vendorCode}</p>
            </div>
          )}
          {invoice.dispatchThrough && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Dispatch Through</p>
              <p className="font-semibold text-gray-800">{invoice.dispatchThrough}</p>
            </div>
          )}
          {invoice.destination && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Destination</p>
              <p className="font-semibold text-gray-800">{invoice.destination}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Payment Terms</p>
            <p className="font-semibold text-gray-800">{invoice.paymentTerms || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">GST Type</p>
            <p className="font-semibold text-gray-800">{invoice.gstType === 'intra' ? 'Intra-state' : 'Inter-state'}</p>
          </div>
          {invoice.suppliersRef && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Suppliers Ref</p>
              <p className="font-semibold text-gray-800">{invoice.suppliersRef}</p>
            </div>
          )}
          {invoice.reverseCharge && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Reverse Charge</p>
              <p className="font-semibold text-gray-800">Yes</p>
            </div>
          )}
        </div>

        {invoice.shipTo && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Ship To</p>
            <p className="font-semibold text-gray-800">{invoice.shipTo.name}</p>
            <p className="text-xs text-gray-500">{invoice.shipTo.address}, {invoice.shipTo.city}, {invoice.shipTo.state} {invoice.shipTo.pincode}</p>
            {invoice.shipTo.gstNumber && <p className="text-xs text-gray-500">GSTIN: {invoice.shipTo.gstNumber}</p>}
            {invoice.shipTo.phone && <p className="text-xs text-gray-500">Phone: {invoice.shipTo.phone}</p>}
          </div>
        )}

        <table className="w-full text-sm mb-4">
          <thead className="bg-brand-900 text-white text-xs">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-center">HSN/SAC</th>
              <th className="px-4 py-2 text-center">Qty</th>
              <th className="px-4 py-2 text-right">Rate</th>
              <th className="px-4 py-2 text-center">Disc%</th>
              <th className="px-4 py-2 text-center">GST</th>
              <th className="px-4 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2.5 text-gray-500">{idx + 1}</td>
                <td className="px-4 py-2.5 font-medium">{item.description}</td>
                <td className="px-4 py-2.5 text-center text-gray-500">{item.hsnCode}</td>
                <td className="px-4 py-2.5 text-center">{item.quantity} {item.unit}</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(item.rate)}</td>
                <td className="px-4 py-2.5 text-center text-gray-500">{item.discount || 0}%</td>
                <td className="px-4 py-2.5 text-center">{item.gstRate}%</td>
                <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
            {invoice.totalDiscount > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(invoice.totalDiscount)}</span></div>
            )}
            {invoice.gstType === 'intra' ? (
              <>
                <div className="flex justify-between text-gray-600"><span>CGST</span><span>{formatCurrency(invoice.totalCgst)}</span></div>
                <div className="flex justify-between text-gray-600"><span>SGST</span><span>{formatCurrency(invoice.totalSgst)}</span></div>
              </>
            ) : (
              <div className="flex justify-between text-gray-600"><span>IGST</span><span>{formatCurrency(invoice.totalIgst)}</span></div>
            )}
            {invoice.roundOff !== 0 && (
              <div className="flex justify-between text-gray-600"><span>Round Off</span><span>{formatCurrency(invoice.roundOff)}</span></div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 text-brand-700">
              <span>Grand Total</span><span>{formatCurrency(invoice.grandTotal)}</span>
            </div>
            {invoice.paidAmount > 0 && (
              <div className="flex justify-between text-gray-600 border-t border-gray-100 pt-2"><span>Paid Amount</span><span>{formatCurrency(invoice.paidAmount)}</span></div>
            )}
          </div>
        </div>

        {(invoice.notes || invoice.remarks || invoice.declaration) && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {invoice.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Notes</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
            {invoice.remarks && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Remarks</p>
                <p className="text-sm text-gray-600">{invoice.remarks}</p>
              </div>
            )}
            {invoice.declaration && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Declaration</p>
                <p className="text-sm text-gray-600">{invoice.declaration}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showShare && <ShareModal document={{ ...invoice, type: 'invoice' }} onClose={() => setShowShare(false)} />}
    </div>
  )
}
