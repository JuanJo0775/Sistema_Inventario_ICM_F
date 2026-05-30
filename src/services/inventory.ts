import { api } from './api'
import type {
  InventoryCategory,
  InventoryProduct,
  InventoryStockByProduct,
  InventorySubcategory,
} from '../interfaces/inventory'
import { useMocks } from '../mocks/config'
import {
  mockCategories,
  mockProducts,
  mockStockByProduct,
  mockSubcategories,
} from '../mocks/inventory'

type InventoryListResponse<T> = T[] | { results?: T[] }

const normalizeList = <T,>(payload: InventoryListResponse<T>) =>
  Array.isArray(payload) ? payload : payload.results ?? []

export const fetchCategories = async () => {
  if (useMocks) {
    return mockCategories
  }
  const response = await api.get<InventoryListResponse<InventoryCategory>>(
    '/catalog/categories/',
  )
  return normalizeList(response.data)
}

export const fetchSubcategories = async (categoryId?: string | number) => {
  if (useMocks) {
    if (!categoryId) {
      return mockSubcategories
    }
    return mockSubcategories.filter(
      (subcategory) => String(subcategory.category) === String(categoryId),
    )
  }
  const response = await api.get<InventoryListResponse<InventorySubcategory>>(
    '/catalog/subcategories/',
    {
      params: categoryId ? { category: categoryId } : undefined,
    },
  )
  return normalizeList(response.data)
}

type FetchProductsParams = {
  search?: string
  category?: string | number
  subcategory?: string | number
  limit?: number
  offset?: number
}

export const fetchProducts = async (params: FetchProductsParams) => {
  if (useMocks) {
    const search = params.search?.trim().toLowerCase()
    return mockProducts.filter((product) => {
      if (params.category && String(product.category) !== String(params.category)) {
        return false
      }
      if (
        params.subcategory &&
        String(product.subcategory) !== String(params.subcategory)
      ) {
        return false
      }
      if (!search) {
        return true
      }
      const haystack = [product.name, product.sku, product.barcode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  }
  const response = await api.get<InventoryListResponse<InventoryProduct>>(
    '/inventory/search/',
    {
      params: {
        q: params.search,
        category: params.category,
        subcategory: params.subcategory,
        limit: params.limit,
        offset: params.offset,
      },
    },
  )
  return normalizeList(response.data)
}

export const fetchProductStock = async (productId: string | number) => {
  if (useMocks) {
    return mockStockByProduct[String(productId)] ?? {
      product_id: String(productId),
      total: 0,
      by_location: [],
    }
  }
  const response = await api.get<InventoryStockByProduct>(
    `/inventory/products/${productId}/stock/`,
  )
  return response.data
}
