import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { DeliveryChallan } from '@/types'
import { generateDocNumber, generateDocNumberFromFormat } from '@/lib/utils'
import { useCompanyStore } from './useCompanyStore'

interface DeliveryChallanStore {
  challans: DeliveryChallan[]
  addChallan: (challan: Omit<DeliveryChallan, 'id' | 'number' | 'createdAt'>) => DeliveryChallan
  updateChallan: (id: string, challan: Partial<DeliveryChallan>) => void
  deleteChallan: (id: string) => void
}

export const useDeliveryChallanStore = create<DeliveryChallanStore>()(
  persist(
    (set, get) => ({
      challans: [],
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
        return newChallan
      },
      updateChallan: (id, challan) =>
        set((state) => ({
          challans: state.challans.map((c) => (c.id === id ? { ...c, ...challan } : c)),
        })),
      deleteChallan: (id) =>
        set((state) => ({ challans: state.challans.filter((c) => c.id !== id) })),
    }),
    { name: 'billing-delivery-challans', storage: electronStorage }
  )
)
