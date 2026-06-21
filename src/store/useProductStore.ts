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

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      products: [],
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
