import { X, Download, Printer, Copy, Settings2, RotateCcw } from 'lucide-react'
import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'sonner'
import type { BaseDocument } from '@/types'
import DocumentTemplate from './DocumentTemplate'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import { COPY_TYPE_PRESETS } from '@/lib/copyTypes'
import { getRowBoundaries, computePageStarts, renderNodeToPdfBytes } from '@/lib/pdfExport'
import { DEFAULT_PRINT_SETTINGS, loadPrintSettings, savePrintSettings, getPageDimensionsMm, type PrintSettings } from '@/lib/printSettings'

interface Props {
  document: BaseDocument & { type: string; validUntil?: string; expectedDelivery?: string; kindAttention?: string; enquirySource?: string; enquiryDate?: string }
  onClose: () => void
  autoDownload?: boolean
}

const PX_PER_MM = 794 / 210 // matches the original A4-at-794px-wide preview scale

export default function ShareModal({ document, onClose, autoDownload }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const { company } = useCompanyStore()
  const { customers } = useCustomerStore()
  const customer = customers.find(c => c.id === document.customerId)
  const [pageStarts, setPageStarts] = useState<number[]>([0])
  const [copyType, setCopyType] = useState((document as any).copyType || COPY_TYPE_PRESETS[0])
  const [isCustomCopyType, setIsCustomCopyType] = useState(
    !!(document as any).copyType && !COPY_TYPE_PRESETS.includes((document as any).copyType)
  )
  const [showSettings, setShowSettings] = useState(false)
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => loadPrintSettings())
  const effectiveDocument = { ...document, copyType }

  const zoom = (printSettings.scale / 100) * (printSettings.fontScale / 100)
  const { width: pageWMm, height: pageHMm } = getPageDimensionsMm(printSettings.pageSize, printSettings.orientation)
  const PAGE_WIDTH_PX = Math.round(pageWMm * PX_PER_MM)
  const PAGE_HEIGHT_PX = Math.round(pageHMm * PX_PER_MM)

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setPrintSettings(prev => {
      const next = { ...prev, [key]: value }
      savePrintSettings(next)
      return next
    })
  }
  const resetSettings = () => {
    setPrintSettings(DEFAULT_PRINT_SETTINGS)
    savePrintSettings(DEFAULT_PRINT_SETTINGS)
  }

  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    toast.loading('Generating PDF...')
    try {
      const bytes = await renderNodeToPdfBytes(printRef.current, { widthMm: pageWMm, heightMm: pageHMm })
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const copySlug = copyType ? `-${copyType.split(' - ')[0].replace(/\s+/g, '')}` : ''
      const a = window.document.createElement('a')
      a.href = url
      a.download = `${document.number}${copySlug}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.dismiss()
      toast.success('PDF downloaded!')
      if (autoDownload) onClose()
    } catch {
      toast.dismiss()
      toast.error('Failed to generate PDF')
    }
  }

  const handleCopyRef = () => {
    navigator.clipboard.writeText(`${document.number}`)
    toast.success('Document number copied!')
  }

  useEffect(() => {
    if (autoDownload) {
      const id = requestAnimationFrame(() => { handleDownloadPDF() })
      return () => cancelAnimationFrame(id)
    }
  }, [autoDownload])

  // Measure the rendered (hidden) master copy and figure out where real page breaks
  // will land, so the on-screen preview shows the same page split as Print/Download.
  useLayoutEffect(() => {
    if (autoDownload) return
    const el = printRef.current
    if (!el) return
    const measure = () => {
      const boundaries = getRowBoundaries(el)
      setPageStarts(computePageStarts(el.scrollHeight, PAGE_HEIGHT_PX, boundaries))
    }
    measure()
    const t = setTimeout(measure, 50)
    return () => clearTimeout(t)
  }, [document, company, customer, autoDownload, copyType, printSettings, PAGE_HEIGHT_PX])

  if (autoDownload) {
    return (
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
        <div ref={printRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <DocumentTemplate document={effectiveDocument} company={company} customer={customer} printSettings={printSettings} />
        </div>
      </div>
    )
  }

  const numberInputCls = 'w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500'
  const settingLabelCls = 'text-xs font-semibold text-gray-500'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Document Preview</h2>
            <p className="text-xs text-gray-400">{document.number} · {pageStarts.length} page{pageStarts.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {document.type === 'invoice' && (
              <div>
                <select
                  value={isCustomCopyType ? '__custom__' : copyType}
                  onChange={e => {
                    if (e.target.value === '__custom__') { setIsCustomCopyType(true); setCopyType('') }
                    else { setIsCustomCopyType(false); setCopyType(e.target.value) }
                  }}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {COPY_TYPE_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="__custom__">Custom...</option>
                </select>
                {isCustomCopyType && (
                  <input value={copyType} onChange={e => setCopyType(e.target.value)} placeholder="e.g. Office Copy"
                    className="ml-2 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                )}
              </div>
            )}
            <button onClick={() => setShowSettings(v => !v)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showSettings ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              <Settings2 className="w-3.5 h-3.5" /> Print Settings
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={handleCopyRef} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Copy number">
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="px-6 py-4 border-b bg-gray-50 flex flex-wrap items-start gap-x-8 gap-y-3">
            <div className="flex flex-col gap-1.5">
              <span className={settingLabelCls}>Margins (mm)</span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-gray-400">Top<input type="number" min={0} max={40} value={printSettings.marginTop} onChange={e => updateSetting('marginTop', Number(e.target.value))} className={`${numberInputCls} block mt-0.5`} /></label>
                <label className="text-[11px] text-gray-400">Right<input type="number" min={0} max={40} value={printSettings.marginRight} onChange={e => updateSetting('marginRight', Number(e.target.value))} className={`${numberInputCls} block mt-0.5`} /></label>
                <label className="text-[11px] text-gray-400">Bottom<input type="number" min={0} max={40} value={printSettings.marginBottom} onChange={e => updateSetting('marginBottom', Number(e.target.value))} className={`${numberInputCls} block mt-0.5`} /></label>
                <label className="text-[11px] text-gray-400">Left<input type="number" min={0} max={40} value={printSettings.marginLeft} onChange={e => updateSetting('marginLeft', Number(e.target.value))} className={`${numberInputCls} block mt-0.5`} /></label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={settingLabelCls}>Scale — {printSettings.scale}%</span>
              <input type="range" min={50} max={150} step={5} value={printSettings.scale} onChange={e => updateSetting('scale', Number(e.target.value))} className="w-32" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={settingLabelCls}>Font Size — {printSettings.fontScale}%</span>
              <input type="range" min={70} max={130} step={5} value={printSettings.fontScale} onChange={e => updateSetting('fontScale', Number(e.target.value))} className="w-32" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={settingLabelCls}>Page Size</span>
              <select value={printSettings.pageSize} onChange={e => updateSetting('pageSize', e.target.value as PrintSettings['pageSize'])} className="border border-gray-200 rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={settingLabelCls}>Orientation</span>
              <select value={printSettings.orientation} onChange={e => updateSetting('orientation', e.target.value as PrintSettings['orientation'])} className="border border-gray-200 rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <button onClick={resetSettings} className="flex items-center gap-1.5 self-end px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        )}

        <div className="p-4 bg-gray-200 overflow-auto flex flex-col items-center gap-4">
          {pageStarts.map((start, i) => {
            const sliceHeight = (pageStarts[i + 1] ?? Infinity) - start
            return (
              <div key={i}>
                <p className="text-center text-xs text-gray-500 mb-1">Page {i + 1} of {pageStarts.length}</p>
                <div className="relative shadow-2xl bg-white" style={{ width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX, overflow: 'hidden' }}>
                  <div style={{ marginTop: -start }}>
                    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                      <DocumentTemplate document={effectiveDocument} company={company} customer={customer} printSettings={printSettings} />
                    </div>
                  </div>
                  {/* Mask the bit of content that would otherwise repeat at the top of the next page */}
                  {sliceHeight < PAGE_HEIGHT_PX && (
                    <div className="absolute left-0 right-0 bg-white" style={{ top: sliceHeight, bottom: 0 }} />
                  )}
                  {/* Only draw the label if the white gap below the real content is big enough to fit it */}
                  {i < pageStarts.length - 1 && PAGE_HEIGHT_PX - sliceHeight > 24 && (
                    <div className="absolute left-0 right-0 text-center text-xs italic text-gray-400" style={{ top: sliceHeight + 8 }}>
                      To be Continued...
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Hidden master copy — the actual target for Print and Download PDF */}
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
          <div ref={printRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            <DocumentTemplate document={effectiveDocument} company={company} customer={customer} printSettings={printSettings} />
          </div>
        </div>
      </div>
    </div>
  )
}
