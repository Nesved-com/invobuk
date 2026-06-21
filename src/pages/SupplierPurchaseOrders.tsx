import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload, Pencil, Trash2, FileText, X, Save, Loader2, ChevronDown, ChevronUp, Truck } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard } from '@/components/ui/table'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { useSupplierPOStore, type SupplierPO, type SupplierPOItem } from '@/store/useSupplierPOStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import { extractTextFromPDF, parsePDFText } from '@/lib/pdfParser'
import { formatDate, formatCurrency } from '@/lib/utils'
import { getStateCode } from '@/lib/states'
import { useConfirm } from '@/components/ui/confirm-dialog'

const emptyItem = (): SupplierPOItem => ({
  id: uuidv4(), materialCode: '', description: '', specification: '', hsnCode: '',
  quantity: 1, unit: 'Nos', rate: 0, gstRate: 18, amount: 0, cgst: 0, sgst: 0, igst: 0, total: 0,
})

type FormData = Omit<SupplierPO, 'id' | 'number' | 'createdAt'>

const defaultForm = (): FormData => ({
  supplierInvoiceNo: '', date: new Date().toISOString().split('T')[0],
  supplierName: '', supplierAddress: '', supplierGST: '', supplierState: '',
  vendorCode: '', deliveryDate: '', paymentTerms: '', deliveryTerms: '', scopeOfSupply: '',
  items: [emptyItem()],
  subtotal: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, totalGst: 0, grandTotal: 0,
  gstType: 'intra', notes: '', status: 'pending', sourceType: 'manual',
})

function calcItem(item: SupplierPOItem, gstType: 'intra' | 'inter'): SupplierPOItem {
  const amount = item.quantity * item.rate
  const gstAmt = amount * item.gstRate / 100
  return {
    ...item, amount,
    cgst: gstType === 'intra' ? gstAmt / 2 : 0,
    sgst: gstType === 'intra' ? gstAmt / 2 : 0,
    igst: gstType === 'inter' ? gstAmt : 0,
    total: amount + gstAmt,
  }
}

function calcTotals(items: SupplierPOItem[], gstType: 'intra' | 'inter') {
  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const totalCgst = items.reduce((s, i) => s + i.cgst, 0)
  const totalSgst = items.reduce((s, i) => s + i.sgst, 0)
  const totalIgst = items.reduce((s, i) => s + i.igst, 0)
  const totalGst = totalCgst + totalSgst + totalIgst
  return { subtotal, totalCgst, totalSgst, totalIgst, totalGst, grandTotal: subtotal + totalGst }
}

