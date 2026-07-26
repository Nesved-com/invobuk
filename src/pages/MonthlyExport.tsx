import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FolderOutput, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePurchaseOrderStore } from '@/store/usePurchaseOrderStore'
import { useSupplierPOStore } from '@/store/useSupplierPOStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import DocumentTemplate from '@/components/shared/DocumentTemplate'
import { renderNodeToPdfBytes } from '@/lib/pdfExport'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function sanitizeFileName(name: string) {
  return name.replace(/[/\\?%*:|"<>]/g, '-')
}

export default function MonthlyExport() {
  const { purchaseOrders } = usePurchaseOrderStore()
  const { orders: incomingOrders } = useSupplierPOStore()
  const { company } = useCompanyStore()
  const { customers } = useCustomerStore()

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [exporting, setExporting] = useState(false)

  const inMonth = (dateStr: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d.getMonth() === month && d.getFullYear() === year
  }

  const matchingOutgoing = purchaseOrders.filter(po => inMonth(po.date))
  const matchingIncoming = incomingOrders.filter(po => inMonth(po.date))
  const incomingWithFile = matchingIncoming.filter(po => po.pdfFileId)
  const incomingWithoutFile = matchingIncoming.filter(po => !po.pdfFileId)

  const bridge = (window as any).electronExport

  const handleExport = async () => {
    if (!bridge) {
      toast.error('Folder export is only available in the desktop app')
      return
    }
    if (!matchingOutgoing.length && !matchingIncoming.length) {
      toast.error('No purchase orders found for this month')
      return
    }

    const destRoot = await bridge.selectFolder()
    if (!destRoot) return

    setExporting(true)
    const folderName = `CA-Export-${year}-${String(month + 1).padStart(2, '0')}`
    const destPath = `${destRoot}/${folderName}`
    await bridge.ensureDir(destPath)

    try {
      // Outgoing Purchase Orders — render each one off-screen and save as PDF.
      for (const po of matchingOutgoing) {
        const customer = customers.find(c => c.id === po.customerId)
        const container = window.document.createElement('div')
        container.style.position = 'fixed'
        container.style.top = '-9999px'
        container.style.left = '-9999px'
        window.document.body.appendChild(container)
        const root = createRoot(container)

        await new Promise<void>(resolve => {
          root.render(
            <DocumentTemplate
              document={{ ...po, type: 'purchase-order' } as any}
              company={company}
              customer={customer}
            />
          )
          // Two rAF ticks so layout/paint has settled before we measure/capture it.
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })

        const node = container.firstElementChild as HTMLElement
        const bytes = await renderNodeToPdfBytes(node)
        await bridge.writeFile(`${destPath}/PO-${sanitizeFileName(po.number)}.pdf`, new Uint8Array(bytes))

        root.unmount()
        container.remove()
      }

      // Incoming Purchase Orders — copy the originally-saved PDF, when we have it.
      for (const po of incomingWithFile) {
        await bridge.copyIncomingPdf(po.pdfFileId, `${destPath}/Incoming-${sanitizeFileName(po.number)}.pdf`)
      }

      toast.success(`Exported ${matchingOutgoing.length + incomingWithFile.length} document(s) to ${folderName}`)
      if (incomingWithoutFile.length) {
        toast.warning(`${incomingWithoutFile.length} incoming order(s) have no saved original PDF (imported before this feature) — export those manually.`)
      }
      bridge.openPath(destPath)
    } catch (err: any) {
      toast.error('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const selectCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white cursor-pointer'

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monthly Export for CA</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bundle a month's Purchase Orders (outgoing) and Incoming Purchase Orders into a folder — nothing is sent automatically.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectCls}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={selectCls}>
            {Array.from({ length: 6 }).map((_, i) => {
              const y = now.getFullYear() - i
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-gray-500">Purchase Orders (outgoing)</div>
            <div className="text-xl font-bold text-gray-900">{matchingOutgoing.length}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-gray-500">Incoming Purchase Orders</div>
            <div className="text-xl font-bold text-gray-900">{matchingIncoming.length}</div>
            {incomingWithoutFile.length > 0 && (
              <div className="text-xs text-amber-600 mt-1">{incomingWithoutFile.length} without a saved original PDF</div>
            )}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold text-sm shadow-lg shadow-brand-200 transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOutput className="w-4 h-4" />}
          {exporting ? 'Exporting…' : 'Choose Folder & Export'}
        </button>
      </div>
    </div>
  )
}
