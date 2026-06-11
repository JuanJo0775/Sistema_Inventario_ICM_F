import { api } from "./api";
import { useMocks } from "../mocks/config";
import { mockReceptionOverview } from "../mocks/reception";
import type {
  ReceptionMovement,
  ReceptionMovementResponse,
  ReceptionOverview,
  ReceptionSubmitPayload,
  ReceptionCreatePayload,
} from "../interfaces/reception";
import type { PurchaseOrder } from "../interfaces/purchaseOrders";

type BackendListResponse<T> = T[] | { results?: T[]; count?: number };
const normalizeList = <T,>(payload: BackendListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  return payload.results ?? [];
};

type ReceptionResponse = { id: string };

// Convierte la respuesta del backend al formato que usa el frontend en la UI
const mapMovementResponse = (
  mov: ReceptionMovementResponse,
  locationCode: string,
  productName: string,
): ReceptionMovement => ({
  id: mov.id,
  productName: productName || mov.product_sku,
  sku: mov.product_sku,
  quantity: mov.quantity,
  locationCode,
  operator: mov.executed_by, // UUID — se muestra como identificador
  confirmedAt: new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(mov.created_at)),
  discrepancyNote: mov.discrepancy_note ?? undefined,
});

export const fetchReceptionOverview = async (): Promise<ReceptionOverview> => {
  if (useMocks) {
    return mockReceptionOverview;
  }

  const [locationsRes, movementsRes] = await Promise.all([
    api.get<{ results: Array<{ id: string; code: string; name: string }> }>(
      "/inventory/locations/",
    ),
    api.get<{ results: ReceptionMovementResponse[] }>("/movements/entries/", {
      params: { page_size: 10, ordering: "-created_at" },
    }),
  ]);

  const locations = locationsRes.data.results.map((loc) => ({
    id: loc.id,
    code: loc.code,
    name: loc.name,
    capacityLabel: "",
  }));

  // Mapa de UUID -> código de ubicación para mostrar en UI
  const locationCodeById = new Map(
    locationsRes.data.results.map((loc) => [loc.id, loc.code]),
  );

  const recentMovements: ReceptionMovement[] = movementsRes.data.results.map(
    (mov) => {
      const locationCode = mov.destination_location
        ? (locationCodeById.get(mov.destination_location) ??
          mov.destination_location)
        : "-";
      return mapMovementResponse(mov, locationCode, mov.product_sku);
    },
  );

  return {
    locations,
    // Las órdenes de compra no tienen endpoint en el backend todavía
    // Se mantienen desde el mock hasta que el backend las exponga
    expectedOrders: mockReceptionOverview.expectedOrders,
    recentMovements,
  };
};

export const submitReception = async (
  payload: ReceptionSubmitPayload,
): Promise<ReceptionMovement> => {
  if (useMocks) {
    // Busca la orden en el mock para construir la respuesta visual
    const order = mockReceptionOverview.expectedOrders.find(
      (item) => item.productId === payload.productId,
    );
    const location = mockReceptionOverview.locations.find(
      (item) => item.id === payload.locationId,
    );

    return {
      id: `mov-in-${Date.now()}`,
      productName: order?.productName ?? payload.productId,
      sku: order?.sku ?? "-",
      quantity: payload.quantity,
      locationCode: location?.code ?? "-",
      operator: "Usuario ICM",
      confirmedAt: new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
      discrepancyNote: payload.discrepancyNote,
    };
  }

  // Construye el body exacto que espera EntryCreateSerializer
  const requestBody = {
    product_id: payload.productId,
    location_id: payload.locationId,
    quantity: payload.quantity,
    serial_number: payload.serialNumber ?? null,
    qty_invoiced: payload.qtyInvoiced ?? null,
    discrepancy_note: payload.discrepancyNote ?? null,
    cold_chain_acknowledged: payload.coldChainAcknowledged,
    electrical_safety_acknowledged: payload.electricalSafetyAcknowledged,
  };

  const response = await api.post<ReceptionMovementResponse>(
    "/movements/entries/",
    requestBody,
  );

  const mov = response.data;

  // Necesitamos el código de ubicación para mostrarlo en la UI
  // Lo obtenemos de los locations que ya tenemos en el store o hacemos una llamada
  return {
    id: mov.id,
    productName: mov.product_sku,
    sku: mov.product_sku,
    quantity: mov.quantity,
    locationCode: mov.destination_location ?? "-",
    operator: mov.executed_by,
    confirmedAt: new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(mov.created_at)),
    discrepancyNote: mov.discrepancy_note ?? undefined,
  };
};

// ─── Funciones para useReceptionStore (órdenes de compra) ────────────────────

const PURCHASE_ORDERS_BASE = "/purchasing/purchase-orders/";

/** Devuelve órdenes de compra pendientes o parcialmente recibidas */
export const fetchPendingPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  if (useMocks) {
    // Mapear órdenes mock a PurchaseOrder mínimo
    return mockReceptionOverview.expectedOrders.map((o) => ({
      id: o.id,
      number: o.purchaseOrder,
      supplier: o.supplier,
      supplier_nombre: o.supplier,
      status: "pendiente" as const,
      notes: "",
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }
  const statuses = ["pendiente", "parcialmente_recibida"];
  const responses = await Promise.all(
    statuses.map((status) =>
      api.get<BackendListResponse<PurchaseOrder>>(PURCHASE_ORDERS_BASE, {
        params: { status },
      }),
    ),
  );
  return responses.flatMap((res) => normalizeList(res.data));
};

/** Devuelve órdenes de compra completadas */
export const fetchCompletedPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  if (useMocks) return [];
  const res = await api.get<{ results: PurchaseOrder[] } | PurchaseOrder[]>(
    PURCHASE_ORDERS_BASE,
    { params: { status: "completada" } },
  );
  return Array.isArray(res.data) ? res.data : (res.data.results ?? []);
};

/** Devuelve el detalle de una orden de compra por ID */
export const fetchPendingOrderDetail = async (id: string): Promise<PurchaseOrder> => {
  if (useMocks) {
    const mock = mockReceptionOverview.expectedOrders.find((o) => o.id === id);
    return {
      id: mock?.id ?? id,
      number: mock?.purchaseOrder ?? id,
      supplier: mock?.supplier ?? "",
      supplier_nombre: mock?.supplier ?? "",
      status: "pendiente" as const,
      notes: "",
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  const res = await api.get<PurchaseOrder>(`${PURCHASE_ORDERS_BASE}${id}/`);
  return res.data;
};

/** Crea y confirma una recepción para una orden de compra */
export const createAndConfirmReception = async (
  payload: ReceptionCreatePayload,
): Promise<void> => {
  if (useMocks) return;
  const res = await api.post<ReceptionResponse>("/purchasing/receptions/", payload);
  await api.post(`/purchasing/receptions/${res.data.id}/confirm/`);
};
