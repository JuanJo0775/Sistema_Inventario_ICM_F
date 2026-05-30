import { useMemo, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/useAuthStore'

type AppShellProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const language = i18n.resolvedLanguage ?? i18n.language

  const handleLanguageChange = (next: 'es' | 'en') => {
    if (next !== language) {
      i18n.changeLanguage(next)
    }
  }

  const roleLabel = useMemo(() => {
    switch (user?.role) {
      case 'auxiliar_despacho':
        return t('dashboard.roles.auxiliar_despacho.upper')
      case 'administrador':
        return t('dashboard.roles.administrador.upper')
      case 'almacenista':
        return t('dashboard.roles.almacenista.upper')
      default:
        return t('dashboard.roles.usuario.upper')
    }
  }, [t, user?.role])

  const displayName = useMemo(() => {
    const parts = [user?.first_name, user?.last_name].filter(Boolean)
    if (parts.length) {
      return parts.join(' ')
    }
    return user?.username || user?.email || t('dashboard.user.fallbackName')
  }, [t, user?.email, user?.first_name, user?.last_name, user?.username])

  const avatarInitials = useMemo(() => {
    const base = displayName.trim()
    if (!base) {
      return 'ICM'
    }
    const letters = base
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .filter(Boolean)
    return letters.join('') || 'ICM'
  }, [displayName])

  const canManageInventory =
    user?.role === 'almacenista' || user?.role === 'administrador'
  const canManageAdmin =
    user?.role === 'almacenista' || user?.role === 'administrador'
  const canViewAnalytics =
    user?.role === 'almacenista' || user?.role === 'administrador'

  const isDashboard = location.pathname === '/app'
  const isInventory = location.pathname.startsWith('/app/inventory')

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell-a">
      <nav className="rail" aria-label={t('dashboard.nav.quickAccess')}>
        <Link
          className={`rail__btn${isDashboard ? ' active' : ''}`}
          title={t('dashboard.nav.dashboard')}
          to="/app"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </Link>
        {canManageInventory ? (
          <Link
            className={`rail__btn${isInventory ? ' active' : ''}`}
            title={t('dashboard.nav.inventory')}
            to="/app/inventory"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
          </Link>
        ) : null}
        <button className="rail__btn" title={t('dashboard.nav.reception')} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2v20M2 12h20" />
          </svg>
        </button>
        <button className="rail__btn" title={t('dashboard.nav.dispatch')} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <div className="rail__sep"></div>
        <button className="rail__btn" title={t('dashboard.nav.returns')} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h11a6 6 0 010 12h-1" />
          </svg>
        </button>
        {canManageAdmin ? (
          <button className="rail__btn" title={t('dashboard.nav.settings')} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3" />
            </svg>
          </button>
        ) : null}
        <div className="rail__spacer"></div>
        <button className="rail__btn" title={t('dashboard.nav.alerts')} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="rail__badge" />
        </button>
        {canManageAdmin ? (
          <button className="rail__btn" title={t('dashboard.nav.users')} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </button>
        ) : null}
      </nav>

      <aside className="sidebar">
        <header className="sidebar__header">
          <div className="sidebar__logo">
            <div className="logo-mark">ICM</div>
            <div>
              <p className="sidebar__brand-name">
                {t('dashboard.sidebar.brandName')}
              </p>
              <p className="sidebar__brand-sub">
                {t('dashboard.sidebar.version')}
              </p>
            </div>
          </div>
          <div className="sidebar__user">
            <div className="avatar avatar--teal">{avatarInitials}</div>
            <div>
              <p className="sidebar__user-name">{displayName}</p>
              <p className="sidebar__user-role">{roleLabel}</p>
            </div>
          </div>
        </header>
        <nav aria-label={t('dashboard.nav.mainMenu')}>
          <div className="nav__section">
            <span className="nav__label">{t('dashboard.nav.general')}</span>
            <Link className={`nav__link${isDashboard ? ' active' : ''}`} to="/app">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              {t('dashboard.nav.dashboard')}
            </Link>
            {canManageInventory ? (
              <Link className={`nav__link${isInventory ? ' active' : ''}`} to="/app/inventory">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                </svg>
                {t('dashboard.nav.inventory')}
              </Link>
            ) : null}
          </div>
          <div className="nav__section">
            <span className="nav__label">{t('dashboard.nav.operations')}</span>
            <button className="nav__link" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2v20M2 12h20" />
              </svg>
              {t('dashboard.nav.reception')}
            </button>
            <button className="nav__link" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              {t('dashboard.nav.dispatch')}
            </button>
            <button className="nav__link" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 14L4 9l5-5" />
                <path d="M4 9h11a6 6 0 010 12h-1" />
              </svg>
              {t('dashboard.nav.returns')}
            </button>
            {canManageAdmin ? (
              <button className="nav__link" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3" />
                </svg>
                {t('dashboard.nav.settings')}
              </button>
            ) : null}
          </div>
          {canViewAnalytics ? (
            <div className="nav__section">
              <span className="nav__label">{t('dashboard.nav.analytics')}</span>
              <button className="nav__link" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                {t('dashboard.nav.reports')}
              </button>
              <button className="nav__link" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {t('dashboard.nav.alerts')}
                <span className="nav__badge">4</span>
              </button>
            </div>
          ) : null}
          {canManageAdmin ? (
            <div className="nav__section">
              <span className="nav__label">{t('dashboard.nav.administration')}</span>
              <button className="nav__link" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {t('dashboard.nav.audit')}
              </button>
              <button className="nav__link" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
                {t('dashboard.nav.users')}
              </button>
              <button className="nav__link" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="2" y="3" width="4" height="18" />
                  <rect x="10" y="3" width="4" height="18" />
                  <rect x="18" y="3" width="4" height="18" />
                </svg>
                {t('dashboard.nav.catalog')}
              </button>
            </div>
          ) : null}
        </nav>
        <footer className="sidebar__footer">
          <button className="nav__link" onClick={handleLogout} type="button">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="nav__icon"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
            {t('dashboard.nav.logout')}
          </button>
        </footer>
      </aside>

      <main className="main" aria-label={t('common.main.ariaLabel')}>
        <header className="topbar">
          <div>
            <h1 className="topbar__title">{title}</h1>
            {subtitle ? <p className="topbar__path">{subtitle}</p> : null}
          </div>
          <div className="topbar__spacer"></div>
          <div className="topbar__actions">
            <fieldset className="lang-switch">
              <legend className="sr-only">
                {t('common.languageSwitcher.label')}
              </legend>
              <button
                className={`btn btn--ghost btn--sm${language === 'es' ? ' active' : ''}`}
                type="button"
                onClick={() => handleLanguageChange('es')}
                aria-pressed={language === 'es'}
              >
                ES
              </button>
              <button
                className={`btn btn--ghost btn--sm${language === 'en' ? ' active' : ''}`}
                type="button"
                onClick={() => handleLanguageChange('en')}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
            </fieldset>
            {actions}
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}

export default AppShell
