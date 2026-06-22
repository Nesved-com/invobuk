import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserStore {
  firstName: string
  lastName: string
  email: string
  phone: string
  setUser: (firstName: string, lastName: string, email?: string, phone?: string) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      setUser: (firstName, lastName, email, phone) =>
        set({ firstName, lastName, email: email ?? get().email, phone: phone ?? get().phone }),
    }),
    { name: 'billing-user', storage: electronStorage }
  )
)
