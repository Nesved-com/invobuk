import type { PersistStorage } from 'zustand/middleware'

const isElectron = typeof window !== 'undefined' && !!(window as any).electronStore
const es = isElectron ? (window as any).electronStore : null

// PersistStorage handles JSON serialization itself (getItem returns parsed object,
// setItem receives the state object). This avoids the StateStorage/PersistStorage
// type mismatch in newer Zustand versions.
export const electronStorage: PersistStorage<unknown> = {
  getItem: async (name: string) => {
    const raw = es ? await es.get(name) : localStorage.getItem(name)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  setItem: async (name: string, value: unknown) => {
    const str = JSON.stringify(value)
    if (es) {
      await es.set(name, str)
    } else {
      localStorage.setItem(name, str)
    }
  },

  removeItem: async (name: string) => {
    if (es) {
      await es.remove(name)
    } else {
      localStorage.removeItem(name)
    }
  },
}
