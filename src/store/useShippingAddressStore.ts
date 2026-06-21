import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface ShippingAddress {
  id: string
  name: string
  address: string
  city: string
  state: string
  pincode: string
  gstNumber: string
  phone: string
  createdAt: string
}

interface ShippingAddressStore {
  addresses: ShippingAddress[]
  addAddress: (addr: Omit<ShippingAddress, 'id' | 'createdAt'>) => void
  updateAddress: (id: string, addr: Partial<ShippingAddress>) => void
  deleteAddress: (id: string) => void
}

export const useShippingAddressStore = create<ShippingAddressStore>()(
  persist(
    (set) => ({
      addresses: [],
      addAddress: (addr) =>
        set((state) => ({
          addresses: [...state.addresses, { ...addr, id: uuidv4(), createdAt: new Date().toISOString() }],
        })),
      updateAddress: (id, addr) =>
        set((state) => ({
          addresses: state.addresses.map((a) => (a.id === id ? { ...a, ...addr } : a)),
        })),
      deleteAddress: (id) =>
        set((state) => ({ addresses: state.addresses.filter((a) => a.id !== id) })),
    }),
    { name: 'billing-shipping-addresses-v1', storage: electronStorage }
  )
)
