import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Save, Eye } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'
import type { LineItem, GstType, DocumentStatus, BaseDocument } from '@/types'
import { calculateLineItem, calculateTotals } from '@/lib/calculations'
import { formatCurrency } from '@/lib/utils'
import { COPY_TYPE_PRESETS } from '@/lib/copyTypes'
import { useCustomerStore } from '@/store/useCustomerStore'
import { useProductStore } from '@/store/useProductStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useShippingAddressStore } from '@/store/useShippingAddressStore'
import ShareModal from './ShareModal'
import ProductAutocomplete from './ProductAutocomplete'

interface Props {
  docType: 'invoice' | 'quotation' | 'purchase-order'
  onSave: (data: any) => any
  backPath: string
  initialData?: any
}

function calcDueDate(dateStr: string, terms: string): string | null {
  if (!dateStr || !terms) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null

  // Plain number (e.g. "30") = days
  if (/^\d+$/.test(terms.trim())) {
    d.setDate(d.getDate() + parseInt(terms.trim(), 10))
    return d.toISOString().split('T')[0]
  }

  // Legacy free-text terms (e.g. "30 days", "1 Month") — kept for older saved invoices
  const match = terms.match(/(\d+)\s*(day|days|month|months|week|weeks)/i)
  if (!match) return null
  const amount = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()
  if (unit.startsWith('day')) d.setDate(d.getDate() + amount)
  else if (unit.startsWith('week')) d.setDate(d.getDate() + amount * 7)
  else if (unit.startsWith('month')) d.setMonth(d.getMonth() + amount)
  return d.toISOString().split('T')[0]
}

const emptyItem = (): LineItem => ({
  id: uuidv4(),
  description: '',
  hsnCode: '',
  quantity: 1,
  unit: 'Nos',
  rate: 0,
  discount: 0,
  gstRate: 18,
  amount: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  total: 0,
})

