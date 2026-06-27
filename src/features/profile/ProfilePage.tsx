import { useEffect, useState, type CSSProperties } from 'react'
import { toast } from 'sonner'
import { Building2, Eye, EyeOff, Lock, Save, User } from 'lucide-react'
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

function TabBar({
  active,
  onChange,
  showCompany,
}: {
  active: Tab
  onChange: (t: Tab) => void
  showCompany: boolean
}) {
  const base: CSSProperties = {
    padding: '10px 20px',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'none',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    fontFamily: 'inherit',
    fontWeight: 500,
    color: 'var(--ink-40)',
  }
  const activeStyle: CSSProperties = {
    borderBottomColor: 'var(--teal-600)',
    color: 'var(--teal-600)',
    fontWeight: 600,
  }

  return (
    <div style={{ borderBottom: '1px solid var(--ink-12)', marginBottom: 24, display: 'flex' }}>
      <button style={{ ...base, ...(active === 'profile' ? activeStyle : {}) }} onClick={() => onChange('profile')} type="button">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={14} /> Mi perfil
        </span>
      </button>
      <button style={{ ...base, ...(active === 'security' ? activeStyle : {}) }} onClick={() => onChange('security')} type="button">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={14} /> Seguridad
        </span>
      </button>
      {showCompany && (
        <button style={{ ...base, ...(active === 'company' ? activeStyle : {}) }} onClick={() => onChange('company')} type="button">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={14} /> Empresa
          </span>
        </button>
      )}
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
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

  return (
    <div className="form-surface" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          className="avatar avatar--teal"
          style={{ width: 52, height: 52, fontSize: 18, flexShrink: 0 }}
        >
          {initials}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{displayName}</p>
          <p style={{ fontSize: 13, color: 'var(--ink-40)', marginTop: 2 }}>
            @{profile.username} · {ROLE_LABELS[profile.role] ?? profile.role}
          </p>
        </div>
      </div>
    </div>
  )
}

function ProfileTab({
  profile,
  canEdit,
  onSaved,
}: {
  profile: UserItem
  canEdit: boolean
  onSaved: (u: UserItem) => void
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
          <p style={{ fontSize: 13, color: 'var(--ink-40)', marginBottom: 16 }}>
            La edición de datos personales está disponible para el rol Almacenista.
          </p>
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

        <div className="f-row f-row-2">
          <div className="f-group">
            <label className="f-label">Correo electrónico</label>
            <input className="f-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canEdit} placeholder="—" />
          </div>
          <div className="f-group">
            <label className="f-label">Teléfono</label>
            <input className="f-input" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canEdit} placeholder="—" />
          </div>
        </div>

        <div className="f-group">
          <label className="f-label">Usuario</label>
          <input className="f-input" value={profile.username} disabled />
        </div>

        {error && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginTop: 12 }}>
            <span>{error}</span>
          </div>
        )}

        {canEdit && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
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

  return (
    <div className="form-surface">
      <fieldset>
        <legend>Cambiar contraseña</legend>

        <PasswordField label="Contraseña actual" value={current} onChange={setCurrent} placeholder="Ingresa tu contraseña actual" />

        <div className="f-row f-row-2" style={{ marginTop: 14 }}>
          <PasswordField label="Nueva contraseña" value={next} onChange={setNext} placeholder="Mínimo 8 caracteres" />
          <PasswordField label="Confirmar contraseña" value={confirm} onChange={setConfirm} placeholder="Repite la nueva contraseña" />
        </div>

        {error && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginTop: 12 }}>
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
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
          <div className="f-group">
            <label className="f-label">Dirección</label>
            <input className="f-input" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="f-row f-row-2">
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
          <div className="f-group">
            <label className="f-label">Resolución DIAN</label>
            <textarea className="f-input" value={form.dian_resolution ?? ''} onChange={(e) => set('dian_resolution', e.target.value)} />
          </div>
          <div className="f-row f-row-2">
            <div className="f-group">
              <label className="f-label">Rango desde</label>
              <input className="f-input" type="number" value={form.dian_range_from ?? ''} onChange={(e) => set('dian_range_from', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="f-group">
              <label className="f-label">Rango hasta</label>
              <input className="f-input" type="number" value={form.dian_range_to ?? ''} onChange={(e) => set('dian_range_to', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <div className="f-group">
            <label className="f-label">Pie de factura</label>
            <textarea className="f-input" rows={3} value={form.invoice_footer ?? ''} onChange={(e) => set('invoice_footer', e.target.value)} />
          </div>
        </fieldset>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={14} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </>
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
      <div className="page-body" style={{ maxWidth: 700 }}>
        {loading ? (
          <PageLoader />
        ) : loadError ? (
          <div className="alert-bar alert-bar--warn" role="alert">
            <span>{loadError}</span>
          </div>
        ) : profile ? (
          <>
            <AvatarHeader profile={profile} />

            <TabBar active={activeTab} onChange={setActiveTab} showCompany={canSeeCompany} />

            {activeTab === 'profile' && (
              <ProfileTab profile={profile} canEdit={canEdit} onSaved={setProfile} />
            )}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'company' && canSeeCompany && <CompanyTab />}
          </>
        ) : null}
      </div>
    </AppShell>
  )
}

export default ProfilePage
