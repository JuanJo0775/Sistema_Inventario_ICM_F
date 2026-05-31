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
  try {
    const response = await api.get<InventoryListResponse<InventoryCategory>>(
      '/catalog/categories/',
    )
    return normalizeList(response.data)
  } catch (error) {
    console.warn(
      'Error al cargar categorías del backend real. Usando datos mock de contingencia.',
      error,
    )
    return mockCategories
  }
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
  try {
    const response = await api.get<InventoryListResponse<InventorySubcategory>>(
      '/catalog/subcategories/',
      {
        params: categoryId ? { category: categoryId } : undefined,
      },
    )
    return normalizeList(response.data)
  } catch (error) {
    console.warn(
      'Error al cargar subcategorías del backend real. Usando datos mock de contingencia.',
      error,
    )
    if (!categoryId) {
      return mockSubcategories
    }
    return mockSubcategories.filter(
      (subcategory) => String(subcategory.category) === String(categoryId),
    )
  }
}

type FetchProductsParams = {
  search?: string
  category?: string | number
  subcategory?: string | number
  limit?: number
  offset?: number
}

export const fetchProducts = async (params: FetchProductsParams) => {
  const getMockProducts = () => {
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

  if (useMocks) {
    return getMockProducts()
  }

  try {
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
  } catch (error) {
    console.warn(
      'Error al buscar productos en el backend real. Usando datos mock de contingencia.',
      error,
    )
    return getMockProducts()
  }
}

export const fetchProductStock = async (productId: string | number) => {
  const getMockStock = () => {
    return mockStockByProduct[String(productId)] ?? {
      product_id: String(productId),
      total: 0,
      by_location: [],
    }
  }

  if (useMocks) {
    return getMockStock()
  }

  try {
    const response = await api.get<InventoryStockByProduct>(
      `/inventory/products/${productId}/stock/`,
    )
    return response.data
  } catch (error) {
    console.warn(
      'Error al cargar el stock del producto en el backend real. Usando datos mock de contingencia.',
      error,
    )
    return getMockStock()
  }
}
