import { api } from './api'

export interface BarcodeProductResult {
  id: string | number
  name: string
  sku: string
  barcode: string
  category?: string | number | null
  category_name?: string
  subcategory?: string | number | null
  stockTotal?: number | null
  requires_cold_chain?: boolean
  requires_serial_number?: boolean
  // Returns / adjustments extra fields
  canReturn?: boolean
  productId?: string
}

export interface ProductBarcodePayload {
  /** El valor exacto del código de barras almacenado en BD */
  barcode: string
  /** Simbología, ej. "Code128" */
  barcode_type: string
  /** SVG completo como string */
  barcode_svg: string
  /** Data URI del SVG para <img src="..."> */
  barcode_svg_data_uri: string
}

/**
 * Resuelve un identificador flexible (barcode, SKU o nombre parcial) a un producto.
 *
 * Endpoint real del backend (BR-13):
 *   GET /catalog/products/resolve/?q=<identifier>
 *
 * El backend busca por: SKU exacto → barcode exacto → nombre parcial (en ese orden).
 */
export const fetchProductByBarcode = async (
  identifier: string,
): Promise<BarcodeProductResult> => {
  const response = await api.get<BarcodeProductResult>(
    '/catalog/products/resolve/',
    { params: { q: identifier } },
  )
  return response.data
}

/**
 * Obtiene el barcode oficial generado por el backend para un producto.
 *
 * Endpoint:
 *   GET /catalog/products/<uuid>/barcode/
 *
 * Devuelve el string exacto almacenado en BD (y que fue impreso/generado por el backend),
 * junto con el SVG ya renderizado.
 */
export const fetchProductBarcodePayload = async (
  productId: string | number,
): Promise<ProductBarcodePayload> => {
  const response = await api.get<ProductBarcodePayload>(
    `/catalog/products/${productId}/barcode/`,
  )
  return response.data
}
