import { useLocation } from 'react-router-dom'
import DocumentEditor from '@/components/shared/DocumentEditor'
import { useInvoiceStore } from '@/store/useInvoiceStore'

export default function InvoiceCreate() {
  const { addInvoice } = useInvoiceStore()
  const location = useLocation()
  const prefill = (location.state as any)?.initialData

  const handleSave = (data: any) => {
    return { ...addInvoice(data), type: 'invoice' }
  }

  return (
    <DocumentEditor
      docType="invoice"
      onSave={handleSave}
      backPath="/invoices"
      initialData={prefill}
    />
  )
}
