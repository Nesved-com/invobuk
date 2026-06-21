import { X, Download, Printer, Copy } from 'lucide-react'
import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'
import type { BaseDocument } from '@/types'
import DocumentTemplate from './DocumentTemplate'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import { COPY_TYPE_PRESETS } from '@/lib/copyTypes'

interface Props {
  document: BaseDocument & { type: string; validUntil?: string; expectedDelivery?: string; kindAttention?: string; enquirySource?: string; enquiryDate?: string }
  onClose: () => void
  autoDownload?: boolean
}

const PAGE_WIDTH_PX = 794
const PAGE_HEIGHT_PX = Math.round(PAGE_WIDTH_PX * 297 / 210) // A4 aspect at 794px width

// Bottom edge (in CSS px, relative to `container`'s top) of every table row —
// these are the only places a page is allowed to break, so no row ever gets cut in half.
function getRowBoundaries(container: HTMLElement): number[] {
  const containerRect = container.getBoundingClientRect()
  return Array.from(container.querySelectorAll('tr'))
    .map(el => el.getBoundingClientRect().bottom - containerRect.top)
    .sort((a, b) => a - b)
}

// Given the total content height and a target page height, returns the top offset
// of each page, snapping each break to the nearest row boundary at or before it.
function computePageStarts(totalHeight: number, pageHeight: number, rowBoundaries: number[]): number[] {
  const starts = [0]
  let consumed = 0
  while (consumed < totalHeight) {
    const idealBreak = consumed + pageHeight
    let brk = idealBreak
    if (idealBreak < totalHeight) {
      const candidates = rowBoundaries.filter(b => b > consumed + 1 && b <= idealBreak)
      if (candidates.length) brk = candidates[candidates.length - 1]
    } else {
      brk = totalHeight
    }
    consumed = brk
    if (consumed < totalHeight) starts.push(consumed)
  }
  return starts
}

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
  const effectiveDocument = { ...document, copyType }

  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    toast.loading('Generating PDF...')
    try {
      const rowBoundariesCss = getRowBoundaries(printRef.current)

      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, windowWidth: 794 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pxPerMm = canvas.width / imgWidth
      const pageHeightPx = pageHeight * pxPerMm
      const rowBoundariesPx = rowBoundariesCss.map(y => y * pxPerMm)
      const starts = computePageStarts(canvas.height, pageHeightPx, rowBoundariesPx)

      starts.forEach((start, i) => {
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -(start / pxPerMm), imgWidth, imgHeight)
        // Each page break is snapped to a row boundary that may land before the full
        // page height — without this, the untouched image would show that same sliver
        // of content again at the top of the next page. Mask it out with white.
        const sliceHeightMm = ((starts[i + 1] ?? canvas.height) - start) / pxPerMm
        if (sliceHeightMm < pageHeight - 0.1) {
          pdf.setFillColor(255, 255, 255)
          pdf.rect(0, sliceHeightMm, pdfWidth, pageHeight - sliceHeightMm, 'F')
        }
      })

      const copySlug = copyType ? `-${copyType.split(' - ')[0].replace(/\s+/g, '')}` : ''
      pdf.save(`${document.number}${copySlug}.pdf`)
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
  }, [document, company, customer, autoDownload, copyType])

  if (autoDownload) {
    return (
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
        <DocumentTemplate ref={printRef} document={effectiveDocument} company={company} customer={customer} />
      </div>
    )
  }

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

        <div className="p-4 bg-gray-200 overflow-auto flex flex-col items-center gap-4">
          {pageStarts.map((start, i) => {
            const sliceHeight = (pageStarts[i + 1] ?? Infinity) - start
            return (
              <div key={i}>
                <p className="text-center text-xs text-gray-500 mb-1">Page {i + 1} of {pageStarts.length}</p>
                <div className="relative shadow-2xl bg-white" style={{ width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX, overflow: 'hidden' }}>
                  <div style={{ marginTop: -start }}>
                    <DocumentTemplate document={effectiveDocument} company={company} customer={customer} />
                  </div>
                  {/* Mask the bit of content that would otherwise repeat at the top of the next page */}
                  {sliceHeight < PAGE_HEIGHT_PX && (
                    <div className="absolute left-0 right-0 bg-white" style={{ top: sliceHeight, bottom: 0 }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Hidden master copy — the actual target for Print and Download PDF */}
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
          <DocumentTemplate ref={printRef} document={effectiveDocument} company={company} customer={customer} />
        </div>
      </div>
    </div>
  )
}
