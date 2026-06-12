import React from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/useAuthStore'

type AppShellProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

type AppShellChromeProps = Readonly<{
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  t: (key: string) => string
  language: string
  roleLabel: string
  displayName: string
  avatarInitials: string
  canManageInventory: boolean
  canManageAdmin: boolean
  isDashboard: boolean
  isInventory: boolean
  isReception: boolean
  isDispatch: boolean
  isReturns: boolean
  isAlerts: boolean
  isCatalog: boolean
  isLocations: boolean
  isPurchasing: boolean
  isAdmin: boolean
  handleLanguageChange: (next: 'es' | 'en') => void
  handleLogout: () => void
}>

type ShellRailProps = Readonly<{
  t: (key: string) => string
  canManageInventory: boolean
  canManageAdmin: boolean
  isDashboard: boolean
  isInventory: boolean
  isReception: boolean
  isDispatch: boolean
  isReturns: boolean
  isAlerts: boolean
  isCatalog: boolean
  isLocations: boolean
  isPurchasing: boolean
  isAdmin: boolean
}>

type ShellSidebarProps = Readonly<{
  t: (key: string) => string
  roleLabel: string
  displayName: string
  avatarInitials: string
  canManageInventory: boolean
  canManageAdmin: boolean
  isDashboard: boolean
  isInventory: boolean
  isReception: boolean
  isDispatch: boolean
  isReturns: boolean
  isAlerts: boolean
  isCatalog: boolean
  isLocations: boolean
  isPurchasing: boolean
  isAdmin: boolean
  handleLogout: () => void
}>

type ShellTopbarProps = Readonly<{
  title: string
  subtitle?: string
  actions?: ReactNode
  t: (key: string) => string
  language: string
  handleLanguageChange: (next: 'es' | 'en') => void
}>

function getRoleLabel(
  t: any,
  role: string | undefined,
) {
  switch (role) {
    case 'auxiliar_despacho':
      return t('dashboard.roles.auxiliar_despacho.upper')
    case 'administrador':
      return t('dashboard.roles.administrador.upper')
    case 'almacenista':
      return t('dashboard.roles.almacenista.upper')
    default:
      return t('dashboard.roles.usuario.upper')
  }
}

function getDisplayName(
  t: any,
  user: {
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    email?: string | null
  } | null,
) {
  const parts = [user?.first_name, user?.last_name].filter(Boolean)
  if (parts.length) {
    return parts.join(' ')
  }
  return user?.username || user?.email || t('dashboard.user.fallbackName')
}

function getAvatarInitials(displayName: string) {
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
}

type SidebarNavCommonProps = Readonly<{
  t: any
  locationPathname: string
  canManageInventory: boolean
  canManageAdmin: boolean
  isDashboard: boolean
  isInventory: boolean
  isReception: boolean
  isDispatch: boolean
  isReturns: boolean
  isAlerts: boolean
}>

function SidebarGeneralSection({ t, isDashboard, isInventory, canManageInventory }: SidebarNavCommonProps) {
  return (
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
  )
}

type SidebarCatalogSectionProps = Readonly<SidebarNavCommonProps & {
  isCatalog: boolean
  catalogOpen: boolean
  setCatalogOpen: React.Dispatch<React.SetStateAction<boolean>>
}>

