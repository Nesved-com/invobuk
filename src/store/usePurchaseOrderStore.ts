import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { PurchaseOrder } from '@/types'
import { generateDocNumber, generateDocNumberFromFormat } from '@/lib/utils'
import { useCompanyStore } from './useCompanyStore'
import { dbGetAll, dbUpsert, dbDelete, migrateLegacyArrayIfNeeded } from '@/lib/sqliteStorage'

const TABLE = 'purchase_orders'

interface POStore {
  purchaseOrders: PurchaseOrder[]
  loaded: boolean
  init: () => Promise<void>
  addPO: (po: Omit<PurchaseOrder, 'id' | 'number' | 'createdAt'>) => PurchaseOrder
  updatePO: (id: string, po: Partial<PurchaseOrder>) => void
  deletePO: (id: string) => void
}

export const usePurchaseOrderStore = create<POStore>()((set, get) => ({
  purchaseOrders: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return
    await migrateLegacyArrayIfNeeded<PurchaseOrder>('billing-purchase-orders', TABLE, (parsed) => parsed?.state?.purchaseOrders)
    const purchaseOrders = await dbGetAll<PurchaseOrder>(TABLE)
    set({ purchaseOrders, loaded: true })
  },

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
    dbUpsert(TABLE, newPO)
    return newPO
  },

  updatePO: (id, po) => {
    let updated: PurchaseOrder | undefined
    set((state) => ({
      purchaseOrders: state.purchaseOrders.map((i) => {
        if (i.id !== id) return i
        updated = { ...i, ...po }
        return updated
      }),
    }))
    if (updated) dbUpsert(TABLE, updated)
  },

  deletePO: (id) => {
    set((state) => ({ purchaseOrders: state.purchaseOrders.filter((i) => i.id !== id) }))
    dbDelete(TABLE, id)
  },
}))
