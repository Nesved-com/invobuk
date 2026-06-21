import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SyncStore {
  googleClientId: string
  syncEnabled: boolean
  autoSync: boolean
  autoSyncIntervalMinutes: number
  lastSyncAt: string | null
  lastSyncStatus: 'success' | 'error' | null
  lastSyncError: string | null
  setGoogleClientId: (id: string) => void
  setSyncEnabled: (v: boolean) => void
  setAutoSync: (v: boolean) => void
  setAutoSyncInterval: (mins: number) => void
  setLastSync: (status: 'success' | 'error', error?: string) => void
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      googleClientId: '',
      syncEnabled: false,
      autoSync: false,
      autoSyncIntervalMinutes: 30,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastSyncError: null,
      setGoogleClientId: (googleClientId) => set({ googleClientId }),
      setSyncEnabled: (syncEnabled) => set({ syncEnabled }),
      setAutoSync: (autoSync) => set({ autoSync }),
      setAutoSyncInterval: (autoSyncIntervalMinutes) => set({ autoSyncIntervalMinutes }),
      setLastSync: (status, error) => set({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: status,
        lastSyncError: error ?? null,
      }),
    }),
    { name: 'billing-sync-settings', storage: electronStorage }
  )
)
