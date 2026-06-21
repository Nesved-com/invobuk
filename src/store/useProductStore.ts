import { electronStorage } from '@/lib/electronStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Product } from '@/types'

interface ProductStore {
  products: Product[]
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
}

type P = Omit<Product, 'id' | 'createdAt'>

const seed: P[] = [
  { name: 'Service for the month of',                                 hsnCode: '9987',     unit: 'Nos', rate: 20000,  gstRate: 18, category: 'AMC / Service',      description: '' },
  { name: 'Smoke detector installation charges',                      hsnCode: '9987',     unit: 'Nos', rate: 150,    gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Total cable laying charges',                               hsnCode: '9987',     unit: 'Mtr', rate: 25,     gstRate: 18, category: 'Cable Work',         description: '' },
  { name: 'Optical Smoke detector series 65',                         hsnCode: '8531',     unit: 'Nos', rate: 1200,   gstRate: 18, category: 'Fire Alarm',         description: '' },
  { name: '6W Metal Grill Celling Speaker Bosch',                     hsnCode: '8518',     unit: 'Nos', rate: 974,    gstRate: 18, category: 'PA System',          description: '' },
  { name: 'Installation Charges Fire alarm system & PA system',       hsnCode: '9987',     unit: 'Nos', rate: 13400,  gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Sterlite sm 6f fiber Cable laying charges',                hsnCode: '9987',     unit: 'Mtr', rate: 40,     gstRate: 18, category: 'Cable Work',         description: '' },
  { name: '3 Core cable laying charges',                              hsnCode: '9954',     unit: 'Mtr', rate: 55,     gstRate: 18, category: 'Cable Work',         description: '' },
  { name: 'Co2 Detector fixing charges',                              hsnCode: '995462',   unit: 'Nos', rate: 350,    gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Hooter fixing charges',                                    hsnCode: '9987',     unit: 'Nos', rate: 125,    gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Panel fixing charges',                                     hsnCode: '995462',   unit: 'Nos', rate: 550,    gstRate: 18, category: 'Installation',       description: '' },
  { name: '50 mm cable tray fixing charges',                          hsnCode: '995462',   unit: 'Mtr', rate: 150,    gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Welding for tray',                                         hsnCode: '995462',   unit: 'Nos', rate: 15000,  gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Glanding charges',                                         hsnCode: '995462',   unit: 'Nos', rate: 100,    gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Lan Cable Laying Charges',                                 hsnCode: '9983',     unit: 'Nos', rate: 30000,  gstRate: 18, category: 'Networking',         description: '' },
  { name: 'Fire Alarm AMC labour charges',                            hsnCode: '9983',     unit: 'Nos', rate: 5000,   gstRate: 18, category: 'AMC / Service',      description: '' },
  { name: 'Splicing ,Rack installation & IO Punchin',                 hsnCode: '9983',     unit: 'Nos', rate: 7000,   gstRate: 18, category: 'Networking',         description: '' },
  { name: 'Fire Alarm Panel 32 Zone',                                 hsnCode: '8531',     unit: 'Nos', rate: 46000,  gstRate: 18, category: 'Fire Alarm',         description: '' },
  { name: 'Conduite & RJ 45',                                        hsnCode: '9983',     unit: 'Nos', rate: 500,    gstRate: 18, category: 'Networking',         description: '' },
  { name: 'RJ 45 fitting Charges',                                    hsnCode: '9983',     unit: 'Nos', rate: 250,    gstRate: 18, category: 'Networking',         description: '' },
  { name: 'Cable laying charges',                                     hsnCode: '9983',     unit: 'Mtr', rate: 25,     gstRate: 18, category: 'Cable Work',         description: '' },
  { name: 'Conduite',                                                 hsnCode: '85446020', unit: 'Mtr', rate: 0,      gstRate: 18, category: 'Material',           description: '' },
  { name: 'Cat 6 Lan cable laying charges',                           hsnCode: '9983',     unit: 'Mtr', rate: 45,     gstRate: 18, category: 'Networking',         description: '' },
  { name: '24 Core cable laying charges',                             hsnCode: '9983',     unit: 'Mtr', rate: 100,    gstRate: 18, category: 'Cable Work',         description: '' },
  { name: 'Conduite laying charges',                                  hsnCode: '9983',     unit: 'Mtr', rate: 70,     gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Removing of old amplifier',                                hsnCode: '9985',     unit: 'Nos', rate: 9000,   gstRate: 18, category: 'PA System',          description: '' },
  { name: 'Repairing of existing mixer cum amplifier',                hsnCode: '9985',     unit: 'Nos', rate: 12000,  gstRate: 18, category: 'PA System',          description: '' },
  { name: 'CAT 6 ( D-link ) CABLE',                                  hsnCode: '8544',     unit: 'Mtr', rate: 60,     gstRate: 18, category: 'Networking',         description: '' },
  { name: 'IO Port, RJ45, IO box and IO plate',                       hsnCode: '8517',     unit: 'Nos', rate: 500,    gstRate: 18, category: 'Networking',         description: '' },
  { name: 'IO Port',                                                  hsnCode: '8517',     unit: 'Nos', rate: 210,    gstRate: 18, category: 'Networking',         description: '' },
  { name: 'Service for load balancing',                               hsnCode: '9985',     unit: 'Nos', rate: 9000,   gstRate: 18, category: 'PA System',          description: '' },
  { name: '1 SQMM X 4 CORE COPPER FLEXIBLE SHILDED BLUE CABLE',      hsnCode: '85446020', unit: 'Mtr', rate: 72,     gstRate: 18, category: 'Material',           description: '' },
  { name: 'H2 Detector installation charges',                        hsnCode: '9987',     unit: 'Nos', rate: 350,    gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Cl2 Detector Installation charges',                        hsnCode: '9987',     unit: 'Nos', rate: 500,    gstRate: 18, category: 'Installation',       description: '' },
  { name: 'Helmet Torch Araki-Plus 50 watt laser LED torch',          hsnCode: '85131090', unit: 'Nos', rate: 250,    gstRate: 18, category: 'Material',           description: '' },
  { name: 'Hardware material, Service, Electrical work',              hsnCode: '8536',     unit: 'Set', rate: 2000,   gstRate: 18, category: 'Material',           description: '' },
  { name: 'CABLE GLAND, FRLS, 3CX2.5SQMM',                          hsnCode: '9954',     unit: 'Set', rate: 300,    gstRate: 18, category: 'Material',           description: '' },
  { name: 'MOUNTING STAND FOR 1 KM SIREN',                           hsnCode: '8504',     unit: 'Nos', rate: 2500,   gstRate: 18, category: 'Fire Alarm',         description: '' },
  { name: '1 km double mounting siren - Kheraj',                      hsnCode: '8531',     unit: 'Nos', rate: 8990,   gstRate: 18, category: 'Fire Alarm',         description: '' },
  { name: 'Logic panel for emergency siren',                          hsnCode: '9030',     unit: 'Nos', rate: 65000,  gstRate: 18, category: 'Fire Alarm',         description: '' },
  { name: 'AMC-fire alarm detection system',                          hsnCode: '9987',     unit: 'Nos', rate: 20000,  gstRate: 18, category: 'AMC / Service',      description: '' },
  { name: 'Charges Towards AMC of Fire alarm system & smoke detector testing', hsnCode: '9987', unit: 'Nos', rate: 0, gstRate: 18, category: 'AMC / Service',  description: '' },
]

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      products: seed.map(p => ({ ...p, id: uuidv4(), createdAt: new Date().toISOString() })),
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, { ...product, id: uuidv4(), createdAt: new Date().toISOString() }],
        })),
      updateProduct: (id, product) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...product } : p)),
        })),
      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
    }),
    { name: 'billing-products-v2', storage: electronStorage }
  )
)
