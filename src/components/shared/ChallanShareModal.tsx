import { X, Download, Printer } from 'lucide-react'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'
import type { DeliveryChallan } from '@/types'
import ChallanTemplate from './ChallanTemplate'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useCustomerStore } from '@/store/useCustomerStore'

interface Props {
  document: DeliveryChallan
  onClose: () => void
}

export default function ChallanShareModal({ document, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const { company } = useCompanyStore()
  const { customers } = useCustomerStore()
  const customer = customers.find(c => c.id === document.customerId)

  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    toast.loading('Generating PDF...')
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, windowWidth: 794 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight)
      pdf.save(`${document.number}.pdf`)
      toast.dismiss()
      toast.success('PDF downloaded!')
    } catch {
      toast.dismiss()
      toast.error('Failed to generate PDF')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Delivery Challan Preview</h2>
            <p className="text-xs text-gray-400">{document.number}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-200 overflow-auto flex justify-center">
          <div className="shadow-2xl bg-white" style={{ width: '794px' }}>
            <ChallanTemplate ref={printRef} document={document} company={company} customer={customer} />
          </div>
        </div>
      </div>
    </div>
  )
}
