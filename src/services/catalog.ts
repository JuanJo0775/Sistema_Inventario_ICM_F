import { api } from './api'
import type {
  CatalogCategory,
  CatalogBrand,
  CatalogProduct,
  CatalogProductCreateInput,
  CatalogProductUpdateInput,
} from '../interfaces/catalog'
import { useMocks } from '../mocks/config'
import {
  mockGetCategories,
  mockCreateCategory,
  mockUpdateCategory,
  mockDeactivateCategory,
  mockRestoreCategory,
  mockGetBrands,
  mockCreateBrand,
  mockUpdateBrand,
  mockDeactivateBrand,
  mockRestoreBrand,
  mockGetProducts,
  mockGetProductDetail,
  mockCreateProduct,
  mockUpdateProduct,
  mockDeactivateProduct,
  mockRestoreProduct,
} from '../mocks/catalog'

// Helper to handle pagination if returned from backend, else return array
type BackendListResponse<T> = T[] | { results?: T[]; count?: number }
const normalizeList = <T,>(payload: BackendListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload
  return payload.results ?? []
}

// ==========================================
// CATEGORIES SERVICE
// ==========================================

export const fetchCategories = async (includeInactive = false): Promise<CatalogCategory[]> => {
  if (useMocks) {
    return mockGetCategories(includeInactive)
  }
  try {
    const response = await api.get<BackendListResponse<CatalogCategory>>('/catalog/categories/', {
      params: { include_inactive: includeInactive ? 'true' : undefined },
    })
    return normalizeList(response.data)
  } catch (error) {
    console.error('Real API error in fetchCategories, using fallback mocks', error)
    return mockGetCategories(includeInactive)
  }
}

export const createCategory = async (data: {
  name: string
  description?: string
  requires_serial_number?: boolean
  is_returnable?: boolean
}): Promise<CatalogCategory> => {
  if (useMocks) {
    return mockCreateCategory(data)
  }
  const response = await api.post<CatalogCategory>('/catalog/categories/', data)
  return response.data
}

export const updateCategory = async (
  id: string,
  data: Partial<CatalogCategory>,
): Promise<CatalogCategory> => {
  if (useMocks) {
    return mockUpdateCategory(id, data)
  }
  const response = await api.patch<CatalogCategory>(`/catalog/categories/${id}/`, data)
  return response.data
}

export const deactivateCategory = async (id: string): Promise<void> => {
  if (useMocks) {
    return mockDeactivateCategory(id)
  }
  await api.delete(`/catalog/categories/${id}/`)
}

export const restoreCategory = async (id: string): Promise<CatalogCategory> => {
  if (useMocks) {
    return mockRestoreCategory(id)
  }
  const response = await api.post<CatalogCategory>(`/catalog/categories/${id}/restore/`)
  return response.data
}

// ==========================================
// BRANDS (SUBCATEGORIES) SERVICE
// ==========================================

export const fetchBrands = async (
  includeInactive = false,
  categoryId?: string,
): Promise<CatalogBrand[]> => {
  if (useMocks) {
    let list = mockGetBrands(includeInactive)
    if (categoryId) {
      list = list.filter((b) => String(b.category) === String(categoryId))
    }
    return list
  }
  try {
    const response = await api.get<BackendListResponse<CatalogBrand>>('/catalog/subcategories/', {
      params: {
        include_inactive: includeInactive ? 'true' : undefined,
        category: categoryId || undefined,
      },
    })
    return normalizeList(response.data)
  } catch (error) {
    console.error('Real API error in fetchBrands, using fallback mocks', error)
    let list = mockGetBrands(includeInactive)
    if (categoryId) {
      list = list.filter((b) => String(b.category) === String(categoryId))
    }
    return list
  }
}

export const createBrand = async (data: {
  category_id: string
  name: string
}): Promise<CatalogBrand> => {
  if (useMocks) {
    return mockCreateBrand(data)
  }
  const response = await api.post<CatalogBrand>('/catalog/subcategories/', data)
  return response.data
}

export const updateBrand = async (
  id: string,
  data: { category_id?: string; name?: string },
): Promise<CatalogBrand> => {
  if (useMocks) {
    return mockUpdateBrand(id, data)
  }
  const response = await api.patch<CatalogBrand>(`/catalog/subcategories/${id}/`, data)
  return response.data
}

