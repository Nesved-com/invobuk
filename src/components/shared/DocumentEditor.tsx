import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Save, Eye } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'
import type { LineItem, GstType, DocumentStatus, BaseDocument } from '@/types'
import { calculateLineItem, calculateTotals } from '@/lib/calculations'
import { formatCurrency, numberToWords } from '@/lib/utils'
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
  const [showPaymentTerms, setShowPaymentTerms] = useState(initialData?.showPaymentTerms ?? true)
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
  const [showDueDate, setShowDueDate] = useState(initialData?.showDueDate ?? true)
  const [showDiscount, setShowDiscount] = useState(initialData?.showDiscount ?? true)
  const [shipToSame, setShipToSame] = useState(initialData?.shipToSame ?? true)
  const [selectedShipAddrId, setSelectedShipAddrId] = useState('')
  const [declaration, setDeclaration] = useState(initialData?.declaration || company.declaration || '')
  // New invoice fields
  const [suppliersRef, setSuppliersRef] = useState(initialData?.suppliersRef || '')
  const [showSuppliersRef, setShowSuppliersRef] = useState(initialData?.showSuppliersRef ?? true)
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
    showDueDate,
    showDiscount,
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
    showPaymentTerms,
    declaration,
    status,
    type: docType,
    kindAttention: kindAttention || undefined,
    enquirySource: enquirySource || undefined,
    enquiryDate: enquiryDate || undefined,
    // Invoice extra fields
    ...(docType === 'invoice' ? {
      suppliersRef,
      showSuppliersRef,
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

  const inputCls = 'w-full h-[42px] border border-[#D7E2DB] rounded-[11px] px-3.5 text-[13.5px] font-semibold text-[#16241F] outline-none focus:border-[#13A26A] focus:ring-[3px] focus:ring-[#13A26A]/[0.13] bg-white transition-colors'
  const monoCls = 'font-mono'
  const labelCls = 'block text-[10.5px] font-extrabold tracking-[0.11em] text-[#6D857B] uppercase mb-1.5'

  return (
    <div className="w-full pb-12 font-manrope">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(backPath)} className="flex items-center gap-2 h-9 px-3.5 rounded-[9px] border border-[#DDE5E0] bg-white text-[#3B554B] hover:bg-[#F2F7F4] hover:border-[#C6D5CD] text-[13px] font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2.5">
          <button onClick={handlePreview} className="flex items-center gap-2 h-[38px] px-4 rounded-[10px] border border-[#DDE5E0] bg-white text-[#3B554B] hover:bg-[#F2F7F4] text-[13px] font-bold transition-colors">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 h-[38px] px-[18px] rounded-[10px] border-none text-white text-[13px] font-bold transition-all hover:brightness-105"
            style={{ background: 'linear-gradient(160deg,#13A26A,#0B6B47)', boxShadow: '0 6px 16px -8px #0B6B47AA' }}>
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Section 1: Customer + Basic Info */}
        <div className="bg-white rounded-2xl border border-[#E4EDE8] shadow-[0_1px_2px_rgba(16,40,32,.04),0_18px_40px_-34px_rgba(16,40,32,.5)] overflow-hidden">
          <div className="px-[22px] py-4 bg-gradient-to-b from-[#F7FBF8] to-white border-b border-[#EEF3F0] flex items-center gap-3">
            <span className="w-[26px] h-[26px] rounded-lg bg-[#E7F3EC] text-[#0F7A52] flex items-center justify-center text-xs font-extrabold font-mono flex-shrink-0">01</span>
            <div>
              <h3 className="font-extrabold text-[#16241F] text-[14.5px] tracking-tight">Document Details</h3>
              <p className="text-[11.5px] text-[#7B938A] font-medium">Buyer, reference numbers and tax treatment</p>
            </div>
          </div>
          <div className="p-[22px] grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-[18px]">
            <div className="col-span-2">
              <label className={labelCls}>Customer <span className="text-[#C0392B]">*</span></label>
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
              <div className="flex items-center gap-2 mb-1">
                <label className={labelCls}>Payment Terms</label>
                <label className="ml-auto flex items-center gap-1.5 text-[10.5px] font-bold text-[#0F7A52] cursor-pointer select-none">
                  <input type="checkbox" checked={showPaymentTerms} onChange={e => setShowPaymentTerms(e.target.checked)}
                    className="w-[13px] h-[13px] accent-[#0F7A52] cursor-pointer" />
                  PDF
                </label>
              </div>
              <input type="number" min="0" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                placeholder="e.g. 30 days" className={inputCls} />
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
                  <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Customer PO No" className={`${inputCls} ${monoCls}`} />
                </div>
                <div>
                  <DatePicker label="PO Date" value={poDate} onChange={setPoDate} />
                </div>
                <div>
                  <label className={labelCls}>Vendor Code</label>
                  <input value={vendorCode} onChange={e => setVendorCode(e.target.value)} className={`${inputCls} ${monoCls}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className={labelCls}>Due Date</label>
                    {!dueDateTouched && (
                      <span className="text-[10px] font-extrabold text-[#0F7A52] bg-[#E7F3EC] px-1.5 py-0.5 rounded mb-1.5">AUTO</span>
                    )}
                    <div className="ml-auto flex items-center gap-2 mb-1.5">
                      {dueDateTouched && (
                        <button type="button" onClick={() => setDueDateTouched(false)} className="text-[10px] font-bold text-[#0F7A52] hover:underline">
                          Auto-calculate
                        </button>
                      )}
                      <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#0F7A52] cursor-pointer select-none">
                        <input type="checkbox" checked={showDueDate} onChange={e => setShowDueDate(e.target.checked)}
                          className="w-[13px] h-[13px] accent-[#0F7A52] cursor-pointer" />
                        PDF
                      </label>
                    </div>
                  </div>
                  <DatePicker value={dueDate} onChange={d => { setDueDate(d); setDueDateTouched(true) }} />
                </div>
                <div className="flex items-center gap-2.5 col-span-2 pt-1">
                  <label className="flex items-center gap-2.5 h-10 px-3.5 rounded-[11px] border border-[#E1EAE5] bg-white text-[#3B554B] text-[12.5px] font-semibold cursor-pointer hover:border-[#C6D5CD] transition-colors">
                    <input type="checkbox" checked={reverseCharge} onChange={e => setReverseCharge(e.target.checked)} className="w-[15px] h-[15px] accent-[#0F7A52]" />
                    Reverse charge
                  </label>
                  <label className="flex items-center gap-2.5 h-10 px-3.5 rounded-[11px] border border-[#BEE3CF] bg-[#F1FAF4] text-[#0B5D3E] text-[12.5px] font-bold cursor-pointer">
                    <input type="checkbox" checked={shipToSame} onChange={e => setShipToSame(e.target.checked)} className="w-[15px] h-[15px] accent-[#0F7A52]" />
                    Ship to same address
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
                  <div className="flex items-center gap-2 mb-1">
                    <label className={labelCls}>Supplier's Ref</label>
                    <label className="ml-auto flex items-center gap-1.5 text-[10.5px] font-bold text-[#0F7A52] cursor-pointer select-none">
                      <input type="checkbox" checked={showSuppliersRef} onChange={e => setShowSuppliersRef(e.target.checked)}
                        className="w-[13px] h-[13px] accent-[#0F7A52] cursor-pointer" />
                      PDF
                    </label>
                  </div>
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
                    className="w-full border border-[#D7E2DB] rounded-[11px] px-3.5 py-2.5 text-[13px] font-medium text-[#16241F] leading-[1.55] outline-none focus:border-[#13A26A] focus:ring-[3px] focus:ring-[#13A26A]/[0.13] resize-none" />
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
          <div className="px-[22px] py-4 bg-gradient-to-b from-[#FFFCF5] to-white border-b border-[#EEF3F0] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-[26px] h-[26px] rounded-lg bg-[#FDF2DC] text-[#8A6516] flex items-center justify-center text-xs font-extrabold font-mono flex-shrink-0">02</span>
              <div>
                <h3 className="font-extrabold text-[#16241F] text-[14.5px] tracking-tight">Line Items</h3>
                <p className="text-[11.5px] text-[#7B938A] font-medium">
                  <span className="font-mono">{items.length}</span> item{items.length !== 1 ? 's' : ''} · taxable <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                </p>
              </div>
            </div>
            {docType !== 'quotation' && (
              <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#0F7A52] cursor-pointer select-none">
                <input type="checkbox" checked={showDiscount} onChange={e => setShowDiscount(e.target.checked)}
                  className="w-[13px] h-[13px] accent-[#0F7A52] cursor-pointer" />
                Show Discount on PDF
              </label>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-[#F7FAF8] text-[10px] font-extrabold tracking-[0.1em] text-[#6D857B] uppercase">
                  <th className="px-2 py-2.5 text-left w-[300px]">Service / Product</th>
                  <th className="px-2 py-2.5 text-center w-20">HSN/SAC</th>
                  <th className="px-2 py-2.5 text-center w-14">Qty</th>
                  <th className="px-2 py-2.5 text-center w-16">Unit</th>
                  <th className="px-2 py-2.5 text-right w-24">Rate ₹</th>
                  {docType !== 'quotation' && <th className="px-2 py-2.5 text-center w-14">Disc%</th>}
                  <th className="px-2 py-2.5 text-center w-16">GST%</th>
                  <th className="px-2 py-2.5 text-right w-28">Taxable Amt</th>
                  <th className="px-2 py-2.5 text-right w-24">Total</th>
                  <th className="px-2 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F7F5]">
                {items.map((item, idx) => {
                  const itemTotal = gstType === 'intra'
                    ? item.amount + item.cgst + item.sgst
                    : item.amount + item.igst
                  const cellInputCls = 'w-full h-[38px] border border-[#E3EBE6] rounded-[9px] px-2.5 text-xs font-semibold text-[#16241F] outline-none focus:border-[#13A26A] focus:ring-[3px] focus:ring-[#13A26A]/10'
                  return (
                    <tr key={item.id} className="hover:bg-[#FAFDFB]">
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
                          className={`${cellInputCls} font-mono text-center`} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min="0" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className={`${cellInputCls} font-mono text-right`} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}
                          className={`${cellInputCls} text-center`} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min="0" value={item.rate} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className={`${cellInputCls} font-mono text-right`} />
                      </td>
                      {docType !== 'quotation' && (
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" max="100" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            className={`${cellInputCls} font-mono text-right`} />
                        </td>
                      )}
                      <td className="px-2 py-1.5">
                        <select value={item.gstRate} onChange={e => updateItem(item.id, 'gstRate', parseFloat(e.target.value))}
                          className={`${cellInputCls} font-mono text-right bg-white cursor-pointer`}>
                          {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs font-medium text-[#3B554B] font-mono">{formatCurrency(item.amount)}</td>
                      <td className="px-2 py-1.5 text-right text-[13px] font-bold text-[#0B5D3E] font-mono">{formatCurrency(itemTotal)}</td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeItem(item.id)} className="text-[#B9847C] hover:text-[#C0392B] hover:bg-[#FDEDEB] p-1 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3.5 px-[18px] py-3.5 bg-[#FAFCFB]">
            <button onClick={addItem} className="flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] border border-dashed border-[#C6D5CD] bg-white text-[#0F7A52] text-[12.5px] font-bold hover:border-[#13A26A] hover:bg-[#F2FBF6] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add another line
            </button>
            <span className="text-[11.5px] text-[#8AA097] font-medium">Tip: press Tab to move across fields, Enter to add a row</span>
            {totals.totalDiscount > 0 && <span className="ml-auto text-xs text-[#0F7A52] font-semibold">Discount saved: {formatCurrency(totals.totalDiscount)}</span>}
          </div>
        </div>

        {docType === 'invoice' && (
          <div className="bg-white rounded-2xl border border-[#E4EDE8] shadow-[0_1px_2px_rgba(16,40,32,.04),0_18px_40px_-34px_rgba(16,40,32,.5)] overflow-hidden">
            <div className="px-[22px] py-4 bg-gradient-to-b from-[#F7FBF8] to-white border-b border-[#EEF3F0] flex items-center gap-3">
              <span className="w-[26px] h-[26px] rounded-lg bg-[#E7F3EC] text-[#0F7A52] flex items-center justify-center text-xs font-extrabold font-mono flex-shrink-0">03</span>
              <div>
                <h3 className="font-extrabold text-[#16241F] text-[14.5px] tracking-tight">Additional Details</h3>
                <p className="text-[11.5px] text-[#7B938A] font-medium">Printed at the bottom of the PDF</p>
              </div>
            </div>
            <div className="p-[22px] grid grid-cols-2 gap-[18px]">
              <div className="col-span-2">
                <label className={labelCls}>Declaration</label>
                <textarea value={declaration} onChange={e => setDeclaration(e.target.value)} rows={2}
                  className="w-full border border-[#D7E2DB] rounded-[11px] px-3.5 py-2.5 text-[13px] font-medium text-[#16241F] leading-[1.55] outline-none focus:border-[#13A26A] focus:ring-[3px] focus:ring-[#13A26A]/[0.13] resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Amount Payable — narrow card, pinned to the right, last thing on the page */}
        <div className="flex justify-end">
        <div className="w-full max-w-[344px] rounded-2xl overflow-hidden font-manrope" style={{ boxShadow: '0 20px 44px -30px rgba(9,32,22,.85)', background: 'radial-gradient(120% 100% at 100% 0%,#16543A 0%,#0C1714 62%)' }}>
          <div className="px-[22px] pt-5 pb-[18px]">
            <div className="text-[10.5px] font-extrabold tracking-[0.13em] text-[#7FA394] uppercase">Amount Payable</div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl font-bold text-[#8FC9AE]">₹</span>
              <span className="font-mono text-[34px] leading-none font-semibold text-[#F4FAF7] tracking-tight">
                {Math.round(totals.grandTotal).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[11.5px] leading-[1.5] text-[#8FA79D] font-semibold mt-2.5">
              {numberToWords(Math.round(totals.grandTotal))}
            </div>
          </div>
          <div className="px-[22px] pb-5 pt-4 flex flex-col gap-[11px]">
            <div className="flex justify-between text-[12.5px] font-semibold text-[#A9C0B7]">
              <span>Taxable value</span><span className="font-mono text-[#E4EFE9]">{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-[12.5px] font-semibold text-[#A9C0B7]">
                <span>Discount</span><span className="font-mono text-[#E4EFE9]">− {formatCurrency(totals.totalDiscount)}</span>
              </div>
            )}
            {gstType === 'intra' ? (
              <>
                <div className="flex justify-between text-[12.5px] font-semibold text-[#A9C0B7]">
                  <span>CGST</span><span className="font-mono text-[#E4EFE9]">{formatCurrency(totals.totalCgst)}</span>
                </div>
                <div className="flex justify-between text-[12.5px] font-semibold text-[#A9C0B7]">
                  <span>SGST</span><span className="font-mono text-[#E4EFE9]">{formatCurrency(totals.totalSgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-[12.5px] font-semibold text-[#A9C0B7]">
                <span>IGST</span><span className="font-mono text-[#E4EFE9]">{formatCurrency(totals.totalIgst)}</span>
              </div>
            )}
            <div className="flex justify-between text-[12.5px] font-semibold text-[#A9C0B7]">
              <span>Round off</span>
              <span className="font-mono text-[#E4EFE9]">{formatCurrency(Math.round(totals.grandTotal) - totals.grandTotal)}</span>
            </div>
            <div className="h-px bg-white/[0.08] my-0.5" />
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-extrabold text-[#F4FAF7]">Grand total</span>
              <span className="font-mono text-[16px] font-semibold text-[#4FD6A0]">₹{Math.round(totals.grandTotal).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {previewDoc && <ShareModal document={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}
