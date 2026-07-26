import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { getFinancialYear } from '@/lib/utils'
import { dbGetAll, dbUpsert, dbDelete, migrateLegacyArrayIfNeeded } from '@/lib/sqliteStorage'

const TABLE = 'supplier_pos'

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
  // Key under which the original uploaded PDF bytes are saved on disk (via
  // electronExport.saveIncomingPoPdf) — lets a later monthly export copy the real
  // original file instead of regenerating one from the extracted data.
  pdfFileId?: string
  createdAt: string
}

interface SupplierPOStore {
  orders: SupplierPO[]
  loaded: boolean
  init: () => Promise<void>
  addOrder: (order: Omit<SupplierPO, 'id' | 'number' | 'createdAt'>) => SupplierPO
  updateOrder: (id: string, data: Partial<SupplierPO>) => void
  deleteOrder: (id: string) => void
}

export const useSupplierPOStore = create<SupplierPOStore>()((set, get) => ({
  orders: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return
    await migrateLegacyArrayIfNeeded<SupplierPO>('billing-supplier-po-v1', TABLE, (parsed) => parsed?.state?.orders)
    const orders = await dbGetAll<SupplierPO>(TABLE)
    set({ orders, loaded: true })
  },

  addOrder: (order) => {
    const count = get().orders.length
    const newOrder: SupplierPO = {
      ...order,
      id: uuidv4(),
      number: `PO-${getFinancialYear()}-${String(count + 1).padStart(2, '0')}`,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ orders: [newOrder, ...state.orders] }))
    dbUpsert(TABLE, newOrder)
    return newOrder
  },

  updateOrder: (id, data) => {
    let updated: SupplierPO | undefined
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== id) return o
        updated = { ...o, ...data }
        return updated
      }),
    }))
    if (updated) dbUpsert(TABLE, updated)
  },

  deleteOrder: (id) => {
    set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }))
    dbDelete(TABLE, id)
  },
}))
