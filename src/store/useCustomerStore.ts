import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Customer } from '@/types'

interface CustomerStore {
  customers: Customer[]
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      customers: [],
      addCustomer: (customer) => {
        const newCustomer: Customer = { ...customer, id: uuidv4(), createdAt: new Date().toISOString() }
        set((state) => ({ customers: [...state.customers, newCustomer] }))
        return newCustomer
      },
      updateCustomer: (id, customer) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...customer } : c)),
        })),
      deleteCustomer: (id) =>
        set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })),
    }),
    { name: 'billing-customers-v2', storage: electronStorage }
  )
)