export const deactivateBrand = async (id: string): Promise<void> => {
  if (useMocks) {
    return mockDeactivateBrand(id)
  }
  await api.delete(`/catalog/subcategories/${id}/`)
}

export const restoreBrand = async (id: string): Promise<CatalogBrand> => {
  if (useMocks) {
    return mockRestoreBrand(id)
  }
  const response = await api.post<CatalogBrand>(`/catalog/subcategories/${id}/restore/`)
  return response.data
}

// ==========================================
// PRODUCTS SERVICE
// ==========================================

export type FetchCatalogProductsParams = {
  search?: string
  category?: string
  subcategory?: string
  include_inactive?: boolean
  page?: number
}

export const fetchCatalogProducts = async (
  params?: FetchCatalogProductsParams,
): Promise<CatalogProduct[]> => {
  if (useMocks) {
    return mockGetProducts(params)
  }
  try {
    const response = await api.get<BackendListResponse<CatalogProduct>>('/catalog/products/', {
      params: {
        search: params?.search || undefined,
        category: params?.category || undefined,
        include_inactive: params?.include_inactive ? 'true' : undefined,
        page: params?.page || undefined,
      },
    })
    return normalizeList(response.data)
  } catch (error) {
    console.error('Real API error in fetchCatalogProducts, using fallback mocks', error)
    return mockGetProducts(params)
  }
}

export const fetchCatalogProductDetail = async (id: string): Promise<CatalogProduct> => {
  if (useMocks) {
    return mockGetProductDetail(id)
  }
  const response = await api.get<CatalogProduct>(`/catalog/products/${id}/`)
  return response.data
}

export const createCatalogProduct = async (
  data: CatalogProductCreateInput,
): Promise<CatalogProduct> => {
  if (useMocks) {
    return mockCreateProduct(data as Partial<CatalogProduct>)
  }
  try {
    const response = await api.post<CatalogProduct>('/catalog/products/', data)
    return response.data
  } catch (error) {
    console.error('Real API error in createCatalogProduct, using fallback mocks', error)
    return mockCreateProduct(data as Partial<CatalogProduct>)
  }
}

export const updateCatalogProduct = async (
  id: string,
  data: CatalogProductUpdateInput,
): Promise<CatalogProduct> => {
  if (useMocks) {
    return mockUpdateProduct(id, data as Partial<CatalogProduct>)
  }
  try {
    const response = await api.patch<CatalogProduct>(`/catalog/products/${id}/`, data)
    return response.data
  } catch (error) {
    console.error('Real API error in updateCatalogProduct, using fallback mocks', error)
    return mockUpdateProduct(id, data as Partial<CatalogProduct>)
  }
}

export const deactivateCatalogProduct = async (id: string): Promise<void> => {
  if (useMocks) {
    return mockDeactivateProduct(id)
  }
  try {
    await api.delete(`/catalog/products/${id}/`)
  } catch (error) {
    console.error('Real API error in deactivateCatalogProduct, using fallback mocks', error)
    return mockDeactivateProduct(id)
  }
}

export const restoreCatalogProduct = async (id: string): Promise<CatalogProduct> => {
  if (useMocks) {
    return mockRestoreProduct(id)
  }
  try {
    const response = await api.post<CatalogProduct>(`/catalog/products/${id}/restore/`)
    return response.data
  } catch (error) {
    console.error('Real API error in restoreCatalogProduct, using fallback mocks', error)
    return mockRestoreProduct(id)
  }
}

// Fetch Barcode Payload
export const fetchCatalogProductBarcode = async (id: string) => {
  if (useMocks) {
    const detail = mockGetProductDetail(id)
    return {
      product_id: id,
      sku: detail.sku,
      name: detail.name,
      barcode: detail.barcode,
      barcode_type: 'Code128',
      barcode_svg: detail.barcode_svg,
      barcode_svg_data_uri: detail.barcode_svg_data_uri,
      render_format: 'svg',
    }
  }
  const response = await api.get(`/catalog/products/${id}/barcode/`)
  return response.data
}
