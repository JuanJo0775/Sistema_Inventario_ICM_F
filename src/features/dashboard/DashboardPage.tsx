import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import useAuthStore from '../../store/useAuthStore'
import type {
  DashboardKpiKey,
  DashboardMovementItem,
  DashboardOverview,
} from '../../interfaces/dashboard'
import { fetchDashboardOverview } from '../../services/dashboard'

type KpiKey = DashboardKpiKey

type MetricCard = {
  key: KpiKey
  className: string
  eyebrow: string
  value: string
  sub: string
  subClass?: string
  valueClass?: string
}

type KpiBar = {
  key: KpiKey
  name: string
  fillClass: string
  value: string
  delta?: string
  valueClass?: string
}

const initialKpis: Record<KpiKey, boolean> = {
  stock: true,
  despachos: true,
  reorden: true,
  facturas: true,
  rotacion: true,
  servicio: true,
  exactitud: true,
  vencimientos: false,
  devoluciones: false,
}

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { t } = useTranslation()
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

  const kpiLabels = useMemo(
    () => ({
      stock: t('dashboard.kpis.stock'),
      despachos: t('dashboard.kpis.despachos'),
      reorden: t('dashboard.kpis.reorden'),
      facturas: t('dashboard.kpis.facturas'),
      rotacion: t('dashboard.kpis.rotacion'),
      servicio: t('dashboard.kpis.servicio'),
      exactitud: t('dashboard.kpis.exactitud'),
      vencimientos: t('dashboard.kpis.vencimientos'),
      devoluciones: t('dashboard.kpis.devoluciones'),
    }),
    [t],
  )

  const metricCards = useMemo<MetricCard[]>(() => {
    if (!overview) {
      return []
    }

    return [
      {
        key: 'stock',
        className: 'metric-cell metric-cell--hero',
        eyebrow: t('dashboard.metricCards.stock.eyebrow'),
        value: overview.metrics.stockTotal.toLocaleString('es-CO'),
        sub: t('dashboard.metricCards.stock.sub', {
          count: overview.metrics.stockTotal,
        }),
      },
      {
        key: 'despachos',
        className: 'metric-cell metric-cell--light',
        eyebrow: t('dashboard.metricCards.despachos.eyebrow'),
        value: overview.metrics.dispatchesToday.toString(),
        sub: t('dashboard.metricCards.despachos.sub'),
        subClass: 'metric-cell__sub metric-cell__sub--ok',
      },
      {
        key: 'reorden',
        className: 'metric-cell metric-cell--light',
        eyebrow: t('dashboard.metricCards.reorden.eyebrow'),
        value: overview.metrics.reorderCount.toString(),
        valueClass: 'metric-cell__val metric-cell__val--err',
        sub: t('dashboard.metricCards.reorden.sub'),
        subClass: 'metric-cell__sub metric-cell__sub--err',
      },
      {
        key: 'facturas',
        className: 'metric-cell metric-cell--light',
        eyebrow: t('dashboard.metricCards.facturas.eyebrow'),
        value: overview.metrics.invoicesIssued.toString(),
        sub: t('dashboard.metricCards.facturas.sub', {
          range: overview.metrics.invoiceRange,
        }),
        subClass: 'metric-cell__sub metric-cell__sub--mono',
      },
    ]
  }, [overview, t])

  const kpiBars = useMemo<KpiBar[]>(() => {
    if (!overview) {
      return []
    }

    const fillClassMap: Record<KpiKey, string> = {
      stock: 'kpi-fill kpi-fill--rotacion',
      despachos: 'kpi-fill kpi-fill--servicio',
      reorden: 'kpi-fill kpi-fill--rotacion',
      facturas: 'kpi-fill kpi-fill--servicio',
      rotacion: 'kpi-fill kpi-fill--rotacion',
      servicio: 'kpi-fill kpi-fill--servicio',
      exactitud: 'kpi-fill kpi-fill--exactitud',
      vencimientos: 'kpi-fill kpi-fill--vencimientos',
      devoluciones: 'kpi-fill kpi-fill--devoluciones',
    }

    const labelMap: Record<KpiKey, string> = {
      stock: t('dashboard.kpiBars.rotacion.name'),
      despachos: t('dashboard.kpiBars.servicio.name'),
      reorden: t('dashboard.kpiBars.rotacion.name'),
      facturas: t('dashboard.kpiBars.servicio.name'),
      rotacion: t('dashboard.kpiBars.rotacion.name'),
      servicio: t('dashboard.kpiBars.servicio.name'),
      exactitud: t('dashboard.kpiBars.exactitud.name'),
      vencimientos: t('dashboard.kpiBars.vencimientos.name'),
      devoluciones: t('dashboard.kpiBars.devoluciones.name'),
    }

    return overview.kpiBars.map((bar) => {
      if (bar.key === 'vencimientos') {
        return {
          key: bar.key,
          name: t('dashboard.kpiBars.vencimientos.name'),
          fillClass: fillClassMap[bar.key],
          value: bar.value.toString(),
          delta: t('dashboard.kpiBars.vencimientos.delta', {
            days: overview.alerts.expiringDays,
          }),
          valueClass: 'kpi-item__val kpi-item__val--warn',
        }
      }

      if (bar.key === 'devoluciones') {
        return {
          key: bar.key,
          name: t('dashboard.kpiBars.devoluciones.name'),
          fillClass: fillClassMap[bar.key],
          value: bar.value.toString(),
          delta: t('dashboard.kpiBars.devoluciones.delta'),
        }
      }

      return {
        key: bar.key,
        name: labelMap[bar.key],
        fillClass: fillClassMap[bar.key],
        value: `${bar.value}%`,
      }
    })
  }, [overview, t])

  const movements = overview?.movements ?? []
  const alertSummary = overview?.alerts

  const toggleKpi = (key: KpiKey) => {
    setKpis((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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

  return (
    <AppShell
      title={t('dashboard.topbar.title')}
      subtitle={t('dashboard.topbar.dateLine', {
        date: t('dashboard.topbar.mockDate'),
        role: roleLabelInline,
      })}
      actions={
        <>
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={() => setKpiPanelOpen((prev) => !prev)}
            aria-controls="kpi-panel"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {t('dashboard.topbar.customizeKpis')}
          </button>
          <button className="btn btn--ghost btn--sm" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {t('dashboard.topbar.alertsButton', { count: alertSummary?.active ?? 0 })}
          </button>
        </>
      }
    >
      <div className="page-body">
        <div className="alert-bar alert-bar--warn" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            <strong>
              {t('dashboard.alerts.activeCount', { count: alertSummary?.active ?? 0 })}
            </strong>
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
          <button className="btn btn--ghost btn--sm" type="button">
            {t('dashboard.alerts.viewAll')}
          </button>
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
            <span className="s-head__label">
              {t('dashboard.kpiPanel.title')}
            </span>
            <div className="s-head__rule" />
            <button
              className="btn btn--ghost btn--sm s-head__action"
              type="button"
              onClick={() => setKpiPanelOpen(false)}
            >
              {t('dashboard.kpiPanel.close')}
            </button>
          </div>
          <p className="kpi-help">{t('dashboard.kpiPanel.help')}</p>
          <fieldset className="kpi-selector__grid">
            <legend className="sr-only">{t('dashboard.kpiPanel.legend')}</legend>
            {(Object.keys(kpis) as KpiKey[]).map((key) => (
              <button
                key={key}
                className={`kpi-toggle${kpis[key] ? ' on' : ''}`}
                type="button"
                onClick={() => toggleKpi(key)}
              >
                <span className="kpi-toggle__check" />
                <span className="kpi-toggle__name">{kpiLabels[key]}</span>
              </button>
            ))}
          </fieldset>
        </section>

        <section className="metric-strip" aria-label={t('dashboard.metrics.selected')}>
          {metricCards.map((card) =>
            kpis[card.key] ? (
              <div key={card.key} className={card.className}>
                <p className="metric-cell__eyebrow">{card.eyebrow}</p>
                <p className={card.valueClass || 'metric-cell__val'}>{card.value}</p>
                <p className={card.subClass || 'metric-cell__sub'}>{card.sub}</p>
              </div>
            ) : null,
          )}
        </section>

        <div className="split split--3-1">
          <section aria-label={t('dashboard.sections.recentMovements')}>
            <div className="s-head">
              <span className="s-head__label">
                {t('dashboard.sections.recentMovements')}
              </span>
              <div className="s-head__rule" />
              <button className="btn btn--ghost btn--sm s-head__action" type="button">
                {t('dashboard.sections.viewHistory')}
              </button>
            </div>
            <ol className="mov-list">
              {movements.map((movement) => (
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
                      <span>{movement.user}</span>
                      {movement.status === 'pending' ? (
                        <span className="pill pill--warn pill--tiny">
                          {t('dashboard.status.pending')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <time className="mov-time">{movement.time ?? '-'}</time>
                </li>
              ))}
            </ol>
          </section>

          <aside aria-label={t('dashboard.sections.indicatorsAndActions')}>
            <div className="s-head">
              <span className="s-head__label">{t('dashboard.sections.indicators')}</span>
              <div className="s-head__rule" />
            </div>
            <ul className="kpi-list">
              {kpiBars.map((bar) =>
                kpis[bar.key] ? (
                  <li key={bar.key} className="kpi-item">
                    <div className="kpi-item__left">
                      <p className="kpi-item__name">{bar.name}</p>
                      <div className="kpi-item__bar">
                        <div className={bar.fillClass} />
                      </div>
                    </div>
                    <div className="kpi-item__right">
                      <p className={bar.valueClass || 'kpi-item__val'}>{bar.value}</p>
                      {bar.delta ? <p className="kpi-item__delta">{bar.delta}</p> : null}
                    </div>
                  </li>
                ) : null,
              )}
            </ul>

            <div className="c-divider" />

            <div className="s-head s-head--compact">
              <span className="s-head__label">{t('dashboard.sections.quickActions')}</span>
              <div className="s-head__rule" />
            </div>
            <nav className="quick-actions" aria-label={t('dashboard.sections.quickActions')}>
              <button className="quick-action quick-action--primary" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M2 12h20" />
                </svg>
                {t('dashboard.quickActions.newEntry')}
              </button>
              <button className="quick-action" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                {t('dashboard.quickActions.newDispatch')}
              </button>
              <button className="quick-action" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 14L4 9l5-5" />
                  <path d="M4 9h11a6 6 0 010 12h-1" />
                </svg>
                {t('dashboard.quickActions.registerReturn')}
              </button>
            </nav>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

export default DashboardPage
