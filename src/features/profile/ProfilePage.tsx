import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Building2, Eye, EyeOff, Lock, Save, User } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { Button } from '../../components/ui/button'
import useAuthStore from '../../store/useAuthStore'
import {
  fetchMyProfile,
  updateMyProfile,
  changeMyPassword,
} from '../../services/profile'
import type { UserItem } from '../../interfaces/users'

const ROLE_LABELS: Record<string, string> = {
  almacenista: 'Almacenista',
  auxiliar_despacho: 'Auxiliar de despacho',
  administrador: 'Administrador',
}

function ProfilePage() {
  const storeUser = useAuthStore((state) => state.user)
  const canEdit = storeUser?.role === 'almacenista'
  const canSeeCompany =
    storeUser?.role === 'almacenista' || storeUser?.role === 'administrador'

  const [profile, setProfile] = useState<UserItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // --- datos personales ---
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // --- cambiar contraseña ---
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchMyProfile()
      .then((data) => {
        setProfile(data)
        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
        setEmail(data.email ?? '')
        setPhone(data.phone ?? '')
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Error al cargar el perfil')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSaveProfile = async () => {
    if (!profile) return
    setSavingProfile(true)
    setProfileError(null)
    try {
      const updated = await updateMyProfile(profile.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      })
      setProfile(updated)
      toast.success('Datos actualizados correctamente')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar'
      setProfileError(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    setSavingPassword(true)
    setPasswordError(null)
    try {
      await changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      })
      toast.success('Contraseña actualizada. Inicia sesión de nuevo.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo cambiar la contraseña'
      setPasswordError(msg)
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="Mi perfil" subtitle="Cuenta">
        <div className="page-body" style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
          Cargando...
        </div>
      </AppShell>
    )
  }

  if (loadError) {
    return (
      <AppShell title="Mi perfil" subtitle="Cuenta">
        <div className="page-body">
          <div className="alert-bar alert-bar--warn" role="alert">
            <span>{loadError}</span>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Mi perfil" subtitle="Cuenta">
      <div className="page-body" style={{ maxWidth: 680 }}>

        {/* ── Avatar + info ── */}
        <div className="form-surface" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              className="avatar avatar--teal"
              style={{ width: 56, height: 56, fontSize: 20, flexShrink: 0 }}
            >
              {[profile?.first_name, profile?.last_name]
                .filter(Boolean)
                .map((s) => s![0].toUpperCase())
                .join('') ||
                profile?.username?.[0]?.toUpperCase() ||
                'U'}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.3 }}>
                {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
                  profile?.username}
              </p>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                @{profile?.username} · {ROLE_LABELS[profile?.role ?? ''] ?? profile?.role}
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{profile?.email}</p>
            </div>
          </div>
        </div>

        <div className="c-divider" />

        {/* ── Datos personales ── */}
        <div className="form-surface">
          <fieldset>
            <legend style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} />
              Datos personales
            </legend>

            {!canEdit && (
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                La edición de datos está disponible para usuarios con rol de Almacenista.
              </p>
            )}

            <div className="f-row f-row-2">
              <div className="f-group">
                <label className="f-label">Nombre</label>
                <input
                  className="f-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={!canEdit}
                  placeholder="—"
                />
              </div>
              <div className="f-group">
                <label className="f-label">Apellido</label>
                <input
                  className="f-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={!canEdit}
                  placeholder="—"
                />
              </div>
            </div>
            <div className="f-row f-row-2">
              <div className="f-group">
                <label className="f-label">Correo electrónico</label>
                <input
                  className="f-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!canEdit}
                  placeholder="—"
                />
              </div>
              <div className="f-group">
                <label className="f-label">Teléfono</label>
                <input
                  className="f-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!canEdit}
                  placeholder="—"
                />
              </div>
            </div>
            <div className="f-group">
              <label className="f-label">Usuario</label>
              <input className="f-input" value={profile?.username ?? ''} disabled />
            </div>

            {profileError && (
              <div className="alert-bar alert-bar--warn" role="alert" style={{ marginTop: 8 }}>
                <span>{profileError}</span>
              </div>
            )}

            {canEdit && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  <Save size={14} />
                  {savingProfile ? 'Guardando...' : 'Guardar datos'}
                </Button>
              </div>
            )}
          </fieldset>
        </div>

        <div className="c-divider" />

        {/* ── Cambiar contraseña ── */}
        <div className="form-surface">
          <fieldset>
            <legend style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} />
              Cambiar contraseña
            </legend>

            <div className="f-group">
              <label className="f-label">Contraseña actual</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="f-input"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0,
                  }}
                  aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="f-row f-row-2">
              <div className="f-group">
                <label className="f-label">Nueva contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="f-input"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    style={{ paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0,
                    }}
                    aria-label={showNew ? 'Ocultar' : 'Mostrar'}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="f-group">
                <label className="f-label">Confirmar contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="f-input"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    style={{ paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0,
                    }}
                    aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="alert-bar alert-bar--warn" role="alert" style={{ marginTop: 8 }}>
                <span>{passwordError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <Button
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                <Lock size={14} />
                {savingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
              </Button>
            </div>
          </fieldset>
        </div>

        {/* ── Empresa ── */}
        {canSeeCompany && (
          <>
            <div className="c-divider" />
            <div className="form-surface">
              <fieldset>
                <legend style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} />
                  Empresa
                </legend>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                  Configura la información de la empresa que aparece en facturas y documentos.
                </p>
                <Link to="/app/admin/company">
                  <Button variant="outline">
                    <Building2 size={14} />
                    Ir a datos de empresa
                  </Button>
                </Link>
              </fieldset>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default ProfilePage
