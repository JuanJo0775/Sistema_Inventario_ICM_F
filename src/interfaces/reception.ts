export type ReceptionStatus =
  | "pending"
  | "partial"
  | "ready"
  | "received"
  | "blocked";

export interface ReceptionLocation {
  id: string;
  code: string;
  name: string;
  capacityLabel: string;
}

export interface ReceptionExpectedOrder {
  id: string;
  purchaseOrder: string;
  supplier: string;
  invoice: string;
  productId: string; // UUID real del producto en el backend
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  expectedQuantity: number;
  receivedQuantity: number;
  locationId: string;
  dueDate: string;
  status: ReceptionStatus;
  requiresSerial: boolean;
  requiresColdChain: boolean;
  lot?: string;
  expirationDate?: string;
}

export interface ReceptionMovement {
  id: string;
  productName: string; // construido en el frontend desde product_sku
  sku: string;
  quantity: number;
  locationCode: string; // construido en el frontend desde destination_location
  operator: string; // construido en el frontend desde executed_by
  confirmedAt: string; // construido en el frontend desde created_at
  discrepancyNote?: string;
}

export interface ReceptionOverview {
  locations: ReceptionLocation[];
  expectedOrders: ReceptionExpectedOrder[];
  recentMovements: ReceptionMovement[];
}

// Lo que el frontend envía al servicio
export interface ReceptionSubmitPayload {
  productId: string; // UUID del producto
  locationId: string; // UUID de la ubicación destino
  quantity: number; // cantidad recibida
  qtyInvoiced?: number; // cantidad facturada (para detectar discrepancia)
  serialNumber?: string; // solo el primero, backend acepta uno por movimiento
  discrepancyNote?: string;
  coldChainAcknowledged: boolean;
  electricalSafetyAcknowledged: boolean;
}

// Lo que el backend devuelve en MovementSerializer
export interface ReceptionMovementResponse {
  id: string;
  movement_type: string;
  product: string;
  product_sku: string;
  origin_location: string | null;
  destination_location: string | null;
  quantity: number;
  serial_number: string | null;
  quantity_invoiced: number | null;
  discrepancy_note: string | null;
  executed_by: string;
  created_at: string;
}

