import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserStore {
  firstName: string
  lastName: string
  setUser: (firstName: string, lastName: string) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      firstName: '',
      lastName: '',
      setUser: (firstName, lastName) => set({ firstName, lastName }),
    }),
    { name: 'billing-user', storage: electronStorage }
  )
)
