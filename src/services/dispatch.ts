import { api } from "./api";
import { useMocks } from "../mocks/config";
import {
  mockDispatchLocations,
  mockDispatchMovements,
} from "../mocks/dispatch";
import type {
  DispatchLocation,
  DispatchMovement,
  DispatchMovementResponse,
  DispatchSubmitPayload,
} from "../interfaces/dispatch";

export interface CartSubmitItem {
  productId: string
  locationId: string
  quantity: number
  unitPrice: number | null
  movementType: string
  scannedCode?: string | null
  orderSku?: string | null
  serialNumber?: string | null
  lotId?: string | null
  note?: string
}

export interface CartSubmissionResult {
  movements: DispatchMovement[]
  invoiceNumber: string | null
}

export interface DispatchOverview {
  locations: DispatchLocation[];
  recentMovements: DispatchMovement[];
}

const mapMovementResponse = (
  mov: DispatchMovementResponse,
  locationCode: string,
): DispatchMovement => ({
  id: mov.id,
  productName: mov.product_sku,
  sku: mov.product_sku,
  quantity: mov.quantity,
  locationCode,
  operator: mov.executed_by,
  confirmedAt: new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(mov.created_at)),
  invoiceNumber: mov.invoice_number ?? undefined,
  note: mov.note ?? undefined,
});

export const fetchDispatchOverview = async (): Promise<DispatchOverview> => {
  if (useMocks) {
    return {
      locations: mockDispatchLocations,
      recentMovements: mockDispatchMovements,
    };
  }

  try {
    const [locationsRes, movementsRes] =
      await Promise.all([
        api.get<
          | Array<{ id: string; code: string; name: string }>
          | {
              results: Array<{ id: string; code: string; name: string }>;
            }
        >("/inventory/locations/"),
        api.get<{ results: DispatchMovementResponse[] }>(
          "/movements/dispatches/",
          { params: { page_size: 10, ordering: "-created_at" } },
        ),
      ]);

    const locData = Array.isArray(locationsRes.data)
      ? locationsRes.data
      : locationsRes.data.results;
    const locations = locData.map((loc) => ({
      id: loc.id,
      code: loc.code,
      name: loc.name,
      capacityLabel: "",
    }));

    const locationCodeById = new Map(
      locData.map((loc) => [loc.id, loc.code]),
    );

    const recentMovements: DispatchMovement[] = movementsRes.data.results.map(
      (mov) => {
        const locationCode = mov.origin_location
          ? (locationCodeById.get(mov.origin_location) ?? mov.origin_location)
          : "-";
        return mapMovementResponse(mov, locationCode);
      },
    );

    return {
      locations,
      recentMovements,
    };
  } catch (err) {
    console.error("Error cargando overview de despacho:", err);
    throw err;
  }
};

export const submitDispatch = async (
  payload: DispatchSubmitPayload,
): Promise<DispatchMovement> => {
  if (useMocks) {
    const location = mockDispatchLocations.find(
      (l) => l.id === payload.locationId,
    );

    return {
      id: `mov-out-${Date.now()}`,
      productName: "Producto",
      sku: "SKU",
      quantity: payload.quantity,
      locationCode: location?.code ?? "-",
      operator: "Auxiliar Despacho",
      confirmedAt: new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
      invoiceNumber: "ICM-MOCK",
      customerName: payload.customerData?.customer_name,
      note: payload.note,
    };
  }

  // Construye el body exacto que espera DispatchCreateSerializer
  const requestBody = {
    product_id: payload.productId,
    location_id: payload.locationId,
    quantity: payload.quantity,
    movement_type: payload.movementType,
    unit_price: payload.unitPrice ?? null,
    // BR-08: ambos o ninguno, nunca solo uno
    scanned_code: payload.scannedCode || null,
    order_sku: payload.orderSku || null,
    serial_number: payload.serialNumber || null,
    customer_data: payload.customerData ?? null,
    note: payload.note || '',
    cold_chain_acknowledged: payload.coldChainAcknowledged ?? false,
    electrical_safety_acknowledged:
      payload.electricalSafetyAcknowledged ?? false,
    privacy_notice_acknowledged: payload.privacyNoticeAcknowledged ?? false,
  };

  const response = await api.post<DispatchMovementResponse>(
    "/movements/dispatches/",
    requestBody,
  );

  const mov = response.data;
  const locationCode = mov.origin_location ?? "-";

  return mapMovementResponse(mov, locationCode);
};

export const submitCart = async (
  items: CartSubmitItem[],
  customerData: DispatchSubmitPayload["customerData"],
  flags?: {
    coldChainAck?: boolean;
    electricalSafetyAck?: boolean;
    privacyNoticeAck?: boolean;
  },
): Promise<CartSubmissionResult> => {
  if (useMocks) {
    const location = mockDispatchLocations.find(
      (l) => items.length > 0 && l.id === items[0].locationId,
    );
    const invoiceNum = `ICM-${String(Math.floor(Math.random() * 9000 + 1000))}`;
    const movements: DispatchMovement[] = items.map((item, i) => ({
      id: `mov-out-${Date.now()}-${i}`,
      productName: item.orderSku ?? "Producto",
      sku: item.orderSku ?? "SKU",
      quantity: item.quantity,
      locationCode: location?.code ?? "-",
      operator: "Auxiliar Despacho",
      confirmedAt: new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
      invoiceNumber: invoiceNum,
      customerName: customerData?.customer_name,
      note: item.note ?? undefined,
    }));
    return { movements, invoiceNumber: invoiceNum };
  }

  let invoiceNumber: string | null = null;
  const movements: DispatchMovement[] = [];

  for (const item of items) {
    const requestBody: Record<string, unknown> = {
      product_id: item.productId,
      location_id: item.locationId,
      quantity: item.quantity,
      movement_type: item.movementType,
      unit_price: item.unitPrice ?? null,
      scanned_code: item.scannedCode || null,
      order_sku: item.orderSku || null,
      serial_number: item.serialNumber || null,
      lot_id: item.lotId ?? null,
      note: item.note || '',
      cold_chain_acknowledged: flags?.coldChainAck ?? false,
      electrical_safety_acknowledged: flags?.electricalSafetyAck ?? false,
      privacy_notice_acknowledged: flags?.privacyNoticeAck ?? false,
    };
    if (customerData) {
      requestBody.customer_data = customerData;
    }

    const response = await api.post<DispatchMovementResponse>(
      "/movements/dispatches/",
      requestBody,
    );

    const mov = response.data;
    const locationCode = mov.origin_location ?? "-";

    movements.push(mapMovementResponse(mov, locationCode));
    if (!invoiceNumber) {
      invoiceNumber = mov.invoice_number;
    }
  }

  return { movements, invoiceNumber };
};

export const downloadInvoicePdf = async (
  movementId: string,
  invoiceNumber: string,
): Promise<void> => {
  if (useMocks) {
    const dummyContent = `%PDF-1.4\n% MOCK INVOICE ${invoiceNumber}\n%%EOF`;
    const blob = new Blob([dummyContent], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `factura_${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return;
  }

  const response = await api.get(
    `/movements/dispatches/${movementId}/invoice/`,
    { responseType: "blob" },
  );

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `factura_${invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
