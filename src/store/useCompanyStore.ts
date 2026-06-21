import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Company } from '@/types'

interface CompanyStore {
  company: Company
  setCompany: (company: Company) => void
}

const defaultCompany: Company = {
  name: 'Your Company Name',
  address: 'Office: 123, Business Street, Main Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '400001',
  phone: '+91 98765 43210',
  email: 'info@yourcompany.com',
  gstNumber: '27AAAAA0000A1Z5',
  panNumber: 'AAAAA0000A',
  vendorId: 'VND-001',
  bankName: 'State Bank of India',
  accountNumber: '1234567890',
  ifscCode: 'SBIN0000001',
  declaration: 'Certified that the particulars given above are true & correct and that there is no additional consideration flowing, directly or indirectly from buyer.',
  defaultPaymentTerms: '1 Month',
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      company: defaultCompany,
      setCompany: (company) => set({ company }),
    }),
    { name: 'billing-company', storage: electronStorage }
  )
)
