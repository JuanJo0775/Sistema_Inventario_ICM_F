import { create } from 'zustand'
import { 
  fetchCatalogProducts, 
  fetchCategories as fetchCategoriesService, 
  fetchBrands as fetchBrandsService, 
  createCatalogProduct, 
  updateCatalogProduct,
  deactivateCatalogProduct,
  restoreCatalogProduct,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  deactivateCategory as deactivateCategoryService,
  restoreCategory as restoreCategoryService,
  createBrand as createBrandService,
  updateBrand as updateBrandService,
  deactivateBrand as deactivateBrandService,
  restoreBrand as restoreBrandService
} from '../services/catalog'
import type {
  CatalogProduct as Product,
  CatalogCategory as Category,
  CatalogBrand as Brand,
  CatalogProductCreateInput,
  CatalogProductUpdateInput,
} from '../interfaces/catalog'

interface CatalogState {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  loading: boolean
  error: string | null
  
  fetchProducts: () => Promise<void>
  fetchCategories: (includeInactive?: boolean) => Promise<void>
  fetchBrands: (includeInactive?: boolean) => Promise<void>
  
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateProduct: (id: string | number, product: Partial<Product>) => Promise<void>
  deactivateProduct: (id: number | string) => Promise<void>
  restoreProduct: (id: number | string) => Promise<void>

  createCategory: (category: Omit<Category, 'id' | 'slug' | 'is_active'>) => Promise<void>
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>
  deactivateCategory: (id: string) => Promise<void>
  restoreCategory: (id: string) => Promise<void>

  createBrand: (brand: { name: string; description?: string }) => Promise<void>
  updateBrand: (id: string, brand: { name?: string; description?: string; is_active?: boolean }) => Promise<void>
  deactivateBrand: (id: string) => Promise<void>
  restoreBrand: (id: string) => Promise<void>
}

type ProductFormPayload = Partial<Product> &
  Partial<CatalogProductCreateInput> &
  Partial<CatalogProductUpdateInput>

const mapProductPayload = (productData: ProductFormPayload): CatalogProductCreateInput | CatalogProductUpdateInput => {
  const categoryId = productData.category_id ?? productData.category
  const subcategoryId = productData.subcategory_id ?? productData.subcategory ?? null
  const brand = productData.brand?.trim()

  const payload: CatalogProductCreateInput | CatalogProductUpdateInput = {
    sku: productData.sku,
    name: productData.name,
    category_id: categoryId,
    subcategory_id: subcategoryId || null,
    brand: brand || undefined,
    requires_cold_chain: productData.requires_cold_chain,
    requires_expiration: productData.requires_expiration,
    expiration_date: productData.expiration_date,
    weight_grams: productData.weight_grams,
    notes: productData.notes,
    reorder_point: productData.reorder_point,
    is_active: productData.is_active,
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as CatalogProductCreateInput | CatalogProductUpdateInput
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

  fetchBrands: async (includeInactive = true) => {
    set({ loading: true, error: null })
    try {
      const brands = await fetchBrandsService(includeInactive)
      set({ brands: brands as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  createProduct: async (productData) => {
    set({ loading: true, error: null })
    try {
      await createCatalogProduct(mapProductPayload(productData) as CatalogProductCreateInput)
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
      await updateCatalogProduct(id.toString(), mapProductPayload(productData) as CatalogProductUpdateInput)
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
  },

  createBrand: async (brandData) => {
    set({ loading: true, error: null })
    try {
      await createBrandService({ name: brandData.name, description: brandData.description })
      const brands = await fetchBrandsService(true)
      set({ brands: brands as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  updateBrand: async (id, brandData) => {
    set({ loading: true, error: null })
    try {
      await updateBrandService(id, brandData as any)
      const brands = await fetchBrandsService(true)
      set({ brands: brands as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  deactivateBrand: async (id) => {
    set({ loading: true, error: null })
    try {
      await deactivateBrandService(id)
      const brands = await fetchBrandsService(true)
      set({ brands: brands as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  restoreBrand: async (id) => {
    set({ loading: true, error: null })
    try {
      await restoreBrandService(id)
      const brands = await fetchBrandsService(true)
      set({ brands: brands as any, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  }
}))

export default useCatalogStore