function SidebarCatalogSection({ t, locationPathname, isCatalog, catalogOpen, setCatalogOpen }: SidebarCatalogSectionProps) {
  return (
    <div className="nav__section">
      <span className="nav__label">{t('catalog.nav.title')}</span>
      <button
        type="button"
        className={`nav__link nav__link--group${isCatalog ? ' active' : ''}`}
        onClick={() => setCatalogOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        {t('dashboard.nav.catalog')}
        <svg
          className={`nav__chevron${catalogOpen ? ' nav__chevron--open' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {catalogOpen ? (
        <div className="nav__submenu">
          <Link
            className={`nav__sublink${locationPathname.startsWith('/app/catalog/products') ? ' active' : ''}`}
            to="/app/catalog/products"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="2" width="20" height="8" rx="1" />
              <rect x="2" y="14" width="20" height="8" rx="1" />
            </svg>
            {t('catalog.nav.products')}
          </Link>
          <Link
            className={`nav__sublink${locationPathname.startsWith('/app/catalog/categories') ? ' active' : ''}`}
            to="/app/catalog/categories"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            {t('catalog.nav.categories')}
          </Link>
          <Link
            className={`nav__sublink${locationPathname.startsWith('/app/catalog/brands') ? ' active' : ''}`}
            to="/app/catalog/brands"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            {t('catalog.nav.brands')}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

type SidebarPurchasingSectionProps = Readonly<SidebarNavCommonProps & {
  isPurchasing: boolean
  purchasingOpen: boolean
  setPurchasingOpen: React.Dispatch<React.SetStateAction<boolean>>
}>

function SidebarPurchasingSection({ t, locationPathname, isPurchasing, purchasingOpen, setPurchasingOpen }: SidebarPurchasingSectionProps) {
  return (
    <div className="nav__section">
      <span className="nav__label">{t('dashboard.nav.purchasingSection', 'COMPRAS')}</span>
      <button
        type="button"
        className={`nav__link nav__link--group${isPurchasing ? ' active' : ''}`}
        onClick={() => setPurchasingOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        {t('dashboard.nav.purchasing', 'Compras')}
        <svg
          className={`nav__chevron${purchasingOpen ? ' nav__chevron--open' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {purchasingOpen ? (
        <div className="nav__submenu">
          <Link
            className={`nav__sublink${locationPathname.startsWith('/app/purchasing/suppliers') ? ' active' : ''}`}
            to="/app/purchasing/suppliers"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {t('dashboard.nav.suppliers', 'Proveedores')}
          </Link>
          <Link
            className={`nav__sublink${locationPathname.startsWith('/app/purchasing/purchase-orders') ? ' active' : ''}`}
            to="/app/purchasing/purchase-orders"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {t('dashboard.nav.purchaseOrders', 'Órdenes de Compra')}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

type SidebarLocationsSectionProps = Readonly<SidebarNavCommonProps & {
  isLocations: boolean
  locationsOpen: boolean
  setLocationsOpen: React.Dispatch<React.SetStateAction<boolean>>
}>

function SidebarLocationsSection({ t, locationPathname, isLocations, locationsOpen, setLocationsOpen }: SidebarLocationsSectionProps) {
  return (
    <div className="nav__section">
      <span className="nav__label">{t('dashboard.nav.locationsSection', 'LOCACIÓN')}</span>
      <button
        type="button"
        className={`nav__link nav__link--group${isLocations ? ' active' : ''}`}
        onClick={() => setLocationsOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {t('dashboard.nav.locations', 'LOCACIÓN')}
        <svg
          className={`nav__chevron${locationsOpen ? ' nav__chevron--open' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {locationsOpen ? (
        <div className="nav__submenu">
          <Link
            className={`nav__sublink${locationPathname === '/app/locations' ? ' active' : ''}`}
            to="/app/locations"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {t('dashboard.nav.warehouse', 'Bodegas')}
          </Link>
          <Link
            className={`nav__sublink${locationPathname.startsWith('/app/locations/transfers') ? ' active' : ''}`}
            to="/app/locations/transfers"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3l4 4l-4 4" />
              <path d="M3 7h18" />
              <path d="M7 21l-4-4l4-4" />
              <path d="M21 17H3" />
            </svg>
            {t('dashboard.nav.transfers', 'Transferencias')}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function SidebarOperationsSection({
  t,
  locationPathname,
  canManageInventory,
  isReception,
  isDispatch,
  isReturns,
  isAlerts,
}: SidebarNavCommonProps) {
  return (
    <div className="nav__section">
      <span className="nav__label">{t('dashboard.nav.operations')}</span>
      <Link className={`nav__link${isReception ? ' active' : ''}`} to="/app/reception">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2v20M2 12h20" />
        </svg>
        {t('dashboard.nav.reception')}
      </Link>
      <Link className={`nav__link${isDispatch ? ' active' : ''}`} to="/app/dispatch">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        {t('dashboard.nav.dispatch')}
      </Link>
      {canManageInventory ? (
        <Link className={`nav__link${isReturns ? ' active' : ''}`} to="/app/returns">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h11a6 6 0 010 12h-1" />
          </svg>
          {t('dashboard.nav.returns')}
        </Link>
      ) : null}
      {canManageInventory ? (
        <Link className={`nav__link${locationPathname.startsWith('/app/adjustments') ? ' active' : ''}`} to="/app/adjustments">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 3h18v4H3z" />
            <path d="M3 11h18v10H3z" />
          </svg>
          {t('dashboard.nav.adjustments')}
        </Link>
      ) : null}
      <Link className={`nav__link${isAlerts ? ' active' : ''}`} to="/app/alerts">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {t('dashboard.nav.alerts')}
      </Link>
    </div>
  )
}

function SidebarAdminSection({
  t,
  locationPathname,
  canManageAdmin,
  isAdmin,
}: SidebarNavCommonProps & { isAdmin: boolean }) {
  const [adminOpen, setAdminOpen] = React.useState(isAdmin)

  React.useEffect(() => {
    if (isAdmin) setAdminOpen(true)
  }, [isAdmin])

  if (!canManageAdmin) {
    return null
  }

  return (
    <div className="nav__section">
      <span className="nav__label">{t('dashboard.nav.administration')}</span>
      <button
        type="button"
        className={`nav__link nav__link--group${isAdmin ? ' active' : ''}`}
        onClick={() => setAdminOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        {t('dashboard.nav.administration')}
        <svg
          className={`nav__chevron${adminOpen ? ' nav__chevron--open' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {adminOpen ? (
        <div className="nav__submenu">
          <Link
            className={`nav__sublink${locationPathname.startsWith('/app/admin/audit') ? ' active' : ''}`}
            to="/app/admin/audit"
          >
            {t('dashboard.nav.audit')}
          </Link>
          <Link
            className={`nav__sublink${locationPathname.startsWith('/app/admin/users') ? ' active' : ''}`}
            to="/app/admin/users"
          >
            Usuarios
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function ShellRail({
  t,
  canManageInventory,
  canManageAdmin,
  isDashboard,
  isInventory,
  isReception,
  isDispatch,
  isReturns,
  isAlerts,
  isCatalog,
  isLocations,
  isPurchasing,
  isAdmin,
}: ShellRailProps) {
  return (
    <nav className="rail" aria-label={t('dashboard.nav.quickAccess')}>
      <Link className={`rail__btn${isDashboard ? ' active' : ''}`} title={t('dashboard.nav.dashboard')} to="/app">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </Link>
      {canManageInventory ? (
        <Link className={`rail__btn${isInventory ? ' active' : ''}`} title={t('dashboard.nav.inventory')} to="/app/inventory">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
        </Link>
      ) : null}
      <Link className={`rail__btn${isCatalog ? ' active' : ''}`} title={t('dashboard.nav.catalog')} to="/app/catalog/products">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </Link>
      <Link className={`rail__btn${isPurchasing ? ' active' : ''}`} title={t('dashboard.nav.purchasing')} to="/app/purchasing/suppliers">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      </Link>
      {canManageInventory ? (
        <Link className={`rail__btn${isLocations ? ' active' : ''}`} title={t('dashboard.nav.locations') || 'LOCACIÓN'} to="/app/locations">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Link>
      ) : null}
      <Link className={`rail__btn${isReception ? ' active' : ''}`} title={t('dashboard.nav.reception')} to="/app/reception">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2v20M2 12h20" />
        </svg>
      </Link>
      <Link className={`rail__btn${isDispatch ? ' active' : ''}`} title={t('dashboard.nav.dispatch')} to="/app/dispatch">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
      <div className="rail__sep"></div>
      {canManageInventory ? (
        <Link className={`rail__btn${isReturns ? ' active' : ''}`} title={t('dashboard.nav.returns')} to="/app/returns">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h11a6 6 0 010 12h-1" />
          </svg>
        </Link>
      ) : null}
      {canManageAdmin ? (
        <Link className={`rail__btn${isAdmin ? ' active' : ''}`} title={t('dashboard.nav.audit')} to="/app/admin/audit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </Link>
      ) : null}
      <div className="rail__spacer"></div>
      <Link className={`rail__btn${isAlerts ? ' active' : ''}`} title={t('dashboard.nav.alerts')} to="/app/alerts">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        <span className="rail__badge" />
      </Link>
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
  )
}

function ShellSidebar({
  t,
  roleLabel,
  displayName,
  avatarInitials,
  canManageInventory,
  canManageAdmin,
  isDashboard,
  isInventory,
  isReception,
  isDispatch,
  isReturns,
  isAlerts,
  isCatalog,
  isLocations,
  isPurchasing,
  isAdmin,
  handleLogout,
}: ShellSidebarProps) {
  const location = useLocation()
  const [catalogOpen, setCatalogOpen] = React.useState(isCatalog)
  const [locationsOpen, setLocationsOpen] = React.useState(isLocations)
  const [purchasingOpen, setPurchasingOpen] = React.useState(isPurchasing)

  React.useEffect(() => {
    if (isCatalog) setCatalogOpen(true)
  }, [isCatalog])

  React.useEffect(() => {
    if (isLocations) setLocationsOpen(true)
  }, [isLocations])

  React.useEffect(() => {
    if (isPurchasing) setPurchasingOpen(true)
  }, [isPurchasing])

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__logo">
          <div className="logo-mark">ICM</div>
          <div>
            <p className="sidebar__brand-name">{t('dashboard.sidebar.brandName')}</p>
            <p className="sidebar__brand-sub">{t('dashboard.sidebar.version')}</p>
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
        <SidebarGeneralSection
          t={t}
          locationPathname={location.pathname}
          canManageInventory={canManageInventory}
          canManageAdmin={canManageAdmin}
          isDashboard={isDashboard}
          isInventory={isInventory}
          isReception={isReception}
          isDispatch={isDispatch}
          isReturns={isReturns}
          isAlerts={isAlerts}
        />
        <SidebarCatalogSection
          t={t}
          locationPathname={location.pathname}
          canManageInventory={canManageInventory}
          canManageAdmin={canManageAdmin}
          isDashboard={isDashboard}
          isInventory={isInventory}
          isReception={isReception}
          isDispatch={isDispatch}
          isReturns={isReturns}
          isAlerts={isAlerts}
          isCatalog={isCatalog}
          catalogOpen={catalogOpen}
          setCatalogOpen={setCatalogOpen}
        />
        <SidebarPurchasingSection
          t={t}
          locationPathname={location.pathname}
          canManageInventory={canManageInventory}
          canManageAdmin={canManageAdmin}
          isDashboard={isDashboard}
          isInventory={isInventory}
          isReception={isReception}
          isDispatch={isDispatch}
          isReturns={isReturns}
          isAlerts={isAlerts}
          isPurchasing={isPurchasing}
          purchasingOpen={purchasingOpen}
          setPurchasingOpen={setPurchasingOpen}
        />
        <SidebarLocationsSection
          t={t}
          locationPathname={location.pathname}
          canManageInventory={canManageInventory}
          canManageAdmin={canManageAdmin}
          isDashboard={isDashboard}
          isInventory={isInventory}
          isReception={isReception}
          isDispatch={isDispatch}
          isReturns={isReturns}
          isAlerts={isAlerts}
          isLocations={isLocations}
          locationsOpen={locationsOpen}
          setLocationsOpen={setLocationsOpen}
        />
        <SidebarOperationsSection
          t={t}
          locationPathname={location.pathname}
          canManageInventory={canManageInventory}
          canManageAdmin={canManageAdmin}
          isDashboard={isDashboard}
          isInventory={isInventory}
          isReception={isReception}
          isDispatch={isDispatch}
          isReturns={isReturns}
          isAlerts={isAlerts}
        />
        <SidebarAdminSection
          t={t}
          locationPathname={location.pathname}
          canManageInventory={canManageInventory}
          canManageAdmin={canManageAdmin}
          isDashboard={isDashboard}
          isInventory={isInventory}
          isReception={isReception}
          isDispatch={isDispatch}
          isReturns={isReturns}
          isAlerts={isAlerts}
          isAdmin={isAdmin}
        />
      </nav>
      <footer className="sidebar__footer">
        <button className="nav__link" onClick={handleLogout} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="nav__icon">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
          </svg>
          {t('dashboard.nav.logout')}
        </button>
      </footer>
    </aside>
  )
}

function ShellTopbar({ title, subtitle, actions, t, language, handleLanguageChange }: ShellTopbarProps) {
  return (
    <header className="topbar">
      <div>
        <h1 className="topbar__title">{title}</h1>
        {subtitle ? <p className="topbar__path">{subtitle}</p> : null}
      </div>
      <div className="topbar__spacer" />
      <div className="topbar__actions">
        <div className="topbar__lang">
          <button
            className={`btn btn--ghost btn--sm${language === 'es' ? ' active' : ''}`}
            type="button"
            onClick={() => handleLanguageChange('es')}
          >
            ES
          </button>
          <button
            className={`btn btn--ghost btn--sm${language === 'en' ? ' active' : ''}`}
            type="button"
            onClick={() => handleLanguageChange('en')}
          >
            EN
          </button>
        </div>
        {actions}
      </div>
      <span className="sr-only">{t('common.main.ariaLabel')}</span>
    </header>
  )
}

function AppShellChrome({
  title,
  subtitle,
  actions,
  children,
  t,
  language,
  roleLabel,
  displayName,
  avatarInitials,
  canManageInventory,
  canManageAdmin,
  isDashboard,
  isInventory,
  isReception,
  isDispatch,
  isReturns,
  isAlerts,
  isCatalog,
  isLocations,
  isPurchasing,
  isAdmin,
  handleLanguageChange,
  handleLogout,
}: AppShellChromeProps) {
  return (
    <div className="shell-a">
      <ShellRail
        t={t}
        canManageInventory={canManageInventory}
        canManageAdmin={canManageAdmin}
        isDashboard={isDashboard}
        isInventory={isInventory}
        isReception={isReception}
        isDispatch={isDispatch}
        isReturns={isReturns}
        isAlerts={isAlerts}
        isCatalog={isCatalog}
        isLocations={isLocations}
        isPurchasing={isPurchasing}
        isAdmin={isAdmin}
      />

      <ShellSidebar
        t={t}
        roleLabel={roleLabel}
        displayName={displayName}
        avatarInitials={avatarInitials}
        canManageInventory={canManageInventory}
        canManageAdmin={canManageAdmin}
        isDashboard={isDashboard}
        isInventory={isInventory}
        isReception={isReception}
        isDispatch={isDispatch}
        isReturns={isReturns}
        isAlerts={isAlerts}
        isCatalog={isCatalog}
        isLocations={isLocations}
        isPurchasing={isPurchasing}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
      />

      <main className="main" aria-label={t('common.main.ariaLabel')}>
        <ShellTopbar
          title={title}
          subtitle={subtitle}
          actions={actions}
          t={t}
          language={language}
          handleLanguageChange={handleLanguageChange}
        />

        {children}
      </main>
    </div>
  )
}

function AppShell({ title, subtitle, actions, children }: Readonly<AppShellProps>) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const language = i18n.resolvedLanguage ?? i18n.language

  const roleLabel = getRoleLabel(t, user?.role)

  const displayName = getDisplayName(t, user)

  const avatarInitials = getAvatarInitials(displayName)

  const canManageInventory =
    user?.role === 'administrador' ||
    user?.role === 'almacenista'

  const canManageAdmin =
    user?.role === 'administrador' ||
    user?.role === 'almacenista'

  const isDashboard = location.pathname === '/app'

  const isInventory = location.pathname.startsWith('/app/inventory')

  const isReception = location.pathname.startsWith('/app/reception')

  const isDispatch = location.pathname.startsWith('/app/dispatch')

  const isReturns = location.pathname.startsWith('/app/returns')

  const isAlerts = location.pathname.startsWith('/app/alerts')

  const isCatalog = location.pathname.startsWith('/app/catalog')

  const isLocations = location.pathname.startsWith('/app/locations')

  const isPurchasing = location.pathname.startsWith('/app/purchasing')

  const isAdmin = location.pathname.startsWith('/app/admin')

  const handleLanguageChange = (next: 'es' | 'en') => {
    if (next !== language) {
      i18n.changeLanguage(next)
    }
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppShellChrome
      title={title}
      subtitle={subtitle}
      actions={actions}
      t={t}
      language={language}
      roleLabel={roleLabel}
      displayName={displayName}
      avatarInitials={avatarInitials}
      canManageInventory={canManageInventory}
      canManageAdmin={canManageAdmin}
      isDashboard={isDashboard}
      isInventory={isInventory}
      isReception={isReception}
      isDispatch={isDispatch}
      isReturns={isReturns}
      isAlerts={isAlerts}
      isCatalog={isCatalog}
      isLocations={isLocations}
      isPurchasing={isPurchasing}
      isAdmin={isAdmin}
      handleLanguageChange={handleLanguageChange}
      handleLogout={handleLogout}
    >
      {children}
    </AppShellChrome>
  )
}

export default AppShell
