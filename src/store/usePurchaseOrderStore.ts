import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { PurchaseOrder } from '@/types'
import { generateDocNumber, generateDocNumberFromFormat } from '@/lib/utils'
import { useCompanyStore } from './useCompanyStore'

interface POStore {
  purchaseOrders: PurchaseOrder[]
  addPO: (po: Omit<PurchaseOrder, 'id' | 'number' | 'createdAt'>) => PurchaseOrder
  updatePO: (id: string, po: Partial<PurchaseOrder>) => void
  deletePO: (id: string) => void
}

export const usePurchaseOrderStore = create<POStore>()(
  persist(
    (set, get) => ({
      purchaseOrders: [],
      addPO: (po) => {
        const format = useCompanyStore.getState().company.purchaseOrderNumberFormat
        const newPO: PurchaseOrder = {
          ...po,
          id: uuidv4(),
          number: format
            ? generateDocNumberFromFormat(format, get().purchaseOrders.length)
            : generateDocNumber('PO', get().purchaseOrders.length),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ purchaseOrders: [newPO, ...state.purchaseOrders] }))
        return newPO
      },
      updatePO: (id, po) =>
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((i) => (i.id === id ? { ...i, ...po } : i)),
        })),
      deletePO: (id) =>
        set((state) => ({ purchaseOrders: state.purchaseOrders.filter((i) => i.id !== id) })),
    }),
    { name: 'billing-purchase-orders', storage: electronStorage }
  )
)
