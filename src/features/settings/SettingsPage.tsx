import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Activity, Bell, Building2, CheckCircle2, Eye, EyeOff, Globe,
  Info, Lock, Save, Server, Shield, Sliders, User,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { Button } from '../../components/ui/button'
import useAuthStore from '../../store/useAuthStore'
import { fetchMyProfile } from '../../services/profile'
import { changeMyPassword } from '../../services/profile'
import { fetchCompanyInfo } from '../../services/billing'
import { API_BASE_URL } from '../../services/api'
import type { UserItem } from '../../interfaces/users'
import type { CompanyInfo } from '../../interfaces/billing'

type Tab = 'general' | 'notifications' | 'security' | 'system'

const NOTIF_STORAGE_KEY = 'icm_notification_prefs'

interface NotificationPrefs {
  email_alerts: boolean
  stock_alerts: boolean
  expiration_alerts: boolean
  cold_chain_alerts: boolean
}

const defaultNotifs: NotificationPrefs = {
  email_alerts: true,
  stock_alerts: true,
  expiration_alerts: true,
  cold_chain_alerts: true,
}

function loadNotifPrefs(): NotificationPrefs {
  try {
    const saved = localStorage.getItem(NOTIF_STORAGE_KEY)
    return saved ? { ...defaultNotifs, ...JSON.parse(saved) } : defaultNotifs
  } catch {
    return defaultNotifs
  }
}

function saveNotifPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(prefs))
}

function Toggle({
  label, description, checked, onChange,
}: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="toggle-switch" style={{ width: '100%' }}>
      <div style={{ flex: 1 }}>
        <span className="toggle-switch__label">{label}</span>
        {description && <p style={{ fontSize: 11, color: 'var(--ink-40)', marginTop: 2 }}>{description}</p>}
      </div>
      <div className={`toggle-switch__track${checked ? ' on' : ''}`} style={{ flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </div>
    </label>
  )
}

function PasswordField({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="f-group">
      <label className="f-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="f-input"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: 36 }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar' : 'Mostrar'}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-40)', padding: 0,
            display: 'flex', alignItems: 'center',
          }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

function GeneralTab({ profile }: { profile: UserItem }) {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language

  const handleLanguage = (lang: string) => {
    if (lang !== language) {
      i18n.changeLanguage(lang)
      toast.success(`Idioma cambiado a ${lang === 'es' ? 'español' : 'inglés'}`)
    }
  }

  const initials = [profile.first_name, profile.last_name]
    .filter(Boolean).map((s) => s![0].toUpperCase()).join('') || profile.username[0]?.toUpperCase() || 'U'

  return (
    <>
      {/* Profile summary */}
      <div className="form-surface" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div className="avatar avatar--teal" style={{ width: 48, height: 48, fontSize: 17, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
            {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username}
          </p>
          <p style={{ fontSize: 12, color: 'var(--ink-40)', marginTop: 1 }}>
            {profile.email} · @{profile.username}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/app/profile'}>
          <User size={13} />
          Ver perfil
        </Button>
      </div>

      {/* Language */}
      <div className="form-surface">
        <fieldset>
          <legend><Globe size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Idioma / Language</legend>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              className={`btn ${language === 'es' ? 'btn--primary' : 'btn--outline'} btn--sm`}
              onClick={() => handleLanguage('es')}
            >
              Español
            </button>
            <button
              type="button"
              className={`btn ${language === 'en' ? 'btn--primary' : 'btn--outline'} btn--sm`}
              onClick={() => handleLanguage('en')}
            >
              English
            </button>
          </div>
          <p className="f-note" style={{ marginTop: 8 }}>
            Cambia el idioma de la interfaz del sistema.
          </p>
        </fieldset>
      </div>
    </>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadNotifPrefs)

  const update = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    saveNotifPrefs(next)
    toast.success('Preferencias guardadas')
  }

  return (
    <div className="form-surface">
      <fieldset>
        <legend><Bell size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Preferencias de notificación</legend>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <Toggle
            label="Notificaciones por correo"
            description="Recibe alertas importantes en tu correo electrónico"
            checked={prefs.email_alerts}
            onChange={(v) => update('email_alerts', v)}
          />
          <div className="c-divider" style={{ margin: '4px 0' }} />
          <Toggle
            label="Alertas de stock bajo"
            description="Notifica cuando un producto está por debajo del punto de reorden"
            checked={prefs.stock_alerts}
            onChange={(v) => update('stock_alerts', v)}
          />
          <div className="c-divider" style={{ margin: '4px 0' }} />
          <Toggle
            label="Alertas de vencimiento"
            description="Notifica cuando un producto está próximo a vencer"
            checked={prefs.expiration_alerts}
            onChange={(v) => update('expiration_alerts', v)}
          />
          <div className="c-divider" style={{ margin: '4px 0' }} />
          <Toggle
            label="Alertas de cadena de frío"
            description="Notifica cuando hay excursiones de temperatura en refrigeración"
            checked={prefs.cold_chain_alerts}
            onChange={(v) => update('cold_chain_alerts', v)}
          />
        </div>
      </fieldset>
    </div>
  )
}

function SecurityTab() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (next !== confirm) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await changeMyPassword({ current_password: current, new_password: next, new_password_confirm: confirm })
      toast.success('Contraseña actualizada correctamente')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const strength = useMemo(() => {
    if (!next) return { label: '', pct: 0, color: 'var(--ink-20)' }
    const hasUpper = /[A-Z]/.test(next)
    const hasLower = /[a-z]/.test(next)
    const hasDigit = /\d/.test(next)
    const hasSpecial = /[^A-Za-z0-9]/.test(next)
    const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length
    const pct = Math.min(100, (next.length >= 8 ? 25 : 0) + score * 18.75)
    if (pct < 40) return { label: 'Débil', pct, color: 'var(--err)' }
    if (pct < 70) return { label: 'Media', pct, color: 'var(--warn)' }
    return { label: 'Fuerte', pct, color: 'var(--ok)' }
  }, [next])

  return (
    <div className="form-surface">
      <fieldset>
        <legend><Lock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Cambiar contraseña</legend>

        <PasswordField label="Contraseña actual" value={current} onChange={setCurrent} placeholder="Ingresa tu contraseña actual" />

        <div className="f-row f-row-2" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <PasswordField label="Nueva contraseña" value={next} onChange={setNext} placeholder="Mínimo 8 caracteres" />
            {next && (
              <div style={{ marginTop: 2 }}>
                <div style={{ height: 3, borderRadius: 2, background: 'var(--ink-12)', overflow: 'hidden' }}>
                  <div style={{ width: `${strength.pct}%`, height: '100%', borderRadius: 2, background: strength.color, transition: 'width 0.2s, background 0.2s' }} />
                </div>
                <p style={{ fontSize: 10, color: strength.color, marginTop: 3, fontWeight: 600 }}>{strength.label}</p>
              </div>
            )}
          </div>
          <PasswordField label="Confirmar contraseña" value={confirm} onChange={setConfirm} placeholder="Repite la nueva contraseña" />
        </div>

        {error && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginTop: 16 }}>
            <span>{error}</span>
          </div>
        )}

        <div className="form-footer">
          <Button onClick={handleSave} disabled={saving || !current || !next || !confirm}>
            <Save size={14} />
            {saving ? 'Cambiando...' : 'Cambiar contraseña'}
          </Button>
        </div>
      </fieldset>
    </div>
  )
}

