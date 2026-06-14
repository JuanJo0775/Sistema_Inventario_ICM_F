import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Download,
  PackageCheck,
  RefreshCw,
  SlidersHorizontal,
  Thermometer,
  Truck,
  Warehouse,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import useAuthStore from '../../store/useAuthStore'
import type {
  DashboardKpiKey,
  DashboardKpiStatus,
  DashboardMovementItem,
  DashboardOverview,
  DashboardVisualKpi,
} from '../../interfaces/dashboard'
import { fetchDashboardOverview } from '../../services/dashboard'
import type { TFunction } from 'i18next'

const KpiChart = React.lazy(() => import('./DashboardCharts'))

type KpiKey = DashboardKpiKey

const initialKpis: Record<KpiKey, boolean> = {
  rotacion: true,
  danados: true,
  utilizacion: true,
  otif: true,
  descarte: true,
  devoluciones: true,
  cadena_frio: true,
}

const statusVariant: Record<DashboardKpiStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  excellent: 'success',
  good: 'success',
  acceptable: 'secondary',
  warning: 'warning',
  critical: 'destructive',
}

const kpiIcons: Record<KpiKey, typeof PackageCheck> = {
  rotacion: RefreshCw,
  danados: AlertTriangle,
  utilizacion: Warehouse,
  otif: Truck,
  descarte: ClipboardList,
  devoluciones: PackageCheck,
  cadena_frio: Thermometer,
}

const kpiIconClass: Record<KpiKey, string> = {
  rotacion: 'kpi-score-card__icon--rotacion',
  danados: 'kpi-score-card__icon--danados',
  utilizacion: 'kpi-score-card__icon--utilizacion',
  otif: 'kpi-score-card__icon--otif',
  descarte: 'kpi-score-card__icon--descarte',
  devoluciones: 'kpi-score-card__icon--devoluciones',
  cadena_frio: 'kpi-score-card__icon--cadena-frio',
}

const formatKpiValue = (value: number, unit: string, precision: number, locale = 'es-CO') => {
  const safePrecision = Math.min(20, Math.max(0, Number.isFinite(Number(precision)) ? Number(precision) : 0))
  const formatted = Number.isFinite(value)
    ? new Intl.NumberFormat(locale, {
        maximumFractionDigits: safePrecision,
        minimumFractionDigits: safePrecision,
      }).format(value)
    : '0'
  return unit === '%' ? `${formatted}%` : `${formatted} ${unit}`
}

const kpiText = (
  t: TFunction,
  kpi: DashboardVisualKpi,
  field: 'title' | 'shortTitle' | 'unit' | 'target' | 'statusLabel' | 'insight' | 'formula',
) => t(`dashboard.visualKpis.${kpi.key}.${field}`, { defaultValue: kpi[field] })

