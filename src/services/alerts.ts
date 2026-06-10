import { api } from "./api";
import { useMocks } from "../mocks/config";
import { mockAlerts } from "../mocks/alerts";
import type { AlertItem } from "../interfaces/alerts";

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

export const fetchActiveAlerts = async (filters?: {
  alert_type?: string;
  product_id?: string;
}): Promise<AlertItem[]> => {
  if (useMocks) {
    return mockAlerts.filter((alert) => {
      if (filters?.alert_type && alert.alert_type !== filters.alert_type)
        return false;
      if (filters?.product_id && alert.product !== filters.product_id)
        return false;
      return true;
    });
  }

  const response = await api.get<ListResponse<AlertItem>>("/alerts/", {
    params: {
      alert_type: filters?.alert_type || undefined,
      product_id: filters?.product_id || undefined,
    },
  });

  return normalizeList(response.data);
};

export const resolveAlert = async (alertId: string): Promise<AlertItem> => {
  if (useMocks) {
    const alert = mockAlerts.find((item) => item.id === alertId);
    if (!alert) throw new Error("Alerta no encontrada");
    alert.is_resolved = true;
    alert.resolved_at = new Date().toISOString();
    alert.resolved_by = "mock-user-id";
    return alert;
  }

  const response = await api.post<AlertItem>(`/alerts/${alertId}/resolve/`);
  return response.data;
};
