export type DashboardKpiKey =
  | 'rotacion'
  | 'utilizacion'
  | 'danados'
  | 'otif'
  | 'descarte'
  | 'devoluciones'
  | 'cadena_frio'

export interface DashboardMetricCard {
  key: DashboardKpiKey
  value: number
  range?: string
}

export interface DashboardKpiBar {
  key: DashboardKpiKey
  value: number | null
  delta?: string
  unit?: string
  precision?: number
}

export type DashboardKpiStatus =
  | 'excellent'
  | 'good'
  | 'acceptable'
  | 'warning'
  | 'critical'

export type DashboardKpiChartType =
  | 'area'
  | 'bar'
  | 'radial'
  | 'stacked'
  | 'temperature'

export interface DashboardKpiPoint {
  period: string
  value: number
  target?: number
  secondary?: number
}

export interface DashboardKpiBreakdownItem {
  name: string
  value: number
}

export interface DashboardVisualKpi {
  key: DashboardKpiKey
  title: string
  shortTitle: string
  value: number
  unit: string
  precision: number
  target: string
  status: DashboardKpiStatus
  statusLabel: string
  insight: string
  formula: string
  chartType: DashboardKpiChartType
  history: DashboardKpiPoint[]
  breakdown?: DashboardKpiBreakdownItem[]
}

export interface DashboardAlertSummary {
  active: number
  reorder: number
  expiring: number
  expiringDays: number
  returns: number
}

export interface DashboardMovementItem {
  id: string
  type: 'in' | 'out' | 'transfer' | 'return'
  title: string
  sku: string
  quantity: number
  user: string
  time?: string
  extra?: string
  status?: 'pending' | 'ok'
}

export interface DashboardOverview {
  metrics: {
    stockTotal: number
    dispatchesToday: number
    reorderCount: number
    invoicesIssued: number
    invoiceRange: string
  }
  kpiBars: DashboardKpiBar[]
  visualKpis: DashboardVisualKpi[]
  alerts: DashboardAlertSummary
  movements: DashboardMovementItem[]
}

export interface DashboardApiMetric {
  label: string
  value: number
  unit: string
  precision: number
  threshold: number
  source: string
}

export interface DashboardApiOverview {
  metrics: {
    stock_total: number
    dispatches_today: number
    reorder_count: number
    invoices_issued: number
    invoice_range: string
  }
  alerts: {
    active: number
    reorder: number
    expiring: number
    expiring_days: number
    returns: number
  }
  kpis: {
    warehouse_utilization: DashboardApiMetric
    damaged_rate: DashboardApiMetric
    return_rate: DashboardApiMetric
    dispatch_invoice_ratio: DashboardApiMetric
    discard_rate: DashboardApiMetric
    cold_chain_alerts: DashboardApiMetric
  }
  movements: Array<{
    id: string
    type: string
    title: string
    sku: string
    quantity: number
    user: string
    time?: string
    status?: string
  }>
  generated_at?: string
}
