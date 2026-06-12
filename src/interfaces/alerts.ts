export type AlertType =
  | "LOW_STOCK"
  | "EXPIRATION_30"
  | "EXPIRATION_60"
  | "COLD_CHAIN_MISSING"
  | "STOCK_MISMATCH";

export interface AlertItem {
  id: string;
  product: string; // UUID del producto
  product_sku: string; // sku resuelto por el backend
  location: string | null; // UUID de ubicación o null si es alerta global
  alert_type: AlertType;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null; // UUID del usuario que resolvió, no el nombre
  created_at: string;
  lot_code?: string | null;
}
