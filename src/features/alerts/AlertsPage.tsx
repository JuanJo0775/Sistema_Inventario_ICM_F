import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Filter,
  ShieldAlert,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Select } from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import type { AlertItem, AlertType } from '../../interfaces/alerts'
import { fetchActiveAlerts, resolveAlert } from '../../services/alerts'
import useAuthStore from '../../store/useAuthStore'

const typeBadgeVariant = (type: AlertType): 'destructive' | 'warning' | 'secondary' => {
  switch (type) {
    case 'LOW_STOCK':
    case 'COLD_CHAIN_MISSING':
    case 'STOCK_MISMATCH':
      return 'destructive'
    case 'EXPIRATION_30':
      return 'warning'
    default:
      return 'secondary'
  }
}

function AlertsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('')

  // RBAC checks
  const canResolve = useMemo(() => {
    return user?.role === 'almacenista' || user?.role === 'administrador'
  }, [user?.role])

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchActiveAlerts({
        alert_type: alertTypeFilter || undefined,
      })
      setAlerts(data)
    } catch {
      setError(t('alerts.errors.load'))
    } finally {
      setLoading(false)
    }
  }, [alertTypeFilter, t])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const handleResolve = async (alertId: string) => {
    if (!canResolve) {
      setError(t('alerts.errors.unauthorized'))
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await resolveAlert(alertId)
      setSuccess(t('alerts.success.resolved'))
      
      // Update local state by removing/marking resolved
      setAlerts((current) =>
        current.map((item) =>
          item.id === alertId
            ? { ...item, is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: user?.username ?? 'user' }
            : item
        )
      )
    } catch {
      setError(t('alerts.errors.resolve'))
    }
  }

  const stats = useMemo(() => {
    const activeAlerts = alerts.filter((a) => !a.is_resolved)
    const critical = activeAlerts.filter(
      (a) =>
        a.alert_type === 'LOW_STOCK' ||
        a.alert_type === 'COLD_CHAIN_MISSING' ||
        a.alert_type === 'STOCK_MISMATCH'
    ).length
    const warning = activeAlerts.filter(
      (a) => a.alert_type === 'EXPIRATION_30' || a.alert_type === 'EXPIRATION_60'
    ).length
    const resolved = alerts.filter((a) => a.is_resolved).length

    return { critical, warning, resolved }
  }, [alerts])

  return (
    <AppShell
      title={t('alerts.title')}
      subtitle={t('alerts.subtitle')}
      actions={
        <Button variant="ghost" size="sm" onClick={loadAlerts}>
          {t('common.actions.refresh')}
        </Button>
      }
    >
      <div className="page-body">
        <section className="reception-stats" aria-label={t('alerts.stats.ariaLabel')}>
          <Card className="reception-stat rounded-lg">
            <ShieldAlert style={{ color: 'var(--red-600)' }} />
            <div>
              <span>{stats.critical}</span>
              <p>{t('alerts.stats.critical')}</p>
            </div>
          </Card>
          <Card className="reception-stat rounded-lg">
            <AlertTriangle style={{ color: 'var(--yellow-600)' }} />
            <div>
              <span>{stats.warning}</span>
              <p>{t('alerts.stats.warning')}</p>
            </div>
          </Card>
          <Card className="reception-stat rounded-lg">
            <CheckCircle2 style={{ color: 'var(--green-600)' }} />
            <div>
              <span>{stats.resolved}</span>
              <p>{t('alerts.stats.resolved')}</p>
            </div>
          </Card>
        </section>

        {!canResolve && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1rem' }}>
            <AlertTriangle />
            <span>{t('alerts.errors.unauthorized')}</span>
          </div>
        )}

        {error && (
          <div className="alert-bar alert-bar--warn" role="alert">
            <AlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-bar alert-bar--ok" role="status">
            <CheckCircle2 />
            <span>{success}</span>
          </div>
        )}

        <section className="inventory-toolbar" aria-label={t('alerts.filters.ariaLabel')}>
          <div className="inventory-field">
            <label className="inventory-label" htmlFor="alerts-type-filter">
              {t('alerts.filters.typeLabel')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter style={{ width: '16px', color: 'var(--neutral-500)' }} />
              <Select
                id="alerts-type-filter"
                value={alertTypeFilter}
                onChange={(event) => setAlertTypeFilter(event.target.value)}
              >
                <option value="">{t('alerts.filters.typeAll')}</option>
                <option value="LOW_STOCK">{t('alerts.filters.LOW_STOCK')}</option>
                <option value="EXPIRATION_30">{t('alerts.filters.EXPIRATION_30')}</option>
                <option value="EXPIRATION_60">{t('alerts.filters.EXPIRATION_60')}</option>
                <option value="COLD_CHAIN_MISSING">{t('alerts.filters.COLD_CHAIN_MISSING')}</option>
                <option value="STOCK_MISMATCH">{t('alerts.filters.STOCK_MISMATCH')}</option>
              </Select>
            </div>
          </div>
        </section>

        <section aria-label={t('alerts.table.ariaLabel')}>
          <div className="s-head">
            <span className="s-head__label">{t('alerts.title')}</span>
            <div className="s-head__rule" />
          </div>
          <div className="table-surface">
            <div className="table-wrap">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('alerts.table.columns.type')}</TableHead>
                    <TableHead>{t('alerts.table.columns.product')}</TableHead>
                    <TableHead>{t('alerts.table.columns.message')}</TableHead>
                    <TableHead>{t('alerts.table.columns.created')}</TableHead>
                    <TableHead>{t('alerts.table.columns.status')}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t('alerts.table.columns.action')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="inventory-empty">
                        {t('common.loading')}
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && alerts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="inventory-empty">
                        {t('common.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                  {alerts.map((alert) => (
                    <TableRow key={alert.id} className={alert.is_resolved ? 'opacity-60 bg-neutral-50/50' : undefined}>
                      <TableCell>
                        <Badge variant={typeBadgeVariant(alert.alert_type)}>
                          {t(`alerts.filters.${alert.alert_type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="prod-name font-mono">{alert.product_sku}</p>
                        {alert.lot_code && (
                          <p className="prod-sub">
                            Lote: {alert.lot_code} {alert.lot_expiration_date ? `· Vence: ${alert.lot_expiration_date}` : ''}
                          </p>
                        )}
                      </TableCell>
                      <TableCell style={{ maxWidth: '400px', whiteSpace: 'normal', lineBreak: 'anywhere' }}>
                        <p className="prod-name" style={{ fontWeight: 'normal' }}>
                          {alert.message}
                        </p>
                      </TableCell>
                      <TableCell className="text-mono">
                        {new Intl.DateTimeFormat('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(alert.created_at))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.is_resolved ? 'success' : 'destructive'}>
                          {alert.is_resolved ? t('alerts.table.resolved') : 'Activa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!alert.is_resolved ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                            disabled={!canResolve}
                          >
                            <Bell style={{ marginRight: '0.25rem', width: '14px' }} />
                            {t('alerts.table.resolve')}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs" style={{ color: 'var(--green-600)' }}>
                            Resuelta {alert.resolved_by ? `por ${alert.resolved_by}` : ''}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default AlertsPage
