import { api } from "./api";
import { useMocks } from "../mocks/config";
import { mockReceptionOverview } from "../mocks/reception";
import type {
  ReceptionMovement,
  ReceptionMovementResponse,
  ReceptionOverview,
  ReceptionSubmitPayload,
} from "../interfaces/reception";

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
