import type { AlertItem } from "../interfaces/alerts";

export const mockAlerts: AlertItem[] = [
  {
    id: "alert-001",
    product: "prod-003",
    product_sku: "CAN-APS-001",
    location: "loc-bod-02",
    alert_type: "LOW_STOCK",
    message:
      "El stock de Agujas Punción Seca (CAN-APS-001) ha caído por debajo del nivel mínimo establecido (20 unidades).",
    is_resolved: false,
    resolved_at: null,
    resolved_by: null,
    created_at: "2026-05-30T10:00:00Z",
  },
  {
    id: "alert-002",
    product: "prod-004",
    product_sku: "CAN-GEL-005",
    location: "loc-frio-01",
    alert_type: "EXPIRATION_30",
    message:
      "El lote GEL-2605-C de Gel Conductor vence en 18 días (2026-06-18).",
    is_resolved: false,
    resolved_at: null,
    resolved_by: null,
    created_at: "2026-05-29T14:30:00Z",
  },
  {
    id: "alert-003",
    product: "prod-004",
    product_sku: "CAN-GEL-005",
    location: "loc-frio-01",
    alert_type: "COLD_CHAIN_MISSING",
    message:
      "Excursión de temperatura detectada en Cuarto frío (FRIO-01): 9.2°C registrado durante más de 30 minutos.",
    is_resolved: false,
    resolved_at: null,
    resolved_by: null,
    created_at: "2026-05-30T08:15:00Z",
  },
  {
    id: "alert-004",
    product: "prod-002",
    product_sku: "CAN-TENS-003",
    location: "loc-bod-01",
    alert_type: "STOCK_MISMATCH",
    message:
      "Desincronización de stock detectada: físico reporta 4 unidades pero el ledger registra 3 en BOD-01.",
    is_resolved: false,
    resolved_at: null,
    resolved_by: null,
    created_at: "2026-05-28T11:00:00Z",
  },
];