export default function DocumentEditor({ docType, onSave, backPath, initialData }: Props) {
  const navigate = useNavigate()
  const { customers } = useCustomerStore()
  const { products } = useProductStore()
  const { company } = useCompanyStore()
  const { addresses: shippingAddresses } = useShippingAddressStore()

  const today = new Date().toISOString().split('T')[0]
  const isEditing = !!initialData

  // Common fields
  const [customerId, setCustomerId] = useState(initialData?.customerId || '')
  const [date, setDate] = useState(initialData?.date || today)
  const [gstType, setGstType] = useState<GstType>(initialData?.gstType || 'intra')
  const [items, setItems] = useState<LineItem[]>(initialData?.items?.length ? initialData.items : [emptyItem()])
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [paymentTerms, setPaymentTerms] = useState(
    initialData?.paymentTerms || (/^\d+$/.test(company.defaultPaymentTerms?.trim() || '') ? company.defaultPaymentTerms : '')
  )
  const [status] = useState<DocumentStatus>(initialData?.status || 'draft')
  const [sourcePOId] = useState<string | undefined>(initialData?.sourcePOId)

  const [copyType, setCopyType] = useState(initialData?.copyType || COPY_TYPE_PRESETS[0])
  const [isCustomCopyType, setIsCustomCopyType] = useState(
    !!initialData?.copyType && !COPY_TYPE_PRESETS.includes(initialData.copyType)
  )

  // Invoice specific
  const [reverseCharge, setReverseCharge] = useState(initialData?.reverseCharge || false)
  const [poNumber, setPoNumber] = useState(initialData?.poNumber || '')
  const [poDate, setPoDate] = useState(initialData?.poDate || '')
  const [vendorCode, setVendorCode] = useState(initialData?.vendorCode || '')
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '')
  const [dueDateTouched, setDueDateTouched] = useState(!!initialData?.dueDate)
  const [shipToSame, setShipToSame] = useState(initialData?.shipToSame ?? true)
  const [selectedShipAddrId, setSelectedShipAddrId] = useState('')
  const [declaration, setDeclaration] = useState(initialData?.declaration || company.declaration || '')
  // New invoice fields
  const [suppliersRef, setSuppliersRef] = useState(initialData?.suppliersRef || '')
  const [dispatchThrough, setDispatchThrough] = useState(initialData?.dispatchThrough || '')
  const [destination, setDestination] = useState(initialData?.destination || '')
  const [remarks, setRemarks] = useState(initialData?.remarks || '')

  // Quotation specific
  const [validUntil, setValidUntil] = useState(initialData?.validUntil || '')
  const [kindAttention, setKindAttention] = useState(initialData?.kindAttention || '')
  const [enquirySource, setEnquirySource] = useState(initialData?.enquirySource || '')
  const [enquiryDate, setEnquiryDate] = useState(initialData?.enquiryDate || '')

  // PO specific
  const [expectedDelivery, setExpectedDelivery] = useState(initialData?.expectedDelivery || '')

  const [previewDoc, setPreviewDoc] = useState<any>(null)

  // Auto-calculate Due Date from Payment Terms (e.g. "30 days", "1 Month") + Invoice Date,
  // unless the user has manually picked a Due Date.
  useEffect(() => {
    if (dueDateTouched) return
    const calculated = calcDueDate(date, paymentTerms)
    if (calculated) setDueDate(calculated)
  }, [date, paymentTerms, dueDateTouched])

  const customer = customers.find(c => c.id === customerId)

  // Auto fill vendor code from selected customer
  const handleCustomerChange = (id: string) => {
    setCustomerId(id)
    const selected = customers.find(c => c.id === id)
    setVendorCode(selected?.vendorCode || '')
  }

  const totals = calculateTotals(items, gstType)

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      return calculateLineItem(updated) as LineItem
    }))
  }

  const fillFromProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const updated = { ...item, productId, description: product.name, hsnCode: product.hsnCode, unit: product.unit, rate: product.rate, gstRate: product.gstRate }
      return calculateLineItem(updated) as LineItem
    }))
  }

  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (id: string) => {
    if (items.length === 1) { toast.error('At least one item required'); return }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const selectedShipAddr = shippingAddresses.find(a => a.id === selectedShipAddrId)

  const buildPayload = () => ({
    customerId,
    customerName: customer?.name || '',
    copyType,
    sourcePOId,
    date,
    dueDate: dueDate || undefined,
    validUntil: validUntil || undefined,
    expectedDelivery: expectedDelivery || undefined,
    poNumber,
    poDate,
    vendorCode,
    dispatchThrough: dispatchThrough || undefined,
    destination: destination || undefined,
    reverseCharge,
    shipToSame,
    shipTo: (!shipToSame && selectedShipAddr) ? {
      name: selectedShipAddr.name,
      company: '',
      address: selectedShipAddr.address,
      city: selectedShipAddr.city,
      state: selectedShipAddr.state,
      stateCode: '',
      pincode: selectedShipAddr.pincode,
      gstNumber: selectedShipAddr.gstNumber,
      phone: selectedShipAddr.phone,
    } : undefined,
    gstType,
    items,
    ...totals,
    roundOff: Math.round(totals.grandTotal) - totals.grandTotal,
    notes,
    terms: '',
    paymentTerms,
    declaration,
    status,
    type: docType,
    kindAttention: kindAttention || undefined,
    enquirySource: enquirySource || undefined,
    enquiryDate: enquiryDate || undefined,
    // Invoice extra fields
    ...(docType === 'invoice' ? {
      suppliersRef,
      remarks,
      paidAmount: 0,
    } : {}),
  })

  const handleSave = () => {
    if (!customerId) { toast.error('Please select a customer'); return }
    if (items.some(i => !i.description)) { toast.error('All items need a description'); return }
    onSave(buildPayload())
    toast.success('Saved successfully!')
    navigate(backPath)
  }

  const handlePreview = () => {
    if (!customerId) { toast.error('Please select a customer first'); return }
    const payload = buildPayload()
    setPreviewDoc({ ...payload, id: 'preview', number: 'PREVIEW', createdAt: new Date().toISOString() })
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase mb-1'

  return (
    <div className="w-full pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={handlePreview} className="flex items-center gap-2 px-4 py-2 border border-brand-300 text-brand-700 rounded-xl hover:bg-brand-50 font-medium text-sm transition-colors">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium text-sm shadow-lg shadow-brand-200 transition-colors">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Section 1: Customer + Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-brand-50 to-white border-b border-gray-100">
            <h3 className="font-bold text-brand-800 text-sm">Document Details</h3>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Customer *</label>
              <select value={customerId} onChange={e => handleCustomerChange(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <DatePicker label="Date *" value={date} onChange={setDate} />
            </div>
            <div>
              <label className={labelCls}>Payment Terms (Days)</label>
              <input type="number" min="0" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                placeholder="e.g. 30" className={inputCls} />
            </div>
            {docType === 'invoice' && (
              <div>
                <label className={labelCls}>Copy Type</label>
                <select
                  value={isCustomCopyType ? '__custom__' : copyType}
                  onChange={e => {
                    if (e.target.value === '__custom__') { setIsCustomCopyType(true); setCopyType('') }
                    else { setIsCustomCopyType(false); setCopyType(e.target.value) }
                  }}
                  className={`${inputCls} cursor-pointer`}
                >
                  {COPY_TYPE_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="__custom__">Custom...</option>
                </select>
                {isCustomCopyType && (
                  <input value={copyType} onChange={e => setCopyType(e.target.value)}
                    placeholder="e.g. Office Copy" className={`${inputCls} mt-2`} />
                )}
              </div>
            )}

            {/* Invoice specific */}
            {docType === 'invoice' && (
              <>
                <div>
                  <label className={labelCls}>PO Number</label>
                  <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Customer PO No" className={inputCls} />
                </div>
                <div>
                  <DatePicker label="PO Date" value={poDate} onChange={setPoDate} />
                </div>
                <div>
                  <label className={labelCls}>Vendor Code</label>
                  <input value={vendorCode} onChange={e => setVendorCode(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Due Date</label>
                    {dueDateTouched && (
                      <button type="button" onClick={() => setDueDateTouched(false)} className="text-[10px] text-brand-600 hover:underline mb-1">
                        Auto-calculate
                      </button>
                    )}
                  </div>
                  <DatePicker value={dueDate} onChange={d => { setDueDate(d); setDueDateTouched(true) }} />
                </div>
                <div className="flex items-center gap-3 col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={reverseCharge} onChange={e => setReverseCharge(e.target.checked)} className="w-4 h-4 rounded accent-brand-600" />
                    <span className="text-sm font-medium text-gray-700">Reverse Charge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={shipToSame} onChange={e => setShipToSame(e.target.checked)} className="w-4 h-4 rounded accent-brand-600" />
                    <span className="text-sm font-medium text-gray-700">Ship to same address</span>
                  </label>
                </div>
                {!shipToSame && (
                  <div className="col-span-2">
                    <label className={labelCls}>Shipping Address</label>
                    <select value={selectedShipAddrId} onChange={e => setSelectedShipAddrId(e.target.value)} className={inputCls}>
                      <option value="">-- Select shipping address --</option>
                      {shippingAddresses.map(a => (
                        <option key={a.id} value={a.id}>{a.name} — {a.city || a.address}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Extra invoice fields */}
                <div>
                  <label className={labelCls}>Suppliers Ref</label>
                  <input value={suppliersRef} onChange={e => setSuppliersRef(e.target.value)} placeholder="Supplier reference" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Dispatch Through</label>
                  <input value={dispatchThrough} onChange={e => setDispatchThrough(e.target.value)} placeholder="e.g. By Hand, Courier" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Destination</label>
                  <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Aurangabad" className={inputCls} />
                </div>
              </>
            )}

            {/* Quotation specific */}
            {docType === 'quotation' && (
              <>
                <div>
                  <DatePicker label="Valid Until" value={validUntil} onChange={setValidUntil} />
                </div>
                <div>
                  <label className={labelCls}>Kind Attention</label>
                  <input value={kindAttention} onChange={e => setKindAttention(e.target.value)} placeholder="Contact person name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Enquiry Source</label>
                  <input value={enquirySource} onChange={e => setEnquirySource(e.target.value)} placeholder="e.g. Mail, Phone" className={inputCls} />
                </div>
                <div>
                  <DatePicker label="Enquiry Date" value={enquiryDate} onChange={setEnquiryDate} />
                </div>
                <div>
                  <label className={labelCls}>Vendor Code</label>
                  <input value={vendorCode} onChange={e => setVendorCode(e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Note</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Any additional note for this quotation..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
                </div>
              </>
            )}

            {/* PO specific */}
            {docType === 'purchase-order' && (
              <div>
                <DatePicker label="Expected Delivery" value={expectedDelivery} onChange={setExpectedDelivery} />
              </div>
            )}

            <div>
              <label className={labelCls}>GST Type</label>
              <select value={gstType} onChange={e => setGstType(e.target.value as GstType)} className={inputCls}>
                <option value="intra">Intra-state (CGST + SGST)</option>
                <option value="inter">Inter-state (IGST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Line Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100">
            <h3 className="font-bold text-amber-800 text-sm">Line Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <th className="px-2 py-2 text-left w-[300px]">Service Name</th>
                  <th className="px-2 py-2 text-center w-20">HSN/SAC</th>
                  <th className="px-2 py-2 text-center w-14">Qty</th>
                  <th className="px-2 py-2 text-center w-16">Unit</th>
                  <th className="px-2 py-2 text-right w-24">Rate (₹)</th>
                  {docType !== 'quotation' && <th className="px-2 py-2 text-center w-14">Disc%</th>}
                  <th className="px-2 py-2 text-center w-16">GST%</th>
                  <th className="px-2 py-2 text-right w-28">Taxable Amt</th>
                  <th className="px-2 py-2 text-right w-24">Total</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => {
                  const itemTotal = gstType === 'intra'
                    ? item.amount + item.cgst + item.sgst
                    : item.amount + item.igst
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5">
                        <ProductAutocomplete
                          value={item.description}
                          products={products}
                          onSelect={(productId) => fillFromProduct(item.id, productId)}
                          onChange={(text) => updateItem(item.id, 'description', text)}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={item.hsnCode} onChange={e => updateItem(item.id, 'hsnCode', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 text-center" />
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
                        <input type="number" min="0" value={item.rate} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 text-right" />
                      </td>
                      {docType !== 'quotation' && (
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" max="100" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 text-center" />
                        </td>
                      )}
                      <td className="px-2 py-1.5">
                        <select value={item.gstRate} onChange={e => updateItem(item.id, 'gstRate', parseFloat(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white">
                          {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">{formatCurrency(item.amount)}</td>
                      <td className="px-2 py-1.5 text-right text-xs font-bold text-brand-700">{formatCurrency(itemTotal)}</td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-gray-100">
            <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-start px-5 py-4 bg-gray-50 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              <p>{items.length} item(s)</p>
              {totals.totalDiscount > 0 && <p className="text-green-600">Discount saved: {formatCurrency(totals.totalDiscount)}</p>}
            </div>
            <div className="w-72 bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">
              <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-gray-600">
                <span>Taxable Amount</span><span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {gstType === 'intra' ? (
                <>
                  <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-gray-600">
                    <span>Add CGST</span><span>{formatCurrency(totals.totalCgst)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-gray-600">
                    <span>Add SGST</span><span>{formatCurrency(totals.totalSgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-gray-600">
                  <span>Add IGST</span><span>{formatCurrency(totals.totalIgst)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-gray-600">
                <span>Total GST</span><span>{formatCurrency(totals.totalGst)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 font-bold text-base text-brand-700 bg-brand-50">
                <span>Grand Total</span><span>₹ {Math.round(totals.grandTotal).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {docType === 'invoice' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-100">
              <h3 className="font-bold text-emerald-800 text-sm">Additional Details</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Declaration</label>
                <textarea value={declaration} onChange={e => setDeclaration(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {previewDoc && <ShareModal document={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}
