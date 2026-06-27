import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Building2, Calendar, Eye, EyeOff, Info, Lock, LogOut, Save,
  ScrollText, Shield, ShieldCheck, User, UserCheck,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import PageLoader from '../../components/ui/PageLoader'
import { Button } from '../../components/ui/button'
import useAuthStore from '../../store/useAuthStore'
import { fetchMyProfile, updateMyProfile, changeMyPassword } from '../../services/profile'
import { fetchCompanyInfo, updateCompanyInfo } from '../../services/billing'
import type { UserItem } from '../../interfaces/users'
import type { CompanyInfo, CompanyInfoUpdatePayload } from '../../interfaces/billing'

type Tab = 'profile' | 'security' | 'company'

const ROLE_LABELS: Record<string, string> = {
  almacenista: 'Almacenista',
  auxiliar_despacho: 'Auxiliar de despacho',
  administrador: 'Administrador',
}

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  administrador: { bg: '#e8f2ff', color: '#1971c2' },
  almacenista: { bg: '#ebfbee', color: '#099268' },
  auxiliar_despacho: { bg: '#fff4e6', color: '#d9480f' },
}

function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(iso))
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

function AvatarHeader({ profile }: { profile: UserItem }) {
  const initials =
    [profile.first_name, profile.last_name]
      .filter(Boolean)
      .map((s) => s![0].toUpperCase())
      .join('') || profile.username[0]?.toUpperCase() || 'U'

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username

  const roleStyle = ROLE_STYLES[profile.role] ?? { bg: 'var(--ink-06)', color: 'var(--ink-50)' }

  return (
    <div className="form-surface" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          className="avatar avatar--teal"
          style={{ width: 56, height: 56, fontSize: 20, flexShrink: 0 }}
        >
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3, color: 'var(--ink)' }}>{displayName}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-40)' }}>
              @{profile.username}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-20)' }} />
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: '6px',
              fontSize: 11, fontWeight: 700, lineHeight: 1,
              backgroundColor: roleStyle.bg, color: roleStyle.color,
              letterSpacing: 0.3,
            }}>
              {(ROLE_LABELS[profile.role] ?? profile.role).toUpperCase()}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: '6px',
              fontSize: 11, fontWeight: 600, lineHeight: 1,
              backgroundColor: profile.is_active
                ? 'rgba(45,139,111,0.1)'
                : 'rgba(176,58,42,0.1)',
              color: profile.is_active ? 'var(--ok)' : 'var(--err)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
              {profile.is_active ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileTab({
  profile, canEdit, onSaved,
}: {
  profile: UserItem; canEdit: boolean; onSaved: (u: UserItem) => void
}) {
  const [firstName, setFirstName] = useState(profile.first_name ?? '')
  const [lastName, setLastName] = useState(profile.last_name ?? '')
  const [email, setEmail] = useState(profile.email ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateMyProfile(profile.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      })
      onSaved(updated)
      toast.success('Datos actualizados correctamente')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="form-surface">
      <fieldset>
        <legend>Datos personales</legend>

        {!canEdit && (
          <div className="alert-bar alert-bar--info" style={{ marginBottom: 16 }}>
            <Info size={14} />
            <span>La edición de datos personales está disponible para el rol Almacenista.</span>
          </div>
        )}

        <div className="f-row f-row-2">
          <div className="f-group">
            <label className="f-label">Nombre</label>
            <input className="f-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={!canEdit} placeholder="—" />
          </div>
          <div className="f-group">
            <label className="f-label">Apellido</label>
            <input className="f-input" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={!canEdit} placeholder="—" />
          </div>
        </div>

        <div className="f-row f-row-2" style={{ marginTop: 14 }}>
          <div className="f-group">
            <label className="f-label">Correo electrónico</label>
            <input className="f-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canEdit} placeholder="—" />
          </div>
          <div className="f-group">
            <label className="f-label">Teléfono</label>
            <input className="f-input" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canEdit} placeholder="—" />
          </div>
        </div>

        <div className="f-group" style={{ marginTop: 14 }}>
          <label className="f-label">Usuario</label>
          <input className="f-input" value={profile.username} disabled />
        </div>

        {error && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginTop: 16 }}>
            <span>{error}</span>
          </div>
        )}

        {canEdit && (
          <div className="form-footer">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={14} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
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
      toast.success('Contraseña actualizada. Inicia sesión de nuevo.')
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
        <legend>Cambiar contraseña</legend>

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
          <Button
            onClick={handleSave}
            disabled={saving || !current || !next || !confirm}
          >
            <Lock size={14} />
            {saving ? 'Cambiando...' : 'Cambiar contraseña'}
          </Button>
        </div>
      </fieldset>
    </div>
  )
}

