import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Invoice } from '@/types'
import { generateDocNumber, generateDocNumberFromFormat } from '@/lib/utils'
import { useCompanyStore } from './useCompanyStore'

interface InvoiceStore {
  invoices: Invoice[]
  addInvoice: (invoice: Omit<Invoice, 'id' | 'number' | 'createdAt'>) => Invoice
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],
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
        return newInvoice
      },
      updateInvoice: (id, invoice) =>
        set((state) => ({
          invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...invoice } : i)),
        })),
      deleteInvoice: (id) =>
        set((state) => ({ invoices: state.invoices.filter((i) => i.id !== id) })),
    }),
    { name: 'billing-invoices', storage: electronStorage }
  )
)