const movementClass = (type: DashboardMovementItem['type']) => {
  switch (type) {
    case 'transfer':
      return 'move'
    case 'return':
      return 'ret'
    case 'out':
      return 'out'
    default:
      return 'in'
  }
}

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language === 'en' ? 'en-US' : 'es-CO'
  const [kpiPanelOpen, setKpiPanelOpen] = useState(false)
  const [kpis, setKpis] = useState(initialKpis)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadOverview = async () => {
      try {
        const data = await fetchDashboardOverview()
        if (active) {
          setOverview(data)
        }
      } catch {
        if (active) {
          setOverviewError(t('dashboard.errors.load'))
        }
      }
    }

    loadOverview()

    return () => {
      active = false
    }
  }, [t])

  const roleLabelInline = useMemo(() => {
    switch (user?.role) {
      case 'auxiliar_despacho':
        return t('dashboard.roles.auxiliar_despacho.label')
      case 'administrador':
        return t('dashboard.roles.administrador.label')
      case 'almacenista':
        return t('dashboard.roles.almacenista.label')
      default:
        return t('dashboard.roles.usuario.label')
    }
  }, [t, user?.role])

  const visualKpis = useMemo(
    () => overview?.visualKpis.filter((kpi) => kpis[kpi.key]) ?? [],
    [kpis, overview?.visualKpis],
  )

  const focusKpi = visualKpis[0]
  const movements = overview?.movements ?? []
  const alertSummary = overview?.alerts

  const toggleKpi = (key: KpiKey) => {
    setKpis((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <AppShell
      title={t('dashboard.topbar.title')}
      subtitle={t('dashboard.topbar.dateLine', {
        date: t('dashboard.topbar.mockDate'),
        role: roleLabelInline,
      })}
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setKpiPanelOpen((prev) => !prev)}
            aria-controls="kpi-panel"
          >
            <SlidersHorizontal />
            {t('dashboard.topbar.customizeKpis')}
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => navigate('/app/alerts')}>
            <Bell />
            {t('dashboard.topbar.alertsButton', { count: alertSummary?.active ?? 0 })}
          </Button>
        </>
      }
    >
      <div className="page-body dashboard-visual">
        <div className="alert-bar alert-bar--warn" role="alert">
          <AlertTriangle />
          <span>
            <strong>{t('dashboard.alerts.activeCount', { count: alertSummary?.active ?? 0 })}</strong>
            <span className="alert-bar__sep">|</span>{' '}
            {t('dashboard.alerts.reorder', { count: alertSummary?.reorder ?? 0 })}
            <span className="alert-bar__sep">|</span>{' '}
            {t('dashboard.alerts.expiring', {
              count: alertSummary?.expiring ?? 0,
              days: alertSummary?.expiringDays ?? 0,
            })}
            <span className="alert-bar__sep">|</span>{' '}
            {t('dashboard.alerts.returns', { count: alertSummary?.returns ?? 0 })}
          </span>
          <span className="alert-bar__spacer" />
          <Button variant="ghost" size="sm" type="button">
            {t('dashboard.alerts.viewAll')}
          </Button>
        </div>
        {overviewError ? (
          <div className="alert-bar alert-bar--warn" role="alert">
            {overviewError}
          </div>
        ) : null}

        <section
          id="kpi-panel"
          className={`kpi-selector${kpiPanelOpen ? ' open' : ''}`}
          aria-label={t('dashboard.kpiPanel.ariaLabel')}
          aria-live="polite"
        >
          <div className="s-head">
            <span className="s-head__label">{t('dashboard.kpiPanel.title')}</span>
            <div className="s-head__rule" />
            <Button variant="ghost" size="sm" type="button" onClick={() => setKpiPanelOpen(false)}>
              {t('dashboard.kpiPanel.close')}
            </Button>
          </div>
          <p className="kpi-help">{t('dashboard.kpiPanel.help')}</p>
          <fieldset className="kpi-selector__grid">
            <legend className="sr-only">{t('dashboard.kpiPanel.legend')}</legend>
            {(Object.keys(kpis) as KpiKey[]).map((key) => {
              const kpi = overview?.visualKpis.find((item) => item.key === key)
              return (
                <button
                  key={key}
                  className={`kpi-toggle${kpis[key] ? ' on' : ''}`}
                  type="button"
                  onClick={() => toggleKpi(key)}
                >
                  <span className="kpi-toggle__check" />
                  <span className="kpi-toggle__name">
                    {kpi ? kpiText(t, kpi, 'shortTitle') : key}
                  </span>
                </button>
              )
            })}
          </fieldset>
        </section>

        <section className="kpi-score-grid" aria-label={t('dashboard.visualSummary.ariaLabel')}>
          {visualKpis.map((kpi) => {
            const Icon = kpiIcons[kpi.key]
            const unit = kpiText(t, kpi, 'unit')
            return (
              <Card key={kpi.key} className="kpi-score-card rounded-lg">
                <CardHeader className="kpi-score-card__head">
                  <div className={`kpi-score-card__icon ${kpiIconClass[kpi.key]}`}>
                    <Icon />
                  </div>
                  <Badge variant={statusVariant[kpi.status]}>{kpiText(t, kpi, 'statusLabel')}</Badge>
                </CardHeader>
                <CardContent className="kpi-score-card__body">
                  <p className="kpi-score-card__label">{kpiText(t, kpi, 'shortTitle')}</p>
                  <p className="kpi-score-card__value">
                    {formatKpiValue(kpi.value, unit, kpi.precision, locale)}
                  </p>
                  <p className="kpi-score-card__target">{kpiText(t, kpi, 'target')}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <div className="dashboard-grid">
          {focusKpi ? (
            <section className="dashboard-grid__main" aria-label={t('dashboard.visualSummary.mainKpi')}>
              <Card className="kpi-detail-card rounded-lg">
                <CardHeader className="kpi-detail-card__header">
                  <div>
                    <CardTitle className="kpi-detail-card__title">{kpiText(t, focusKpi, 'title')}</CardTitle>
                    <CardDescription>{kpiText(t, focusKpi, 'formula')}</CardDescription>
                  </div>
                  <Badge variant={statusVariant[focusKpi.status]}>
                    {kpiText(t, focusKpi, 'statusLabel')}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="kpi-detail-card__value-row">
                    <span>
                      {formatKpiValue(
                        focusKpi.value,
                        kpiText(t, focusKpi, 'unit'),
                        focusKpi.precision,
                        locale,
                      )}
                    </span>
                    <small>{kpiText(t, focusKpi, 'insight')}</small>
                  </div>
                  <KpiChart kpi={focusKpi} />
                </CardContent>
              </Card>
            </section>
          ) : null}

          <aside className="dashboard-grid__side" aria-label={t('dashboard.sections.recentMovements')}>
            <div className="s-head">
              <span className="s-head__label">{t('dashboard.sections.recentMovements')}</span>
              <div className="s-head__rule" />
            </div>
            <ol className="mov-list">
              {movements.slice(0, 4).map((movement) => (
                <li key={movement.id} className="mov-item">
                  <span
                    className={`mov-pip mov-pip--${movementClass(movement.type)}`}
                    aria-label={t(`dashboard.movements.${movement.type}`)}
                  />
                  <div>
                    <p className="mov-title">{movement.title}</p>
                    <div className="mov-meta">
                      <span className="sku">{movement.sku}</span>
                      <span>{t('dashboard.units.short', { count: movement.quantity })}</span>
                      {movement.status === 'pending' ? (
                        <span className="pill pill--warn pill--tiny">{t('dashboard.status.pending')}</span>
                      ) : null}
                    </div>
                  </div>
                  <time className="mov-time">{movement.time ?? '-'}</time>
                </li>
              ))}
            </ol>
            <div className="kpi-export-box">
              <CheckCircle2 />
              <div>
                <strong>{t('dashboard.visualSummary.reportReady')}</strong>
                <span>{t('dashboard.visualSummary.mockNote')}</span>
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                aria-label={t('dashboard.visualSummary.downloadReport')}
              >
                <Download />
              </Button>
            </div>
          </aside>
        </div>

        <section className="kpi-chart-grid" aria-label={t('dashboard.visualSummary.chartsAriaLabel')}>
          {visualKpis.slice(1).map((kpi) => (
            <Card key={kpi.key} className="kpi-chart-card rounded-lg">
              <CardHeader className="kpi-chart-card__header">
                <div>
                  <CardTitle className="kpi-chart-card__title">{kpiText(t, kpi, 'title')}</CardTitle>
                  <CardDescription>{kpiText(t, kpi, 'insight')}</CardDescription>
                </div>
                <span className="kpi-chart-card__value">
                  {formatKpiValue(kpi.value, kpiText(t, kpi, 'unit'), kpi.precision, locale)}
                </span>
              </CardHeader>
              <CardContent>
                <KpiChart kpi={kpi} />
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  )
}

export default DashboardPage
