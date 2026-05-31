import { create } from 'zustand'
import { 
  fetchCatalogProducts, 
  fetchCategories, 
  fetchBrands, 
  createCatalogProduct, 
  updateCatalogProduct,
  deactivateCatalogProduct,
  restoreCatalogProduct
} from '../services/catalog'
import type { Product, Category, Brand } from '../interfaces/catalog'

interface CatalogState {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  loading: boolean
  error: string | null
  
  fetchProducts: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchBrands: () => Promise<void>
  
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateProduct: (id: string | number, product: Partial<Product>) => Promise<void>
  deactivateProduct: (id: number | string) => Promise<void>
  restoreProduct: (id: number | string) => Promise<void>
}

const useCatalogStore = create<CatalogState>((set) => ({
  products: [],
  categories: [],
  brands: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null })
    try {
      const products = await fetchCatalogProducts({ include_inactive: true })
      set({ products: products as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  fetchCategories: async () => {
    set({ loading: true, error: null })
    try {
      const categories = await fetchCategories()
      set({ categories: categories as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  fetchBrands: async () => {
    set({ loading: true, error: null })
    try {
      const brands = await fetchBrands()
      set({ brands: brands as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  createProduct: async (productData) => {
    set({ loading: true, error: null })
    try {
      await createCatalogProduct(productData as any)
      const products = await fetchCatalogProducts({ include_inactive: true })
      set({ products: products as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true, error: null })
    try {
      await updateCatalogProduct(id.toString(), productData as any)
      const products = await fetchCatalogProducts({ include_inactive: true })
      set({ products: products as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  deactivateProduct: async (id) => {
    set({ loading: true, error: null })
    try {
      await deactivateCatalogProduct(id.toString())
      const products = await fetchCatalogProducts({ include_inactive: true })
      set({ products: products as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  restoreProduct: async (id) => {
    set({ loading: true, error: null })
    try {
      await restoreCatalogProduct(id.toString())
      const products = await fetchCatalogProducts({ include_inactive: true })
      set({ products: products as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  }
}))

export default useCatalogStore
