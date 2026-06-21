import DocumentEditor from '@/components/shared/DocumentEditor'
import { useQuotationStore } from '@/store/useQuotationStore'

export default function QuotationCreate() {
  const { addQuotation } = useQuotationStore()
  return (
    <DocumentEditor
      docType="quotation"
      onSave={(data) => ({ ...addQuotation(data as any), type: 'quotation' })}
      backPath="/quotations"
    />
  )
}
