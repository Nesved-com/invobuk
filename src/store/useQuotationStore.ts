import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Quotation } from '@/types'
import { generateDocNumber, generateDocNumberFromFormat } from '@/lib/utils'
import { useCompanyStore } from './useCompanyStore'

interface QuotationStore {
  quotations: Quotation[]
  addQuotation: (q: Omit<Quotation, 'id' | 'number' | 'createdAt'>) => Quotation
  updateQuotation: (id: string, q: Partial<Quotation>) => void
  deleteQuotation: (id: string) => void
}

export const useQuotationStore = create<QuotationStore>()(
  persist(
    (set, get) => ({
      quotations: [],
      addQuotation: (q) => {
        const format = useCompanyStore.getState().company.quotationNumberFormat
        const newQ: Quotation = {
          ...q,
          id: uuidv4(),
          number: format
            ? generateDocNumberFromFormat(format, get().quotations.length)
            : generateDocNumber('QTN', get().quotations.length),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ quotations: [newQ, ...state.quotations] }))
        return newQ
      },
      updateQuotation: (id, q) =>
        set((state) => ({
          quotations: state.quotations.map((i) => (i.id === id ? { ...i, ...q } : i)),
        })),
      deleteQuotation: (id) =>
        set((state) => ({ quotations: state.quotations.filter((i) => i.id !== id) })),
    }),
    { name: 'billing-quotations', storage: electronStorage }
  )
)
