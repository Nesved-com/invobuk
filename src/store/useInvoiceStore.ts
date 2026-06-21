import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Invoice } from '@/types'
import { generateDocNumber, generateDocNumberFromFormat } from '@/lib/utils'
import { useCompanyStore } from './useCompanyStore'
import { dbGetAll, dbUpsert, dbDelete, migrateLegacyArrayIfNeeded } from '@/lib/sqliteStorage'

const TABLE = 'invoices'

interface InvoiceStore {
  invoices: Invoice[]
  loaded: boolean
  init: () => Promise<void>
  addInvoice: (invoice: Omit<Invoice, 'id' | 'number' | 'createdAt'>) => Invoice
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
}

export const useInvoiceStore = create<InvoiceStore>()((set, get) => ({
  invoices: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return
    await migrateLegacyArrayIfNeeded<Invoice>('billing-invoices', TABLE, (parsed) => parsed?.state?.invoices)
    const invoices = await dbGetAll<Invoice>(TABLE)
    set({ invoices, loaded: true })
  },

  addInvoice: (invoice) => {
    const format = useCompanyStore.getState().company.invoiceNumberFormat
    const newInvoice: Invoice = {
      ...invoice,
      id: uuidv4(),
      number: format
        ? generateDocNumberFromFormat(format, get().invoices.length)
        : generateDocNumber('RE', get().invoices.length),
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ invoices: [newInvoice, ...state.invoices] }))
    dbUpsert(TABLE, newInvoice)
    return newInvoice
  },

  updateInvoice: (id, invoice) => {
    let updated: Invoice | undefined
    set((state) => ({
      invoices: state.invoices.map((i) => {
        if (i.id !== id) return i
        updated = { ...i, ...invoice }
        return updated
      }),
    }))
    if (updated) dbUpsert(TABLE, updated)
  },

  deleteInvoice: (id) => {
    set((state) => ({ invoices: state.invoices.filter((i) => i.id !== id) }))
    dbDelete(TABLE, id)
  },
}))
