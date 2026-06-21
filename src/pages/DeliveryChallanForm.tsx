import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { useDeliveryChallanStore } from '@/store/useDeliveryChallanStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import { useProductStore } from '@/store/useProductStore'
import { useUserStore } from '@/store/useUserStore'
import { DatePicker } from '@/components/ui/date-picker'
import ProductAutocomplete from '@/components/shared/ProductAutocomplete'
import type { DeliveryChallanItem } from '@/types'

const emptyItem = (): DeliveryChallanItem => ({ id: uuidv4(), description: '', quantity: 1, unit: 'Nos' })

export default function DeliveryChallanForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as any)?.initialData
  const { challans, addChallan, updateChallan } = useDeliveryChallanStore()
  const { customers } = useCustomerStore()
  const { products } = useProductStore()
  const { firstName, lastName } = useUserStore()
  const existing = id ? challans.find(c => c.id === id) : undefined
  const isEditing = !!existing

  const today = new Date().toISOString().split('T')[0]
  const defaultPreparedBy = [firstName, lastName].filter(Boolean).join(' ')
  const defaultReferenceNote = 'Reference is made to the above cited subject .Kindly accept the material as per PO :'

  const [customerId, setCustomerId] = useState(existing?.customerId || prefill?.customerId || '')
  const [date, setDate] = useState(existing?.date || today)
  const [poNumber, setPoNumber] = useState(existing?.poNumber || prefill?.poNumber || '')
  const [poDate, setPoDate] = useState(existing?.poDate || prefill?.poDate || '')
  const [vendorCode, setVendorCode] = useState(existing?.vendorCode || prefill?.vendorCode || '')
  const [referenceNote, setReferenceNote] = useState(existing?.referenceNote || defaultReferenceNote)
  const [preparedBy, setPreparedBy] = useState(existing?.preparedBy || defaultPreparedBy)
  const [items, setItems] = useState<DeliveryChallanItem[]>(
    existing?.items?.length ? existing.items : prefill?.items?.length ? prefill.items : [emptyItem()]
  )

  if (id && !existing) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Delivery challan not found.</p>
        <button onClick={() => navigate('/delivery-challans')} className="text-brand-600 hover:underline mt-2 block">Back to delivery challans</button>
      </div>
    )
  }

  const customer = customers.find(c => c.id === customerId)

  const updateItem = (itemId: string, field: keyof DeliveryChallanItem, value: string | number) => {
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, [field]: value } : it))
  }
  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (itemId: string) => {
    if (items.length === 1) { toast.error('At least one item required'); return }
    setItems(prev => prev.filter(it => it.id !== itemId))
  }
  const fillFromProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, description: product.name, unit: product.unit } : it))
  }

  const handleSave = () => {
    if (!customerId) { toast.error('Please select a customer'); return }
    if (items.some(it => !it.description)) { toast.error('All items need a description'); return }

    const payload = {
      customerId,
      customerName: customer?.name || '',
      date,
      poNumber,
      poDate,
      vendorCode,
      referenceNote,
      preparedBy,
      items,
    }

    if (isEditing && existing) {
      updateChallan(existing.id, payload)
      toast.success('Delivery challan updated!')
    } else {
      addChallan(payload)
      toast.success('Delivery challan created!')
    }
    navigate('/delivery-challans')
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase mb-1'

  return (
    <div className="w-full pb-12">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/delivery-challans')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium text-sm shadow-lg shadow-brand-200 transition-colors">
          <Save className="w-4 h-4" /> Save
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-brand-50 to-white border-b border-gray-100">
            <h3 className="font-bold text-brand-800 text-sm">Challan Details</h3>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Customer *</label>
              <select value={customerId} onChange={e => {
                const id = e.target.value
                setCustomerId(id)
                const selected = customers.find(c => c.id === id)
                setVendorCode(selected?.vendorCode || '')
              }} className={`${inputCls} cursor-pointer`}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <DatePicker label="DC Date *" value={date} onChange={setDate} />
            </div>
            <div>
              <label className={labelCls}>Vendor Code</label>
              <input value={vendorCode} onChange={e => setVendorCode(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PO Number</label>
              <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Customer PO No" className={inputCls} />
            </div>
            <div>
              <DatePicker label="PO Date" value={poDate} onChange={setPoDate} />
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className={labelCls}>Reference Note</label>
              <textarea value={referenceNote} onChange={e => setReferenceNote(e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              <p className="text-xs text-gray-400 mt-1">
                Will print as: <span className="italic">{referenceNote} {poNumber || '—'}</span>
              </p>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Prepared By</label>
              <input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Signatory name" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100">
            <h3 className="font-bold text-amber-800 text-sm">Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <th className="px-2 py-2 text-left w-[300px]">Description</th>
                  <th className="px-2 py-2 text-center w-24">Qty</th>
                  <th className="px-2 py-2 text-center w-28">Unit</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5">
                      <ProductAutocomplete
                        value={item.description}
                        products={products}
                        onSelect={(productId) => fillFromProduct(item.id, productId)}
                        onChange={(text) => updateItem(item.id, 'description', text)}
                        placeholder="Select or type material / service description"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" min="0" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 text-center" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 text-center" />
                    </td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
