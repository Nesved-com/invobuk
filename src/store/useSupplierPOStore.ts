import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { getFinancialYear } from '@/lib/utils'

export interface SupplierPOItem {
  id: string
  materialCode: string
  description: string
  specification: string
  hsnCode: string
  quantity: number
  unit: string
  rate: number
  gstRate: number
  amount: number
  cgst: number
  sgst: number
  igst: number
  total: number
}

export interface SupplierPO {
  id: string
  number: string
  supplierInvoiceNo: string
  date: string
  supplierName: string
  supplierAddress: string
  supplierGST: string
  supplierState: string
  vendorCode: string
  deliveryDate: string
  paymentTerms: string
  deliveryTerms: string
  scopeOfSupply: string
  items: SupplierPOItem[]
  subtotal: number
  totalCgst: number
  totalSgst: number
  totalIgst: number
  totalGst: number
  grandTotal: number
  gstType: 'intra' | 'inter'
  notes: string
  status: 'pending' | 'received' | 'partial' | 'cancelled'
  sourceType: 'pdf' | 'manual'
  pdfName?: string
  createdAt: string
}

interface SupplierPOStore {
  orders: SupplierPO[]
  addOrder: (order: Omit<SupplierPO, 'id' | 'number' | 'createdAt'>) => SupplierPO
  updateOrder: (id: string, data: Partial<SupplierPO>) => void
  deleteOrder: (id: string) => void
}

export const useSupplierPOStore = create<SupplierPOStore>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => {
        const count = get().orders.length
        const newOrder: SupplierPO = {
          ...order,
          id: uuidv4(),
          number: `PO-${getFinancialYear()}-${String(count + 1).padStart(2, '0')}`,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ orders: [newOrder, ...state.orders] }))
        return newOrder
      },
      updateOrder: (id, data) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...data } : o)),
        })),
      deleteOrder: (id) =>
        set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),
    }),
    { name: 'billing-supplier-po-v1', storage: electronStorage }
  )
)
