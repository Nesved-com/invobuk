import { useParams, Link } from 'react-router-dom'
import DocumentEditor from '@/components/shared/DocumentEditor'
import { usePurchaseOrderStore } from '@/store/usePurchaseOrderStore'

export default function PurchaseOrderEdit() {
  const { id } = useParams()
  const { purchaseOrders, updatePO } = usePurchaseOrderStore()
  const po = purchaseOrders.find(p => p.id === id)

  if (!po) return (
    <div className="text-center py-16 text-gray-400">
      <p>Purchase order not found.</p>
      <Link to="/purchase-orders" className="text-brand-600 hover:underline mt-2 block">Back to purchase orders</Link>
    </div>
  )

  const handleSave = (data: any) => {
    updatePO(po.id, data)
    return po
  }

  return (
    <DocumentEditor
      docType="purchase-order"
      onSave={handleSave}
      backPath="/purchase-orders"
      initialData={po}
    />
  )
}
