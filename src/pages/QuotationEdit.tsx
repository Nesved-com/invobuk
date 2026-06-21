import { useParams, Link } from 'react-router-dom'
import DocumentEditor from '@/components/shared/DocumentEditor'
import { useQuotationStore } from '@/store/useQuotationStore'

export default function QuotationEdit() {
  const { id } = useParams()
  const { quotations, updateQuotation } = useQuotationStore()
  const quotation = quotations.find(q => q.id === id)

  if (!quotation) return (
    <div className="text-center py-16 text-gray-400">
      <p>Quotation not found.</p>
      <Link to="/quotations" className="text-brand-600 hover:underline mt-2 block">Back to quotations</Link>
    </div>
  )

  const handleSave = (data: any) => {
    updateQuotation(quotation.id, data)
    return quotation
  }

  return (
    <DocumentEditor
      docType="quotation"
      onSave={handleSave}
      backPath="/quotations"
      initialData={quotation}
    />
  )
}
