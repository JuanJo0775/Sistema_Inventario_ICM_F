import { create } from 'zustand'
import { 
  fetchCatalogProducts, 
  fetchCategories as fetchCategoriesService, 
  fetchBrands, 
  createCatalogProduct, 
  updateCatalogProduct,
  deactivateCatalogProduct,
  restoreCatalogProduct,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  deactivateCategory as deactivateCategoryService,
  restoreCategory as restoreCategoryService
} from '../services/catalog'
import type { CatalogProduct as Product, CatalogCategory as Category, CatalogBrand as Brand } from '../interfaces/catalog'

interface CatalogState {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  loading: boolean
  error: string | null
  
  fetchProducts: () => Promise<void>
  fetchCategories: (includeInactive?: boolean) => Promise<void>
  fetchBrands: () => Promise<void>
  
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateProduct: (id: string | number, product: Partial<Product>) => Promise<void>
  deactivateProduct: (id: number | string) => Promise<void>
  restoreProduct: (id: number | string) => Promise<void>

  createCategory: (category: Omit<Category, 'id' | 'slug' | 'is_active'>) => Promise<void>
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>
  deactivateCategory: (id: string) => Promise<void>
  restoreCategory: (id: string) => Promise<void>
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

  fetchCategories: async (includeInactive = true) => {
    set({ loading: true, error: null })
    try {
      const categories = await fetchCategoriesService(includeInactive)
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
  },

  createCategory: async (categoryData) => {
    set({ loading: true, error: null })
    try {
      await createCategoryService(categoryData)
      const categories = await fetchCategoriesService(true)
      set({ categories: categories as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ loading: true, error: null })
    try {
      await updateCategoryService(id, categoryData)
      const categories = await fetchCategoriesService(true)
      set({ categories: categories as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  deactivateCategory: async (id) => {
    set({ loading: true, error: null })
    try {
      await deactivateCategoryService(id)
      const categories = await fetchCategoriesService(true)
      set({ categories: categories as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  restoreCategory: async (id) => {
    set({ loading: true, error: null })
    try {
      await restoreCategoryService(id)
      const categories = await fetchCategoriesService(true)
      set({ categories: categories as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  }
}))

export default useCatalogStore
