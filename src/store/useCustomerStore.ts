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

const seed: Omit<Customer, 'id' | 'createdAt'>[] = [
  { name: 'Sterlite technologies Ltd', address: 'E-1,E2,E-3 & Gut No 14 ,Waluj Aurangabad 431136', gstNumber: '27AAECS8719B1ZC', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '+91-240-2558654' },
  { name: 'Safire Engineers', address: '1&2 , 1 FLOOR,PAREKH MARKET,OLD WING M.G.ROAD,GHATKOPAR-(E) MUMBAI 400077', gstNumber: '27AAAPN8680R1ZT', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '+91 98334 22651' },
  { name: 'Geekaysindia', address: 'G-42, Lake city Mall, near McDonalds, kapurbawadi, Junction Thane : 400607', gstNumber: '27APVPB0248K1ZN', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '+912221024101' },
  { name: 'ANOKHI INTERIOR DÉCOR', address: 'Pareira house , shastri nagar,Kanjur VillageRoad ,Kanjur Marg East Mumbai', gstNumber: '27AKSPC6246L1ZN', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '+91 90049 98478' },
  { name: 'Oxxus Technologies Pvt Ltd', address: 'Office No. 602,6th floor,Platinum Techno Park,Sector-30A,Plot No-17/18, Vasai, 400703', gstNumber: '27AABCO9466G1Z3', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '+91 88282 30015' },
  { name: 'EXZONE SOLUTIONS', address: 'B-108 ,Jainam Arcade, B.T. Mills Compound,LBS Marg ,Bhandup-West,Mumbai-400078', gstNumber: '27AHGPK6660H1Z5', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '+91 86520 84785' },
  { name: 'Mogli Labs (India) Pvt Ltd', address: 'Plot No. X-47/7, Ambedkar chowk, MIDC waluj Aurangabad', gstNumber: '27AAJCM7312H1ZE', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '+91-7798279696' },
  { name: 'Sterlite Technologies Limited', address: 'Plot No. AL-23,MIDC, Shendra, AURANGABAD-431201 Maharashtra', gstNumber: '27AAECS8719B1ZC', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '+91-240-2622020' },
  { name: 'CANPACK INDIA PRIVATE LIMITED', address: '(Glass Bottles Branch) H-14/1, MIDC Area, Waluj, 431136 Aurangabad, Maharashtra India', gstNumber: '27AADCC2125J1ZW', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '0240-6655555' },
  { name: 'Infrared Analytical LLP', address: 'Tata Power, 1st Floor, Industrial Area Unit-118, Globe Estate, Building, Ajade Golivali, Kalyan East, Kalyan, Thane , Maharashtra- 421 306', gstNumber: '27AAIFI0357C1ZO', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '9766894092' },
  { name: 'Sterlite Technologies Limited (Shendra 2)', address: 'Plot No A-1/7 MIDC Shendra, Five Star Industrial Area Aurangabad-431201 Maharashtra India', gstNumber: '27AAECS8719B1ZC', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '91-240-2558400' },
  { name: 'Sterlite Tech Cables Solutions Limited', address: 'Plot No B-10/4 & B-10/3/21,MIDC Waluj Industrial Area Waluj , Aurangabad-431136 Maharashtra India', gstNumber: '27ABCCS9492E1ZY', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '91-240-2558400' },
  { name: 'UNITED BREWERIES LTD.', address: 'Plot No. L- 10,11,MIDC, Industrial Area Waluj Aurangabad 431136', gstNumber: '27AAACU6053C1ZL', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '0240-6602877' },
  { name: 'Shri Venkatesh Electric company', address: 'Plot No E-24, Chilkathana MIDC Chatrapati Sambhajinagar', gstNumber: '27AEIFS4539N2ZA', vendorCode: '', state: 'Maharashtra', stateCode: '27', phone: '9370224395' },
  { name: 'National Fire Service', address: 'Nr, Mansi Hotel,Sahakar Peth, Shop no.2, Station Road Wapi ( E )-396 191.Gujrat India', gstNumber: '24AEPPM6887C1Z3', vendorCode: '', state: 'Gujarat', stateCode: '24', phone: '9377019252' },
]

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      customers: seed.map(c => ({ ...c, id: uuidv4(), createdAt: new Date().toISOString() })),
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
