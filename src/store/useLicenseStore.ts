import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LicenseStore {
  licenseKey: string
  customerName: string
  expiresAt: string // ISO timestamp
  activatedAt: string
  lastVerifiedAt: string
  isActivated: boolean
  activate: (licenseKey: string, customerName: string, expiresAt: string) => void
  touchVerified: (expiresAt: string) => void
  deactivate: () => void
}

export const useLicenseStore = create<LicenseStore>()(
  persist(
    (set) => ({
      licenseKey: '',
      customerName: '',
      expiresAt: '',
      activatedAt: '',
      lastVerifiedAt: '',
      isActivated: false,
      activate: (licenseKey, customerName, expiresAt) => {
        const now = new Date().toISOString()
        set({ licenseKey, customerName, expiresAt, activatedAt: now, lastVerifiedAt: now, isActivated: true })
      },
      touchVerified: (expiresAt) => set({ expiresAt, lastVerifiedAt: new Date().toISOString() }),
      deactivate: () => set({ licenseKey: '', customerName: '', expiresAt: '', activatedAt: '', lastVerifiedAt: '', isActivated: false }),
    }),
    { name: 'invobuk-license-v2', storage: electronStorage }
  )
)
