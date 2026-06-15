import { api } from "./api";
import { useMocks } from "../mocks/config";
import {
  mockDispatchLocations,
  mockDispatchItems,
  mockDispatchMovements,
} from "../mocks/dispatch";
import { fetchCatalogProducts, fetchCategories } from "./catalog";
import type {
  DispatchItem,
  DispatchLocation,
  DispatchMovement,
  DispatchMovementResponse,
  DispatchSubmitPayload,
} from "../interfaces/dispatch";

export interface DispatchOverview {
  locations: DispatchLocation[];
  expectedOrders: DispatchItem[];
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
      expectedOrders: mockDispatchItems,
      recentMovements: mockDispatchMovements,
    };
  }

  try {
    const [locationsRes, movementsRes, catalogProducts, categories] =
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
        fetchCatalogProducts({ page_size: 9999, include_inactive: false }),
        fetchCategories(),
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

    // Mapa de categorías para saber requiresSerial
    const categoryMap = new Map(
      categories.map((cat) => [cat.id, cat.requires_serial_number ?? false]),
    );

    // Ordenes de despacho desde productos reales del catálogo
    const expectedOrders: DispatchItem[] = catalogProducts.map((prod) => ({
      id: `dsp-${prod.id}`,
      invoiceNumber: `DSP-${prod.sku}`,
      customerName: "",
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      barcode: prod.barcode ?? "",
      category: prod.category_slug ?? "",
      expectedQuantity: 1,
      dispatchedQuantity: 0,
      status: "pending" as const,
      requiresSerial: categoryMap.get(prod.category) ?? false,
      requiresColdChain: prod.requires_cold_chain,
    }));

    return {
      locations,
      expectedOrders,
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
    const order = mockDispatchItems.find(
      (o) => o.productId === payload.productId,
    );

    return {
      id: `mov-out-${Date.now()}`,
      productName: order?.productName ?? "Producto",
      sku: order?.sku ?? "SKU",
      quantity: payload.quantity,
      locationCode: location?.code ?? "-",
      operator: "Auxiliar Despacho",
      confirmedAt: new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
      invoiceNumber: order?.invoiceNumber ?? "ICM-MOCK",
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