export default function SupplierPurchaseOrders() {
  const { orders, addOrder, updateOrder, deleteOrder } = useSupplierPOStore()
  const [mode, setMode] = useState<'list' | 'manual' | 'pdf'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(defaultForm())
  const [parsing, setParsing] = useState(false)
  const [pdfName, setPdfName] = useState('')
  const [rawText, setRawText] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { customers, addCustomer } = useCustomerStore()

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase mb-1'

  const setF = (k: keyof FormData, v: any) => setForm(p => ({ ...p, [k]: v }))

  const updateItem = (id: string, k: keyof SupplierPOItem, v: any) => {
    setForm(p => {
      const items = p.items.map(i => {
        if (i.id !== id) return i
        return calcItem({ ...i, [k]: v }, p.gstType)
      })
      return { ...p, items, ...calcTotals(items, p.gstType) }
    })
  }

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, emptyItem()] }))
  const removeItem = (id: string) => {
    if (form.items.length === 1) return
    setForm(p => {
      const items = p.items.filter(i => i.id !== id)
      return { ...p, items, ...calcTotals(items, p.gstType) }
    })
  }

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfName(file.name)
    setParsing(true)
    try {
      const text = await extractTextFromPDF(file)
      setRawText(text)
      const parsed = parsePDFText(text)
      setForm(p => ({
        ...p,
        ...parsed,
        items: parsed.items?.length ? parsed.items : p.items,
        pdfName: file.name,
        sourceType: 'pdf',
      }))
      toast.success('PDF parsed! Review the data below and save.')
    } catch (err: any) {
      toast.error('Could not read PDF: ' + err.message)
    } finally {
      setParsing(false)
    }
  }

  const handleSave = () => {
    if (!form.supplierName.trim()) { toast.error('Supplier name is required'); return }
    if (editingId) {
      updateOrder(editingId, form)
      toast.success('Purchase order updated!')
    } else {
      addOrder(form)
      toast.success('Purchase order saved!')
    }
    setMode('list')
    setEditingId(null)
    setForm(defaultForm())
  }

  const openManual = () => { setForm(defaultForm()); setPdfName(''); setEditingId(null); setMode('manual') }
  const openPDF = () => { setForm(defaultForm()); setPdfName(''); setRawText(''); setEditingId(null); setMode('pdf') }
  const openEdit = (id: string) => {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const { id: _id, number: _number, createdAt: _createdAt, ...rest } = order
    setForm(rest)
    setPdfName(rest.pdfName || '')
    setEditingId(id)
    setMode('manual')
  }

  const handleCreateChallan = (order: SupplierPO, e: React.MouseEvent) => {
    e.stopPropagation()
    // Find or create a matching customer from the order's supplier details
    const existing = customers.find(c =>
      (order.supplierGST && c.gstNumber === order.supplierGST) ||
      c.name.trim().toLowerCase() === order.supplierName.trim().toLowerCase()
    )
    const customerId = existing
      ? existing.id
      : addCustomer({
          name: order.supplierName,
          address: order.supplierAddress,
          gstNumber: order.supplierGST,
          vendorCode: order.vendorCode,
          state: order.supplierState,
          stateCode: getStateCode(order.supplierState),
          phone: '',
        }).id

    const initialData = {
      customerId,
      poNumber: order.supplierInvoiceNo,
      poDate: order.date,
      vendorCode: order.vendorCode,
      items: order.items.map(it => ({
        id: uuidv4(),
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
      })),
    }
    navigate('/delivery-challans/new', { state: { initialData } })
  }

  // ─── List view ───────────────────────────────────────────────────────────────
  if (mode === 'list') return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incoming Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} order(s) from suppliers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openPDF} className="flex items-center gap-2 px-4 py-2 border border-brand-300 text-brand-700 rounded-xl text-sm font-medium hover:bg-brand-50 transition-colors">
            <Upload className="w-4 h-4" /> Upload PDF
          </button>
          <button onClick={openManual} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 shadow-lg shadow-brand-200 transition-colors">
            <Plus className="w-4 h-4" /> Add Manually
          </button>
        </div>
      </div>

      <TableCard>
        <Table>
          <Thead>
            <THeadRow>
              <Th>Invoice Number</Th>
              <Th>PO Number</Th>
              <Th>Supplier</Th>
              <Th align="center">Date</Th>
              <Th align="right">Amount</Th>
              <Th align="center">Source</Th>
              <Th align="center">Actions</Th>
            </THeadRow>
          </Thead>
          <Tbody>
            {orders.length === 0 ? (
              <TEmpty colSpan={7} icon={<FileText className="w-10 h-10" />} message="No purchase orders yet."
                action={
                  <div className="flex gap-3 justify-center">
                    <button onClick={openPDF} className="px-4 py-2 border border-brand-300 text-brand-600 rounded-xl text-sm hover:bg-brand-50">Upload PDF</button>
                    <button onClick={openManual} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm hover:bg-brand-700">Add Manually</button>
                  </div>
                } />
            ) : orders.map(o => (
              <Tr key={o.id} clickable onClick={() => openEdit(o.id)}>
                <Td><span className="font-bold text-brand-700 font-mono text-xs">{o.number}</span></Td>
                <Td muted>{o.supplierInvoiceNo || '—'}</Td>
                <Td><span className="font-semibold text-gray-800 text-sm">{o.supplierName}</span></Td>
                <Td align="center" muted>{o.date ? formatDate(o.date) : '—'}</Td>
                <Td align="right"><span className="font-bold text-gray-900">{formatCurrency(o.grandTotal)}</span></Td>
                <Td align="center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.sourceType === 'pdf' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {o.sourceType === 'pdf' ? 'PDF' : 'Manual'}
                  </span>
                </Td>
                <Td align="center" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1.5 justify-center">
                    <button onClick={() => openEdit(o.id)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-brand-500 hover:bg-brand-50 hover:border-brand-200 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={e => handleCreateChallan(o, e)} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 rounded-lg transition-colors" title="Create Delivery Challan"><Truck className="w-4 h-4" /></button>
                    <button onClick={async () => { if (await confirm(`This will permanently delete purchase order ${o.number} for ${o.supplierName}.`, { title: 'Delete this purchase order?' })) deleteOrder(o.id) }} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableCard>
    </div>
  )

  // ─── Shared form (used by both PDF and Manual modes) ─────────────────────────
  const isItemsMode = mode === 'manual' || (mode === 'pdf' && pdfName)

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <button onClick={() => { setMode('list'); setForm(defaultForm()); setEditingId(null) }} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
          ← Back
        </button>
        <h2 className="text-lg font-bold text-gray-800">
          {editingId ? '✏️ Edit Purchase Order' : mode === 'pdf' ? '📄 Import from PDF' : '✏️ Add Purchase Order Manually'}
        </h2>
        {isItemsMode && (
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 shadow-lg shadow-brand-200">
            <Save className="w-4 h-4" /> Save Order
          </button>
        )}
        {!isItemsMode && <div />}
      </div>

      {/* PDF Upload area */}
      {mode === 'pdf' && !pdfName && (
        <div
          onClick={() => fileRef.current?.click()}
          className="bg-white rounded-2xl border-2 border-dashed border-brand-300 p-16 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors"
        >
          {parsing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
              <p className="text-brand-600 font-medium">Reading PDF...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-brand-400 mx-auto mb-3" />
              <p className="text-gray-700 font-semibold mb-1">Click to upload supplier invoice PDF</p>
              <p className="text-gray-400 text-sm">PDF files only — data will be auto-extracted</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handlePDFUpload} />
        </div>
      )}

      {/* Form fields shown after PDF parse or in manual mode */}
      {isItemsMode && (
        <>
          {/* PDF source badge */}
          {pdfName && (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-sm text-purple-700">
              <FileText className="w-4 h-4" />
              <span>Imported from: <strong>{pdfName}</strong> — Review and correct the fields below before saving</span>
              <button onClick={() => { setShowRaw(!showRaw) }} className="ml-auto text-xs underline flex items-center gap-1">
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showRaw ? 'Hide' : 'Show'} raw text
              </button>
            </div>
          )}

          {showRaw && (
            <div className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap max-h-[70vh] overflow-y-auto w-full">
              {rawText}
            </div>
          )}

          {/* Supplier details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-brand-50 to-white border-b border-gray-100">
              <h3 className="font-bold text-brand-800 text-sm">Supplier & Order Details</h3>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>PO Number</label>
                <input value={form.supplierInvoiceNo} onChange={e => setF('supplierInvoiceNo', e.target.value)} placeholder="e.g. 6550003907-0" className={inputCls} />
              </div>
              <div>
                <DatePicker label="Date" value={form.date} onChange={v => setF('date', v)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Supplier Name *</label>
                <input value={form.supplierName} onChange={e => setF('supplierName', e.target.value)} placeholder="Company / Vendor name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Supplier GSTIN</label>
                <input value={form.supplierGST} onChange={e => setF('supplierGST', e.target.value)} placeholder="15-digit GSTIN" className={`${inputCls} font-mono uppercase`} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Supplier Address</label>
                <input value={form.supplierAddress} onChange={e => setF('supplierAddress', e.target.value)} placeholder="Address" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Supplier State</label>
                <input value={form.supplierState} onChange={e => setF('supplierState', e.target.value)} placeholder="e.g. Maharashtra" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Vendor Code</label>
                <input value={form.vendorCode} onChange={e => setF('vendorCode', e.target.value)} placeholder="e.g. 24013055" className={inputCls} />
              </div>
              <div>
                <DatePicker label="Delivery Date" value={form.deliveryDate} onChange={v => setF('deliveryDate', v)} />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className={labelCls}>Payment Terms</label>
                <input value={form.paymentTerms} onChange={e => setF('paymentTerms', e.target.value)} placeholder="e.g. 90% on delivery, 10% retention" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Delivery Terms</label>
                <input value={form.deliveryTerms} onChange={e => setF('deliveryTerms', e.target.value)} placeholder="e.g. DAP- Shendra" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Scope of Supply</label>
                <input value={form.scopeOfSupply} onChange={e => setF('scopeOfSupply', e.target.value)} placeholder="e.g. Scope of supply as per offer no- 52" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>GST Type</label>
                <select value={form.gstType} onChange={e => {
                  const gstType = e.target.value as 'intra' | 'inter'
                  const items = form.items.map(i => calcItem(i, gstType))
                  setForm(p => ({ ...p, gstType, items, ...calcTotals(items, gstType) }))
                }} className={inputCls}>
                  <option value="intra">Intra-state (CGST + SGST)</option>
                  <option value="inter">Inter-state (IGST)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-amber-800 text-sm">Items</h3>
              <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-200">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-2 py-2 text-left w-[300px]">Description</th>
                    <th className="px-2 py-2 text-center w-20">HSN Code</th>
                    <th className="px-2 py-2 text-center w-14">Qty</th>
                    <th className="px-2 py-2 text-center w-16">Unit</th>
                    <th className="px-2 py-2 text-right w-24">Rate (₹)</th>
                    <th className="px-2 py-2 text-center w-16">GST%</th>
                    <th className="px-2 py-2 text-right w-28">Amount</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.items.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5">
                        <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Material description" className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
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
                      <td className="px-2 py-1.5">
                        <select value={item.gstRate} onChange={e => updateItem(item.id, 'gstRate', parseFloat(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white">
                          {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs font-bold text-brand-700">{formatCurrency(item.total)}</td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1 rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end px-5 py-4 bg-gray-50 border-t border-gray-100">
              <div className="w-64 bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">
                <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-gray-600"><span>Taxable</span><span>{formatCurrency(form.subtotal)}</span></div>
                {form.gstType === 'intra' ? (
                  <>
                    <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-gray-600"><span>CGST</span><span>{formatCurrency(form.totalCgst)}</span></div>
                    <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-gray-600"><span>SGST</span><span>{formatCurrency(form.totalSgst)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-gray-600"><span>IGST</span><span>{formatCurrency(form.totalIgst)}</span></div>
                )}
                <div className="flex justify-between px-4 py-3 font-bold text-base text-brand-700 bg-brand-50"><span>Grand Total</span><span>{formatCurrency(form.grandTotal)}</span></div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 shadow-lg shadow-brand-200">
              <Save className="w-4 h-4" /> Save Purchase Order
            </button>
          </div>
        </>
      )}
    </div>
  )
}