function CompanyTab() {
  const [form, setForm] = useState<CompanyInfoUpdatePayload>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCompanyInfo()
      .then((data: CompanyInfo) => {
        setForm({
          company_name: data.company_name,
          nit: data.nit,
          address: data.address,
          phone: data.phone,
          email: data.email,
          dian_resolution: data.dian_resolution,
          dian_range_from: data.dian_range_from,
          dian_range_to: data.dian_range_to,
          invoice_series: data.invoice_series,
          invoice_footer: data.invoice_footer,
        })
      })
      .catch(() => setError('No se pudo cargar la información de la empresa'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof CompanyInfoUpdatePayload, value: string | number | null) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateCompanyInfo(form)
      toast.success('Datos de empresa actualizados')
    } catch {
      setError('No se pudo guardar la información de la empresa')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--ink-40)' }}>
        <span className="animate-spin" style={{ display: 'inline-block' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </span>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: 16 }}>
          <span>{error}</span>
        </div>
      )}

      <div className="form-surface">
        <fieldset>
          <legend>Información general</legend>
          <div className="f-row f-row-2">
            <div className="f-group">
              <label className="f-label">Razón social</label>
              <input className="f-input" value={form.company_name ?? ''} onChange={(e) => set('company_name', e.target.value)} />
            </div>
            <div className="f-group">
              <label className="f-label">NIT</label>
              <input className="f-input" value={form.nit ?? ''} onChange={(e) => set('nit', e.target.value)} />
            </div>
          </div>
          <div className="f-group" style={{ marginTop: 14 }}>
            <label className="f-label">Dirección</label>
            <input className="f-input" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="f-row f-row-2" style={{ marginTop: 14 }}>
            <div className="f-group">
              <label className="f-label">Teléfono</label>
              <input className="f-input" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="f-group">
              <label className="f-label">Correo</label>
              <input className="f-input" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="c-divider" />

      <div className="form-surface">
        <fieldset>
          <legend>Facturación</legend>
          <div className="f-group">
            <label className="f-label">Serie de facturación</label>
            <input className="f-input" value={form.invoice_series ?? ''} onChange={(e) => set('invoice_series', e.target.value)} />
          </div>
          <div className="f-group" style={{ marginTop: 14 }}>
            <label className="f-label">Resolución DIAN</label>
            <textarea className="f-input" value={form.dian_resolution ?? ''} onChange={(e) => set('dian_resolution', e.target.value)} />
          </div>
          <div className="f-row f-row-2" style={{ marginTop: 14 }}>
            <div className="f-group">
              <label className="f-label">Rango desde</label>
              <input className="f-input" type="number" value={form.dian_range_from ?? ''} onChange={(e) => set('dian_range_from', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="f-group">
              <label className="f-label">Rango hasta</label>
              <input className="f-input" type="number" value={form.dian_range_to ?? ''} onChange={(e) => set('dian_range_to', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <div className="f-group" style={{ marginTop: 14 }}>
            <label className="f-label">Pie de factura</label>
            <textarea className="f-input" rows={3} value={form.invoice_footer ?? ''} onChange={(e) => set('invoice_footer', e.target.value)} />
          </div>
        </fieldset>
      </div>

      <div className="form-footer">
        <Button onClick={handleSave} disabled={saving}>
          <Save size={14} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </>
  )
}

function SidebarCard({ profile }: { profile: UserItem }) {
  const roleStyle = ROLE_STYLES[profile.role] ?? { bg: 'var(--ink-06)', color: 'var(--ink-50)' }

  return (
    <div className="form-surface" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Mini header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--teal-800), var(--teal-700))',
        padding: '20px 20px 28px',
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
          <div
            className="avatar"
            style={{
              width: 48, height: 48, fontSize: 17,
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: 14,
            }}
          >
            {[profile.first_name, profile.last_name].filter(Boolean).map((s) => s![0].toUpperCase()).join('') || profile.username[0]?.toUpperCase() || 'U'}
          </div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginTop: 12, marginBottom: 2 }}>
            {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username}
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 4,
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            backgroundColor: roleStyle.bg, color: roleStyle.color,
          }}>
            {(ROLE_LABELS[profile.role] ?? profile.role).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div className="s-head" style={{ marginBottom: 0 }}>
          <Calendar size={13} style={{ color: 'var(--teal-600)' }} />
          <span className="s-head__label">Información de la cuenta</span>
          <div className="s-head__rule" />
        </div>

        <div className="mov-list">
          <div className="mov-item" style={{ gridTemplateColumns: '1fr', gap: 0, padding: '6px 0', border: 'none' }}>
            <p style={{ fontSize: 11, color: 'var(--ink-40)', fontWeight: 600, marginBottom: 2 }}>Miembro desde</p>
            <p style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{shortDate(profile.created_at)}</p>
          </div>
          <div className="mov-item" style={{ gridTemplateColumns: '1fr', gap: 0, padding: '6px 0', border: 'none' }}>
            <p style={{ fontSize: 11, color: 'var(--ink-40)', fontWeight: 600, marginBottom: 2 }}>Última actualización</p>
            <p style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{shortDate(profile.updated_at)}</p>
          </div>
        </div>

        <div className="c-divider" style={{ margin: '2px 0' }} />

        {/* Quick actions */}
        <div className="s-head" style={{ marginBottom: 0 }}>
          <Shield size={13} style={{ color: 'var(--teal-600)' }} />
          <span className="s-head__label">Accesos directos</span>
          <div className="s-head__rule" />
        </div>

        <div className="quick-actions">
          <button className="quick-action" type="button" onClick={() => window.location.href = '/audit'}>
            <ScrollText size={14} />
            Ver historial de actividad
          </button>
          <button className="quick-action" type="button" onClick={() => window.location.href = '/users'}>
            <UserCheck size={14} />
            Gestionar usuarios
          </button>
          <button className="quick-action" type="button" onClick={() => {
            useAuthStore.getState().logout()
            window.location.href = '/login'
          }}>
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>

        <div className="c-divider" style={{ margin: '2px 0' }} />

        {/* Brand panel */}
        <div style={{
          background: 'linear-gradient(135deg, var(--teal-50), var(--white))',
          border: '1px solid var(--ink-12)',
          borderRadius: 'var(--r-md)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--teal-700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Building2 size={16} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--teal-800)' }}>Import Corporal Medical</p>
            <p style={{ fontSize: 10.5, color: 'var(--ink-40)', marginTop: 1 }}>
              Sistema de Gestión de Inventario
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

function ProfilePage() {
  const storeUser = useAuthStore((state) => state.user)
  const canEdit = storeUser?.role === 'almacenista'
  const canSeeCompany = storeUser?.role === 'almacenista' || storeUser?.role === 'administrador'

  const [profile, setProfile] = useState<UserItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  useEffect(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Error al cargar el perfil')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell title="Mi perfil" subtitle="Cuenta">
      <div className="catalog-page fade-slide-up">
        {loading ? (
          <PageLoader />
        ) : loadError ? (
          <div className="alert-bar alert-bar--warn" role="alert">
            <span>{loadError}</span>
          </div>
        ) : profile ? (
          <div className="dashboard-grid" style={{ gap: 24 }}>
            {/* Left column */}
            <div>
              <AvatarHeader profile={profile} />

              {/* Tab bar */}
              <div style={{ borderBottom: '1px solid var(--ink-12)', marginBottom: 20, display: 'flex', gap: 0 }}>
                {(['profile', 'security', ...(canSeeCompany ? ['company'] : [])] as Tab[]).map((tab) => {
                  const icons: Record<Tab, React.ReactNode> = {
                    profile: <User size={14} />,
                    security: <ShieldCheck size={14} />,
                    company: <Building2 size={14} />,
                  }
                  const labels: Record<Tab, string> = {
                    profile: 'Mi perfil',
                    security: 'Seguridad',
                    company: 'Empresa',
                  }
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderBottom: `2px solid ${activeTab === tab ? 'var(--teal-600)' : 'transparent'}`,
                        background: 'none',
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'color 0.15s, border-color 0.15s',
                        fontFamily: 'inherit',
                        fontWeight: activeTab === tab ? 600 : 500,
                        color: activeTab === tab ? 'var(--teal-600)' : 'var(--ink-40)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {icons[tab]}
                      {labels[tab]}
                    </button>
                  )
                })}
              </div>

              {activeTab === 'profile' && (
                <ProfileTab profile={profile} canEdit={canEdit} onSaved={setProfile} />
              )}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'company' && canSeeCompany && <CompanyTab />}
            </div>

            {/* Right sidebar */}
            <SidebarCard profile={profile} />
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

export default ProfilePage
