import { useParams, Link } from 'react-router-dom'
import DocumentEditor from '@/components/shared/DocumentEditor'
import { useInvoiceStore } from '@/store/useInvoiceStore'

export default function InvoiceEdit() {
  const { id } = useParams()
  const { invoices, updateInvoice } = useInvoiceStore()
  const invoice = invoices.find(i => i.id === id)

  if (!invoice) return (
    <div className="text-center py-16 text-gray-400">
      <p>Invoice not found.</p>
      <Link to="/invoices" className="text-brand-600 hover:underline mt-2 block">Back to invoices</Link>
    </div>
  )

  const handleSave = (data: any) => {
    updateInvoice(invoice.id, data)
    return invoice
  }

  return (
    <DocumentEditor
      docType="invoice"
      onSave={handleSave}
      backPath="/invoices"
      initialData={invoice}
    />
  )
}
