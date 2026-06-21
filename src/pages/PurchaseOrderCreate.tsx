import DocumentEditor from '@/components/shared/DocumentEditor'
import { usePurchaseOrderStore } from '@/store/usePurchaseOrderStore'

export default function PurchaseOrderCreate() {
  const { addPO } = usePurchaseOrderStore()
  return (
    <DocumentEditor
      docType="purchase-order"
      onSave={(data) => ({ ...addPO(data as any), type: 'purchase-order' })}
      backPath="/purchase-orders"
    />
  )
}
