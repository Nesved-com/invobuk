import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  passwordHash: string      // SHA-256 hex of the password; empty = not set up yet
  isLoggedIn: boolean
  setupDone: boolean        // true once user has set a password for the first time
  setPassword: (hash: string) => void
  login: () => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      passwordHash: '',
      isLoggedIn: false,
      setupDone: false,
      setPassword: (hash) => set({ passwordHash: hash, setupDone: true }),
      login: () => set({ isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false }),
    }),
    { name: 'billing-auth-v1', storage: electronStorage }
  )
)

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