function SystemTab() {
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiOk, setApiOk] = useState<boolean | null>(null)

  useEffect(() => {
    fetchCompanyInfo()
      .then(setCompany)
      .catch(() => setCompany(null))
      .finally(() => setLoading(false))

    fetch(API_BASE_URL.replace('/api/v1', '/health/'), { method: 'HEAD' })
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* API Status */}
      <div className="form-surface">
        <fieldset>
          <legend><Server size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Estado del sistema</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>API Backend</p>
                <p style={{ fontSize: 11, color: 'var(--ink-40)', fontFamily: 'var(--ff-mono)' }}>{API_BASE_URL}</p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 6,
                fontSize: 11, fontWeight: 600,
                backgroundColor: apiOk === null ? 'var(--ink-06)' : apiOk ? 'rgba(45,139,111,0.1)' : 'rgba(179,58,42,0.1)',
                color: apiOk === null ? 'var(--ink-40)' : apiOk ? 'var(--ok)' : 'var(--err)',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                {apiOk === null ? 'Verificando...' : apiOk ? 'En línea' : 'Sin conexión'}
              </div>
            </div>
            <div className="c-divider" style={{ margin: '2px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>Aplicación</p>
                <p style={{ fontSize: 11, color: 'var(--ink-40)' }}>Sistema de Gestión de Inventario ICM</p>
              </div>
              <span className="pill pill--teal">v1.0.0</span>
            </div>
          </div>
        </fieldset>
      </div>

      {/* Company Info */}
      <div className="form-surface">
        <fieldset>
          <legend><Building2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Información de la empresa</legend>
          {loading ? (
            <p style={{ fontSize: 12, color: 'var(--ink-40)', padding: '8px 0' }}>Cargando...</p>
          ) : company ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div className="f-row f-row-2">
                <div>
                  <p className="f-label">Razón social</p>
                  <p style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{company.company_name}</p>
                </div>
                <div>
                  <p className="f-label">NIT</p>
                  <p style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{company.nit}</p>
                </div>
              </div>
              <div>
                <p className="f-label">Dirección</p>
                <p style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{company.address}</p>
              </div>
              <div className="f-row f-row-2">
                <div>
                  <p className="f-label">Teléfono</p>
                  <p style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{company.phone}</p>
                </div>
                <div>
                  <p className="f-label">Correo</p>
                  <p style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{company.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--ink-40)', padding: '8px 0' }}>
              No se pudo cargar la información de la empresa.
            </p>
          )}
        </fieldset>
      </div>

      {/* Quick actions */}
      <div className="form-surface">
        <fieldset>
          <legend><Sliders size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Acciones de administración</legend>
          <div className="quick-actions" style={{ marginTop: 4 }}>
            <button className="quick-action" type="button" onClick={() => window.location.href = '/app/admin/company'}>
              <Building2 size={14} />
              Configuración de empresa
            </button>
            <button className="quick-action" type="button" onClick={() => window.location.href = '/app/admin/audit'}>
              <Activity size={14} />
              Auditoría del sistema
            </button>
            <button className="quick-action" type="button" onClick={() => window.location.href = '/app/admin/users'}>
              <User size={14} />
              Gestión de usuarios
            </button>
          </div>
        </fieldset>
      </div>
    </div>
  )
}

