import type {
  DashboardApiOverview,
  DashboardKpiBar,
  DashboardKpiKey,
  DashboardMovementItem,
  DashboardOverview,
} from '../interfaces/dashboard'
import { api } from './api'
import { useMocks } from '../mocks/config'
import { mockDashboardOverview } from '../mocks/dashboard'

type DashboardOverviewParams = {
  periodDays?: number
  movementsLimit?: number
}

const VISUAL_KPI_CONFIG = mockDashboardOverview.visualKpis;

const toMovementType = (value: string): DashboardMovementItem['type'] => {
  switch (value) {
    case 'in':
    case 'out':
    case 'transfer':
    case 'return':
      return value
    default:
      return 'in'
  }
}

const toKpiBar = (
  key: DashboardKpiKey,
  metric: DashboardApiOverview['kpis'][keyof DashboardApiOverview['kpis']] | null,
): DashboardKpiBar => ({
  key,
  value: metric ? Number(metric.value) : null,
  unit: metric?.unit,
  precision: metric?.precision,
})

const mapOverview = (data: DashboardApiOverview): DashboardOverview => {
  const kpis = data.kpis

  const kpiBars: DashboardKpiBar[] = [
    toKpiBar('rotacion', null),
    toKpiBar('utilizacion', kpis?.warehouse_utilization ?? null),
    toKpiBar('danados', kpis?.damaged_rate ?? null),
    toKpiBar('otif', kpis?.dispatch_invoice_ratio ?? null),
    toKpiBar('descarte', kpis?.discard_rate ?? null),
    toKpiBar('devoluciones', kpis?.return_rate ?? null),
    toKpiBar('cadena_frio', kpis?.cold_chain_alerts ?? null),
  ]

  return {
    metrics: {
      stockTotal: data.metrics.stock_total,
      dispatchesToday: data.metrics.dispatches_today,
      reorderCount: data.metrics.reorder_count,
      invoicesIssued: data.metrics.invoices_issued,
      invoiceRange: data.metrics.invoice_range,
    },
    alerts: {
      active: data.alerts.active,
      reorder: data.alerts.reorder,
      expiring: data.alerts.expiring,
      expiringDays: data.alerts.expiring_days,
      returns: data.alerts.returns,
    },
    kpiBars,
    visualKpis: VISUAL_KPI_CONFIG.map((kpi) => {
      const apiMetric = kpiBars.find((bar) => bar.key === kpi.key);
      return apiMetric && apiMetric.value !== null
        ? {
            ...kpi,
            value: apiMetric.value,
            unit: apiMetric.unit ?? kpi.unit,
            precision: apiMetric.precision ?? kpi.precision,
          }
        : kpi;
    }),
    movements: data.movements.map((movement) => ({
      id: movement.id,
      type: toMovementType(movement.type),
      title: movement.title,
      sku: movement.sku,
      quantity: movement.quantity,
      user: movement.user,
      time: movement.time,
      status: movement.status === "pending" ? "pending" : "ok",
    })),
  };
}

export const fetchDashboardOverview = async (
  params: DashboardOverviewParams = {},
): Promise<DashboardOverview> => {
  if (useMocks) {
    return mockDashboardOverview
  }

  const response = await api.get<DashboardApiOverview>('/dashboard/overview/', {
    params: {
      period_days: params.periodDays,
      movements_limit: params.movementsLimit,
    },
  })

  return mapOverview(response.data)
}
