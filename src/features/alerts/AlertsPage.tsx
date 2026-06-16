import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCircle2, Filter, RefreshCw, ShieldAlert, ShoppingCart } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Select } from '../../components/ui/select'
import type { AlertItem } from '../../interfaces/alerts'
import { fetchActiveAlerts, fetchAlertHistory, resolveAlert } from '../../services/alerts'
import useAuthStore from '../../store/useAuthStore'
import { extractApiError } from '../../hooks/useApiError'

type AlertTone = 'critical' | 'warning' | 'special' | 'resolved'

const alertToneByType = (alert: AlertItem): AlertTone => {
  if (alert.is_resolved) return 'resolved'

  switch (alert.alert_type) {
    case 'LOW_STOCK':
    case 'STOCK_MISMATCH':
      return 'critical'
    case 'EXPIRATION_30':
    case 'EXPIRATION_60':
      return 'warning'
    case 'COLD_CHAIN_MISSING':
      return 'special'
    default:
      return 'special'
  }
}

const badgeVariantByTone = (tone: AlertTone): 'destructive' | 'warning' | 'secondary' | 'success' => {
  switch (tone) {
    case 'critical':
      return 'destructive'
    case 'warning':
      return 'warning'
    case 'resolved':
      return 'success'
    default:
      return 'secondary'
  }
}

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

function AlertsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('')
  const [historyAlerts, setHistoryAlerts] = useState<AlertItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const canResolve = useMemo(() => {
    return user?.role === "almacenista";
  }, [user?.role]);

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchActiveAlerts({
        alert_type: alertTypeFilter || undefined,
      })
      setAlerts(data)
    } catch (err) {
      setError(extractApiError(err))
    } finally {
      setLoading(false)
    }
  }, [alertTypeFilter, t])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const data = await fetchAlertHistory()
      setHistoryAlerts(data)
    } catch {
      // silent
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAlerts()
    loadHistory()
  }, [loadAlerts, loadHistory])

  const handleGeneratePO = (alert: AlertItem) => {
    navigate('/app/purchasing/purchase-orders', {
      state: { prefillProduct: { id: alert.product, sku: alert.product_sku } },
    })
  }

  const handleResolve = async (alertId: number) => {
    if (!canResolve) {
      setError(t("alerts.errors.unauthorized"));
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const resolved = await resolveAlert(alertId);
      setSuccess(t("alerts.success.resolved"));
      // Reemplazamos con la respuesta real del backend
      setAlerts((current) =>
        current.map((item) => (item.id === alertId ? resolved : item)),
      );
    } catch (err) {
      setError(extractApiError(err));
    }
  };

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => !alert.is_resolved),
    [alerts],
  )

  const resolvedAlerts = useMemo(
    () => alerts.filter((alert) => alert.is_resolved),
    [alerts],
  )

  const activeCritical = useMemo(
    () => activeAlerts.filter((alert) => alertToneByType(alert) === 'critical'),
    [activeAlerts],
  )

  const activeWarning = useMemo(
    () => activeAlerts.filter((alert) => alertToneByType(alert) === 'warning'),
    [activeAlerts],
  )

  const activeSpecial = useMemo(
    () => activeAlerts.filter((alert) => alertToneByType(alert) === 'special'),
    [activeAlerts],
  )

  const sections = useMemo(
    () => [
      {
        eyebrow: '',
        title: t('alerts.sections.stockMinimum'),
        description: t('alerts.sections.stockMinimumHint'),
        alerts: activeCritical,
      },
      {
        eyebrow: '',
        title: t('alerts.sections.expiration'),
        description: t('alerts.sections.expirationHint'),
        alerts: activeWarning,
      },
      {
        eyebrow: '',
        title: t('alerts.sections.specialHandling'),
        description: t('alerts.sections.specialHandlingHint'),
        alerts: activeSpecial,
      },
    ],
    [activeCritical, activeSpecial, activeWarning, t],
  )

  const stats = useMemo(
    () => ({
      critical: activeCritical.length,
      warning: activeWarning.length,
      special: activeSpecial.length,
      resolved: resolvedAlerts.length,
      active: activeAlerts.length,
    }),
    [activeAlerts.length, activeCritical.length, activeSpecial.length, activeWarning.length, resolvedAlerts.length],
  )

  const renderAlertCard = (alert: AlertItem) => {
    const tone = alertToneByType(alert)
    const badgeVariant = badgeVariantByTone(tone)
    const createdAt = formatShortDate(alert.created_at)
    const location = alert.location ? alert.location.replace(/^loc-/, '').toUpperCase() : t('alerts.card.noLocation')

    return (
      <Card key={alert.id} className={`alert-card alert-card--${tone}`}>
        <div className="alert-card__eyebrow">
          <span>{t(`alerts.badges.${tone}`)}</span>
          <Badge variant={badgeVariant}>{t(`alerts.badges.${tone}`)}</Badge>
        </div>
        <div className="alert-card__head">
          <div>
            <p className="alert-card__title">{alert.product_sku}</p>
            <p className="alert-card__subtitle">
              {alert.lot_code ? `${alert.lot_code} · ` : ''}
              {location}
            </p>
          </div>
          <span className={`alert-card__chip alert-card__chip--${tone}`}>{t(`alerts.badges.${tone}`)}</span>
        </div>
        <p className="alert-card__message">{alert.message}</p>
        <div className="alert-card__meta">
          <span>{alert.lot_code ? `${t('alerts.card.lot')}: ${alert.lot_code}` : t('alerts.card.product')}</span>
          <span>{`${t('alerts.card.createdAt')}: ${createdAt}`}</span>
        </div>
        <div className="alert-card__progress" aria-hidden="true">
          <span className={`alert-card__progress-fill alert-card__progress-fill--${tone}`} />
        </div>
        <div className="alert-card__footer">
          <span className="alert-card__time">{createdAt}</span>
          {alert.is_resolved ? (
            <span className="alert-card__resolvedBy">
              {t('alerts.card.resolvedBy', { name: alert.resolved_by ?? t('alerts.card.system') })}
            </span>
          ) : (
            <div className="alert-card__actions">
              {canResolve ? null : <span className="alert-card__lock">{t('alerts.errors.unauthorizedShort')}</span>}
              {alert.alert_type === 'LOW_STOCK' ? (
                <Button variant="outline" size="sm" onClick={() => handleGeneratePO(alert)} disabled={!canResolve}>
                  <ShoppingCart />
                  Generar OC
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleResolve(alert.id)} disabled={!canResolve}>
                  <CheckCircle2 />
                  {t('alerts.table.resolve')}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <AppShell
      title={t('alerts.title')}
      subtitle={t('alerts.hero.subtitle')}
      actions={
        <>
          <span className="alerts-top-pill">{t('alerts.header.activePill', { count: stats.active })}</span>
          <Button variant="ghost" size="sm" onClick={loadAlerts}>
            <RefreshCw />
            {t('common.actions.refresh')}
          </Button>
        </>
      }
    >
      <div className="page-body alerts-page">
        <section className="alerts-hero" aria-label={t('alerts.hero.ariaLabel')}>
          <div className="alerts-hero__copy">
            <h2 className="alerts-hero__title">{t('alerts.hero.title')}</h2>
            <p className="alerts-hero__subtitle">{t('alerts.hero.subtitle')}</p>
          </div>
          <div className="alerts-hero__actions">
            <span className="alerts-hero__pill">{t('alerts.header.activePill', { count: stats.active })}</span>
            <span className="alerts-hero__meta">{t('alerts.hero.meta', { count: stats.resolved })}</span>
          </div>
        </section>

        {error ? (
          <div className="alert-bar alert-bar--warn" role="alert">
            <AlertTriangle />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <output className="alert-bar alert-bar--ok">
            <CheckCircle2 />
            <span>{success}</span>
          </output>
        ) : null}

        <section className="alerts-summary" aria-label={t('alerts.stats.ariaLabel')}>
          <Card className="alerts-summary__card alerts-summary__card--critical">
            <ShieldAlert className="alerts-summary__icon" />
            <div>
              <span className="alerts-summary__value">{stats.critical}</span>
              <p className="alerts-summary__label">{t('alerts.stats.critical')}</p>
            </div>
          </Card>
          <Card className="alerts-summary__card alerts-summary__card--warning">
            <AlertTriangle className="alerts-summary__icon" />
            <div>
              <span className="alerts-summary__value">{stats.warning}</span>
              <p className="alerts-summary__label">{t('alerts.stats.warning')}</p>
            </div>
          </Card>
          <Card className="alerts-summary__card alerts-summary__card--special">
            <Bell className="alerts-summary__icon" />
            <div>
              <span className="alerts-summary__value">{stats.special}</span>
              <p className="alerts-summary__label">{t('alerts.stats.special')}</p>
            </div>
          </Card>
        </section>

        <section className="alerts-toolbar" aria-label={t('alerts.filters.ariaLabel')}>
          <div className="alerts-toolbar__fieldWrap">
            <label className="inventory-label" htmlFor="alerts-type-filter">
              {t('alerts.filters.typeLabel')}
            </label>
            <div className="alerts-toolbar__field">
              <Filter className="alerts-toolbar__icon" />
              <Select id="alerts-type-filter" value={alertTypeFilter} onChange={(event) => setAlertTypeFilter(event.target.value)}>
                <option value="">{t('alerts.filters.typeAll')}</option>
                <option value="LOW_STOCK">{t('alerts.filters.LOW_STOCK')}</option>
                <option value="EXPIRATION_30">{t('alerts.filters.EXPIRATION_30')}</option>
                <option value="EXPIRATION_60">{t('alerts.filters.EXPIRATION_60')}</option>
                <option value="COLD_CHAIN_MISSING">{t('alerts.filters.COLD_CHAIN_MISSING')}</option>
                <option value="STOCK_MISMATCH">{t('alerts.filters.STOCK_MISMATCH')}</option>
              </Select>
            </div>
          </div>
          <p className="alerts-toolbar__hint">{t('alerts.filters.hint')}</p>
        </section>

        <div className="alerts-content">
          {loading ? <div className="alerts-empty-state">{t('common.loading')}</div> : null}

          {!loading && activeAlerts.length === 0 ? <div className="alerts-empty-state">{t('alerts.empty.active')}</div> : null}

          {sections.map((section) =>
            section.alerts.length > 0 ? (
              <section key={section.title} className="alerts-section" aria-label={section.title}>
                <div className="s-head s-head--compact">
                  {section.eyebrow ? <span className="s-head__label">{section.eyebrow}</span> : null}
                  <div className="s-head__rule" />
                  <span className="alerts-section__count">{section.alerts.length}</span>
                </div>
                <p className="alerts-section__intro">{section.description}</p>
                <div className="alerts-grid">{section.alerts.map((alert) => renderAlertCard(alert))}</div>
              </section>
            ) : null,
          )}

          {historyAlerts.length > 0 ? (
            <section className="alerts-section" aria-label={t('alerts.sections.resolvedHistory')}>
              <div className="s-head s-head--compact">
                <span className="s-head__label">{t('alerts.sections.resolvedHistory')}</span>
                <div className="s-head__rule" />
                <span className="alerts-section__count">{historyAlerts.length}</span>
              </div>
              <p className="alerts-section__intro">{t('alerts.sections.resolvedHistoryHint')}</p>
              <div className="table-surface" style={{ marginTop: '0.75rem' }}>
                <div className="table-wrap">
                  <table className="data-table" style={{ minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '14%' }}>Tipo</th>
                        <th style={{ width: '14%' }}>SKU</th>
                        <th style={{ width: '38%' }}>Mensaje</th>
                        <th style={{ width: '18%' }}>Resuelta por</th>
                        <th style={{ width: '16%' }}>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyAlerts.map((alert) => {
                        const typeColor =
                          alert.alert_type === 'LOW_STOCK' ? '#dc2626' :
                          alert.alert_type === 'STOCK_MISMATCH' ? '#ea580c' :
                          alert.alert_type.startsWith('EXPIRATION') ? '#d97706' :
                          '#0891b2'
                        const typeBg =
                          alert.alert_type === 'LOW_STOCK' ? '#fef2f2' :
                          alert.alert_type === 'STOCK_MISMATCH' ? '#fff7ed' :
                          alert.alert_type.startsWith('EXPIRATION') ? '#fffbeb' :
                          '#ecfeff'
                        return (
                          <tr key={alert.id}>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: typeColor,
                                backgroundColor: typeBg,
                                whiteSpace: 'nowrap',
                              }}>
                                {alert.alert_type === 'LOW_STOCK' ? 'Stock Bajo' :
                                 alert.alert_type === 'STOCK_MISMATCH' ? 'Desincronización' :
                                 alert.alert_type === 'EXPIRATION_30' ? 'Vence en ≤30d' :
                                 alert.alert_type === 'EXPIRATION_60' ? 'Vence en ≤60d' :
                                 alert.alert_type === 'COLD_CHAIN_MISSING' ? 'Cadena Frío' :
                                 alert.alert_type}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'var(--ff-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                              {alert.product_sku}
                            </td>
                            <td style={{ fontSize: '0.825rem', color: 'var(--ink-70)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {alert.message}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--ink-40)' }}>
                              {alert.resolved_by ?? t('alerts.card.system')}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--ink-40)' }}>
                              {alert.resolved_at ? formatShortDate(alert.resolved_at) : ''}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : historyLoading ? (
            <div className="alerts-empty-state" style={{ padding: '1.5rem' }}>
              {t('common.loading')}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}

export default AlertsPage
