import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Quotation } from '@/types'
import { generateDocNumber, generateDocNumberFromFormat } from '@/lib/utils'
import { useCompanyStore } from './useCompanyStore'
import { dbGetAll, dbUpsert, dbDelete, migrateLegacyArrayIfNeeded } from '@/lib/sqliteStorage'

const TABLE = 'quotations'

interface QuotationStore {
  quotations: Quotation[]
  loaded: boolean
  init: () => Promise<void>
  addQuotation: (q: Omit<Quotation, 'id' | 'number' | 'createdAt'>) => Quotation
  updateQuotation: (id: string, q: Partial<Quotation>) => void
  deleteQuotation: (id: string) => void
}

export const useQuotationStore = create<QuotationStore>()((set, get) => ({
  quotations: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return
    await migrateLegacyArrayIfNeeded<Quotation>('billing-quotations', TABLE, (parsed) => parsed?.state?.quotations)
    const quotations = await dbGetAll<Quotation>(TABLE)
    set({ quotations, loaded: true })
  },

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
    dbUpsert(TABLE, newQ)
    return newQ
  },

  updateQuotation: (id, q) => {
    let updated: Quotation | undefined
    set((state) => ({
      quotations: state.quotations.map((i) => {
        if (i.id !== id) return i
        updated = { ...i, ...q }
        return updated
      }),
    }))
    if (updated) dbUpsert(TABLE, updated)
  },

  deleteQuotation: (id) => {
    set((state) => ({ quotations: state.quotations.filter((i) => i.id !== id) }))
    dbDelete(TABLE, id)
  },
}))