function SettingsPage() {
  const storeUser = useAuthStore((state) => state.user)
  const [profile, setProfile] = useState<UserItem | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('general')

  useEffect(() => {
    if (storeUser) {
      fetchMyProfile().then(setProfile).catch(() => null)
    }
  }, [storeUser])

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'General', icon: <Sliders size={14} /> },
    { key: 'notifications', label: 'Notificaciones', icon: <Bell size={14} /> },
    { key: 'security', label: 'Seguridad', icon: <Shield size={14} /> },
    { key: 'system', label: 'Sistema', icon: <Server size={14} /> },
  ]

  return (
    <AppShell title="Configuración" subtitle="Ajustes del sistema">
      <div className="catalog-page fade-slide-up">
        <div className="dashboard-grid" style={{ gap: 24 }}>
          {/* Left — Tabs + content */}
          <div>
            {/* Tab bar */}
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-12)',
              borderRadius: 'var(--r-lg)',
              padding: 4,
              display: 'flex',
              gap: 2,
              marginBottom: 20,
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    border: 'none',
                    borderRadius: 'var(--r-md)',
                    background: activeTab === tab.key ? 'var(--teal-700)' : 'transparent',
                    color: activeTab === tab.key ? '#fff' : 'var(--ink-40)',
                    fontSize: 12,
                    fontWeight: activeTab === tab.key ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'general' && profile && <GeneralTab profile={profile} />}
            {!profile && activeTab === 'general' && (
              <div className="alert-bar alert-bar--info">
                <Info size={14} />
                <span>Cargando información del perfil...</span>
              </div>
            )}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'system' && <SystemTab />}
          </div>

          {/* Right sidebar — info panel */}
          <div>
            <div className="form-surface" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--teal-800), var(--teal-700))',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.15,
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px',
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sliders size={20} color="#fff" />
                  </div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginTop: 12, marginBottom: 2 }}>
                    Configuración
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                    Personaliza tu experiencia
                  </p>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div className="s-head" style={{ marginBottom: 8 }}>
                  <Info size={13} style={{ color: 'var(--teal-600)' }} />
                  <span className="s-head__label">Consejos</span>
                  <div className="s-head__rule" />
                </div>
                <ul style={{
                  listStyle: 'none', padding: 0, margin: 0,
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  {[
                    'Las preferencias de notificación se guardan localmente en tu navegador.',
                    'El cambio de idioma se aplica de inmediato en toda la interfaz.',
                    'La información de la empresa se sincroniza con el servidor.',
                  ].map((tip, i) => (
                    <li key={i} style={{
                      display: 'flex', gap: 10, fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.4,
                    }}>
                      <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--teal-600)' }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default SettingsPage
