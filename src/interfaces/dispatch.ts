export type DispatchStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "dispatched"
  | "blocked";

export interface DispatchLocation {
  id: string;
  code: string;
  name: string;
  capacityLabel: string;
}

export interface DispatchItem {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  expectedQuantity: number;
  dispatchedQuantity: number;
  status: DispatchStatus;
  requiresSerial: boolean;
  requiresColdChain: boolean;
  lotId?: string;
  serialNumber?: string;
}

export interface DispatchMovement {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  locationCode: string;
  operator: string;
  confirmedAt: string;
  invoiceNumber?: string;
  customerName?: string;
  note?: string;
}

// Datos del cliente que exige el backend para SALIDA_VENTA_MAYOR
export interface DispatchCustomerData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  privacy_notice_acknowledged: boolean;
}

export interface DispatchSubmitPayload {
  productId: string;
  locationId: string;
  quantity: number;
  movementType: string;
  scannedCode?: string | null;
  orderSku?: string | null;
  serialNumber?: string | null;
  // customer_data con los campos exactos que exige el backend
  customerData?: DispatchCustomerData | null;
  note?: string;
  coldChainAcknowledged?: boolean;
  electricalSafetyAcknowledged?: boolean;
  privacyNoticeAcknowledged?: boolean;
}

// Respuesta exacta de MovementSerializer del backend
export interface DispatchMovementResponse {
  id: string;
  movement_type: string;
  product: string;
  product_sku: string;
  origin_location: string | null;
  destination_location: string | null;
  quantity: number;
  serial_number: string | null;
  invoice_number: string | null;
  invoice_pdf: string | null;
  executed_by: string;
  created_at: string;
  note: string | null;
}
