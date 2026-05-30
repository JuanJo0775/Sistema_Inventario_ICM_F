export type DashboardKpiKey =
  | 'stock'
  | 'despachos'
  | 'reorden'
  | 'facturas'
  | 'rotacion'
  | 'servicio'
  | 'exactitud'
  | 'vencimientos'
  | 'devoluciones'

export interface DashboardMetricCard {
  key: DashboardKpiKey
  value: number
  range?: string
}

export interface DashboardKpiBar {
  key: DashboardKpiKey
  value: number
  delta?: string
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
  alerts: DashboardAlertSummary
  movements: DashboardMovementItem[]
}
