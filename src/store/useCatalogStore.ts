import { create } from 'zustand'
import { api } from '../services/api'
import { 
  fetchCategories as fetchCategoriesService, 
  fetchBrands as fetchBrandsService, 
  createCatalogProduct, 
  updateCatalogProduct,
  deactivateCatalogProduct,
  restoreCatalogProduct,
  updateCatalogProductPrices,
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
  CatalogProductPricesInput,
} from '../interfaces/catalog'

interface CatalogState {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  loading: boolean
  error: string | null
  productCount: number
  productPage: number
  productPageSize: number
  
  fetchProducts: (params?: { page?: number; search?: string; category?: string; page_size?: number }) => Promise<void>
  fetchCategories: (includeInactive?: boolean) => Promise<void>
  fetchBrands: (includeInactive?: boolean) => Promise<void>
  
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product>
  updateProduct: (id: string | number, product: Partial<Product>) => Promise<void>
  updateProductPrices: (id: string, prices: CatalogProductPricesInput) => Promise<void>
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
    requires_lot: productData.requires_lot,
    requires_serial_number: productData.requires_serial_number,
    special_conditions: productData.special_conditions,
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

// Helper reutilizable: carga productos del catálogo y mezcla stockTotal desde /inventory/
async function fetchProductsWithStock(
  page = 1,
  search?: string,
  category?: string,
  pageSize = 25,
): Promise<{ products: Product[]; count: number }> {

  const [productsResp, inventoryResp] = await Promise.allSettled([
    api.get<any>('/catalog/products/', {
      params: {
        include_inactive: 'true',
        page,
        page_size: pageSize,
        search: search || undefined,
        category: category || undefined,
      },
    }),
    api.get<Array<{ product_id: string; total: number }>>('/inventory/'),
  ])

  let catalogProducts: Product[] = []
  let count = 0
  if (productsResp.status === 'fulfilled') {
    const data = productsResp.value.data
    if (Array.isArray(data)) {
      catalogProducts = data
      count = data.length
    } else {
      catalogProducts = data.results ?? []
      count = data.count ?? catalogProducts.length
    }
  }

  let stockMap: Record<string, number> = {}
  if (inventoryResp.status === 'fulfilled') {
    const invData = inventoryResp.value.data
    const rows = Array.isArray(invData)
      ? invData
      : (invData as any)?.results ?? []
    rows.forEach((row: { product_id: string; total: number }) => {
      stockMap[row.product_id] = row.total
    })
  }

  return {
    products: catalogProducts.map((p: any) => ({
      ...p,
      stockTotal: stockMap[p.id] ?? p.stockTotal ?? 0,
    })),
    count,
  }
}

const useCatalogStore = create<CatalogState>((set) => ({
  products: [],
  categories: [],
  brands: [],
  loading: false,
  error: null,
  productCount: 0,
  productPage: 1,
  productPageSize: 25,

  fetchProducts: async (params) => {
    set({ loading: true, error: null })
    try {
      const page = params?.page ?? 1
      const ps = params?.page_size ?? 25
      const { products, count } = await fetchProductsWithStock(page, params?.search, params?.category, ps)
      set({ products: products as any, productCount: count, productPage: page, loading: false })
    } catch (err: any) {
      set({ error: err.humanMessage || err.message, loading: false })
    }
  },

  fetchCategories: async (includeInactive = true) => {
    set({ loading: true, error: null })
    try {
      const categories = await fetchCategoriesService(includeInactive)
      set({ categories: categories as any, loading: false })
    } catch (err: any) {
      set({ error: err.humanMessage || err.message, loading: false })
    }
  },

  fetchBrands: async (includeInactive = true) => {
    set({ loading: true, error: null })
    try {
      const brands = await fetchBrandsService(includeInactive)
      set({ brands: brands as any, loading: false })
    } catch (err: any) {
      set({ error: err.humanMessage || err.message, loading: false })
    }
  },

  createProduct: async (productData) => {
    set({ error: null })
    try {
      const created = await createCatalogProduct(mapProductPayload(productData) as CatalogProductCreateInput)
      return created as Product
    } catch (err: any) {
      set({ error: err.humanMessage || err.message })
      throw err
    }
  },

  updateProduct: async (id, productData) => {
    set({ error: null })
    try {
      const payload = mapProductPayload(productData) as CatalogProductUpdateInput
      // SKU es inmutable (BR-12); el backend rechaza cualquier cambio.
      // Omitirlo evita el falso positivo de validate_sku cuando se reedita
      // con el mismo SKU (el serializer no recibe la instancia actual).
      delete (payload as any).sku
      await updateCatalogProduct(id.toString(), payload)
    } catch (err: any) {
      set({ error: err.humanMessage || err.message })
      throw err
    }
  },

  updateProductPrices: async (id, prices) => {
    set({ error: null })
    try {
      await updateCatalogProductPrices(id, prices)
    } catch (err: any) {
      set({ error: err.humanMessage || err.message })
      throw err
    }
  },

  deactivateProduct: async (id) => {
    set({ error: null })
    try {
      await deactivateCatalogProduct(id.toString())
    } catch (err: any) {
      set({ error: err.humanMessage || err.message })
      throw err
    }
  },

  restoreProduct: async (id) => {
    set({ error: null })
    try {
      await restoreCatalogProduct(id.toString())
    } catch (err: any) {
      set({ error: err.humanMessage || err.message })
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
      set({ error: err.humanMessage || err.message, loading: false })
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
      set({ error: err.humanMessage || err.message, loading: false })
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
      set({ error: err.humanMessage || err.message, loading: false })
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
      set({ error: err.humanMessage || err.message, loading: false })
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
      set({ error: err.humanMessage || err.message, loading: false })
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
      set({ error: err.humanMessage || err.message, loading: false })
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
      set({ error: err.humanMessage || err.message, loading: false })
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
      set({ error: err.humanMessage || err.message, loading: false })
      throw err
    }
  }
}))

export default useCatalogStore
