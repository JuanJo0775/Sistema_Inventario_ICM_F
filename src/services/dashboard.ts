import type {
  DashboardApiOverview,
  DashboardKpiBar,
  DashboardKpiKey,
  DashboardMovementItem,
  DashboardOverview,
  DashboardVisualKpi,
} from '../interfaces/dashboard'
import { api } from './api'
import { useMocks } from '../mocks/config'
import { mockDashboardOverview } from '../mocks/dashboard'

type DashboardOverviewParams = {
  periodDays?: number
  movementsLimit?: number
}

const VISUAL_KPI_DEFAULTS: DashboardVisualKpi[] = [
  {
    key: 'rotacion',
    title: 'Rotación de inventario',
    shortTitle: 'Rotación',
    value: 0,
    unit: 'veces/año',
    precision: 1,
    target: 'Meta 4 - 8',
    status: 'acceptable',
    statusLabel: 'Nivel aceptable',
    insight: 'Balance saludable entre disponibilidad y movimiento de mercancía.',
    formula: 'CMV / Inventario promedio',
    chartType: 'area',
    history: [],
    breakdown: [],
  },
  {
    key: 'utilizacion',
    title: 'Utilización de almacén',
    shortTitle: 'Almacén',
    value: 0,
    unit: '%',
    precision: 0,
    target: '60% - 85%',
    status: 'acceptable',
    statusLabel: 'Aceptable',
    insight: 'Hay margen operativo para maniobrar con seguridad.',
    formula: '(Posiciones ocupadas / Capacidad total) x 100',
    chartType: 'radial',
    history: [],
    breakdown: [],
  },
  {
    key: 'danados',
    title: 'Índice de productos dañados',
    shortTitle: 'Dañados',
    value: 0,
    unit: '%',
    precision: 1,
    target: '< 1%',
    status: 'acceptable',
    statusLabel: 'Aceptable',
    insight: 'Conviene revisar manipulación y condiciones de almacén.',
    formula: '(Unidades dañadas / Total unidades) x 100',
    chartType: 'bar',
    history: [],
    breakdown: [],
  },
  {
    key: 'otif',
    title: 'Cumplimiento en despacho OTIF',
    shortTitle: 'OTIF',
    value: 0,
    unit: '%',
    precision: 0,
    target: '>= 95%',
    status: 'acceptable',
    statusLabel: 'Aceptable',
    insight: 'El cuello de botella actual está en entregas completas.',
    formula: '(Pedidos a tiempo y completos / Total pedidos) x 100',
    chartType: 'stacked',
    history: [],
    breakdown: [],
  },
  {
    key: 'descarte',
    title: 'Tasa de descarte defectuoso',
    shortTitle: 'Descarte',
    value: 0,
    unit: '%',
    precision: 1,
    target: '< 0.5%',
    status: 'acceptable',
    statusLabel: 'Aceptable',
    insight: 'Nivel normal para importación, con foco en proveedor extranjero.',
    formula: '(Unidades descartadas / Total inventario) x 100',
    chartType: 'bar',
    history: [],
    breakdown: [],
  },
  {
    key: 'devoluciones',
    title: 'Tasa de devoluciones de clientes',
    shortTitle: 'Devoluciones',
    value: 0,
    unit: '%',
    precision: 1,
    target: '< 2%',
    status: 'acceptable',
    statusLabel: 'Aceptable',
    insight: 'Calidad de producto y despacho confiables.',
    formula: '(Unidades devueltas / Unidades despachadas) x 100',
    chartType: 'area',
    history: [],
    breakdown: [],
  },
  {
    key: 'cadena_frio',
    title: 'Cumplimiento de cadena de frío',
    shortTitle: 'Cadena frío',
    value: 0,
    unit: '%',
    precision: 1,
    target: '>= 99.5%',
    status: 'acceptable',
    statusLabel: 'Aceptable',
    insight: 'Dos excursiones térmicas cortas requieren revisión técnica.',
    formula: '(Tiempo dentro de rango / Tiempo monitoreado) x 100',
    chartType: 'temperature',
    history: [],
    breakdown: [],
  },
]

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
    visualKpis: VISUAL_KPI_DEFAULTS.map((defaultKpi) => {
      const apiMetric = kpiBars.find((bar) => bar.key === defaultKpi.key);
      return apiMetric && apiMetric.value !== null
        ? {
            ...defaultKpi,
            value: apiMetric.value,
            unit: apiMetric.unit ?? defaultKpi.unit,
            precision: apiMetric.precision ?? defaultKpi.precision,
          }
        : defaultKpi;
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
