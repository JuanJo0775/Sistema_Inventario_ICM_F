import { api } from "./api";
import type {
  InventoryCategory,
  InventoryProduct,
  InventoryStockByProduct,
  InventorySubcategory,
} from "../interfaces/inventory";
import { useMocks } from "../mocks/config";
import {
  mockCategories,
  mockProducts,
  mockStockByProduct,
  mockSubcategories,
} from "../mocks/inventory";

// El backend devuelve listas directas o paginadas
type PaginatedResponse<T> = {
  count: number;
  results: T[];
  next: string | null;
  previous: string | null;
};
type ListResponse<T> = T[] | PaginatedResponse<T>;

const normalizeList = <T>(payload: ListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  if ("results" in payload) return payload.results ?? [];
  return [];
};

export const fetchCategories = async (): Promise<InventoryCategory[]> => {
  if (useMocks) return mockCategories;

  const response = await api.get<ListResponse<InventoryCategory>>(
    "/catalog/categories/",
  );
  return normalizeList(response.data);
};

export const fetchSubcategories = async (
  categoryId?: string,
): Promise<InventorySubcategory[]> => {
  if (useMocks) {
    if (!categoryId) return mockSubcategories;
    return mockSubcategories.filter(
      (sub) => String(sub.category) === String(categoryId),
    );
  }

  const response = await api.get<ListResponse<InventorySubcategory>>(
    "/catalog/brands/",
    {
      params: categoryId ? { category: categoryId } : undefined,
    },
  );
  return normalizeList(response.data);
};

type FetchProductsParams = {
  search?: string;
  category?: string;
  subcategory?: string;
  /** Número de resultados por página (equivale a page_size en el backend). */
  limit?: number;
  /** Número de página (1-indexed). */
  page?: number;
};

export const fetchProducts = async (
  params: FetchProductsParams,
): Promise<InventoryProduct[]> => {
  if (useMocks) {
    const search = params.search?.trim().toLowerCase();
    return mockProducts.filter((product) => {
      if (
        params.category &&
        String(product.category) !== String(params.category)
      ) {
        return false;
      }
      if (
        params.subcategory &&
        String(product.subcategory) !== String(params.subcategory)
      ) {
        return false;
      }
      if (!search) return true;
      const haystack = [product.name, product.sku, product.barcode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  const response = await api.get<ListResponse<InventoryProduct>>(
    "/inventory/search/",
    {
      params: {
        // El backend usa 'q' como parámetro de búsqueda
        q: params.search || undefined,
        category: params.category || undefined,
        subcategory: params.subcategory || undefined,
        // El backend usa PageNumberPagination: page_size y page (no limit/offset)
        page_size: params.limit,
        page: params.page,
      },
    },
  );
  return normalizeList(response.data);
};

export const fetchProductStock = async (
  productId: string,
): Promise<InventoryStockByProduct> => {
  if (useMocks) {
    return (
      mockStockByProduct[productId] ?? {
        product_id: productId,
        total: 0,
        by_location: [],
        per_location: [],
      }
    );
  }

  const response = await api.get<InventoryStockByProduct>(
    `/inventory/products/${productId}/stock/`,
  );
  return response.data;
};
