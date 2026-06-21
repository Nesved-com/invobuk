import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { DeliveryChallan } from '@/types'
import { generateDocNumber, generateDocNumberFromFormat } from '@/lib/utils'
import { useCompanyStore } from './useCompanyStore'
import { dbGetAll, dbUpsert, dbDelete, migrateLegacyArrayIfNeeded } from '@/lib/sqliteStorage'

const TABLE = 'delivery_challans'

interface DeliveryChallanStore {
  challans: DeliveryChallan[]
  loaded: boolean
  init: () => Promise<void>
  addChallan: (challan: Omit<DeliveryChallan, 'id' | 'number' | 'createdAt'>) => DeliveryChallan
  updateChallan: (id: string, challan: Partial<DeliveryChallan>) => void
  deleteChallan: (id: string) => void
}

export const useDeliveryChallanStore = create<DeliveryChallanStore>()((set, get) => ({
  challans: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return
    await migrateLegacyArrayIfNeeded<DeliveryChallan>('billing-delivery-challans', TABLE, (parsed) => parsed?.state?.challans)
    const challans = await dbGetAll<DeliveryChallan>(TABLE)
    set({ challans, loaded: true })
  },

  addChallan: (challan) => {
    const format = useCompanyStore.getState().company.deliveryChallanNumberFormat
    const newChallan: DeliveryChallan = {
      ...challan,
      id: uuidv4(),
      number: format
        ? generateDocNumberFromFormat(format, get().challans.length)
        : generateDocNumber('DC', get().challans.length),
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ challans: [newChallan, ...state.challans] }))
    dbUpsert(TABLE, newChallan)
    return newChallan
  },

  updateChallan: (id, challan) => {
    let updated: DeliveryChallan | undefined
    set((state) => ({
      challans: state.challans.map((c) => {
        if (c.id !== id) return c
        updated = { ...c, ...challan }
        return updated
      }),
    }))
    if (updated) dbUpsert(TABLE, updated)
  },

  deleteChallan: (id) => {
    set((state) => ({ challans: state.challans.filter((c) => c.id !== id) }))
    dbDelete(TABLE, id)
  },
}))
