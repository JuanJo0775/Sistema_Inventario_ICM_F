import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Clock, Plus, X, AlertTriangle } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import useAuthStore from '../../store/useAuthStore'
import { fetchUsersList } from '../../services/users'
import {
  fetchUserSchedule,
  saveUserSchedule,
  fetchTemporaryPermits,
  grantTemporaryPermit,
  revokeTemporaryPermit,
} from '../../services/horarios'
import type { UserItem } from '../../interfaces/users'
import type {
  UserScheduleItem,
  SchedulePayload,
  TemporaryPermitItem,
  PermitPayload,
} from '../../interfaces/horarios'

function formatTime(t: string | null | undefined): string {
  if (!t) return ''
  return t.slice(0, 5)
}

function getRolePillClass(role: string): string {
  if (role === 'almacenista') return 'pill pill--teal'
  if (role === 'auxiliar_despacho') return 'pill pill--amber'
  return 'pill pill--muted'
}

function translateRole(role: string): string {
  if (role === 'almacenista') return 'Almacenista'
  if (role === 'auxiliar_despacho') return 'Aux. Despacho'
  return 'Administrador'
}

function UserAvatar({ user }: { user: UserItem }) {
  const initials = (
    ((user.first_name ?? '')[0] ?? '') +
    ((user.last_name ?? '')[0] ?? '')
  ).toUpperCase() || user.username[0].toUpperCase()
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'var(--teal-100)',
        color: 'var(--teal-700)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: '0.8rem',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

function getScheduleText(
  user: UserItem,
  schedule: UserScheduleItem | null | undefined,
  t: TFunction,
): string {
  if (user.role !== 'auxiliar_despacho') {
    return t('horarios.schedule.unrestricted')
  }
  if (!schedule || !schedule.is_active) {
    return t('horarios.schedule.default')
  }
  const morning =
    schedule.morning_start && schedule.morning_end
      ? `${formatTime(schedule.morning_start)}-${formatTime(schedule.morning_end)}`
      : null
  const afternoon =
    schedule.afternoon_start && schedule.afternoon_end
      ? `${formatTime(schedule.afternoon_start)}-${formatTime(schedule.afternoon_end)}`
      : null
  if (morning && afternoon) {
    return t('horarios.schedule.custom', { morning, afternoon })
  }
  if (morning) {
    return t('horarios.schedule.customMorningOnly', { morning })
  }
  if (afternoon) {
    return t('horarios.schedule.customAfternoonOnly', { afternoon })
  }
  return t('horarios.schedule.default')
}

function formatDatetime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function HorariosPage() {
  const { t } = useTranslation()
  const currentUser = useAuthStore((state) => state.user)
  const canEdit = currentUser?.role === 'almacenista'

  const [users, setUsers] = useState<UserItem[]>([])
  const [schedules, setSchedules] = useState<Map<string, UserScheduleItem>>(new Map())
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [activeTab, setActiveTab] = useState<'schedule' | 'permits'>('schedule')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [schedMStart, setSchedMStart] = useState('')
  const [schedMEnd, setSchedMEnd] = useState('')
  const [schedAStart, setSchedAStart] = useState('')
  const [schedAEnd, setSchedAEnd] = useState('')
  const [schedActive, setSchedActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)

  const [permits, setPermits] = useState<TemporaryPermitItem[]>([])
  const [showNewPermit, setShowNewPermit] = useState(false)
  const [pStart, setPStart] = useState('')
  const [pEnd, setPEnd] = useState('')
  const [p247, setP247] = useState(false)
  const [pMStart, setPMStart] = useState('')
  const [pMEnd, setPMEnd] = useState('')
  const [pAStart, setPAStart] = useState('')
  const [pAEnd, setPAEnd] = useState('')
  const [pReason, setPReason] = useState('')
  const [granting, setGranting] = useState(false)
  const [permitFormError, setPermitFormError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchUsersList({ include_inactive: false })
        if (cancelled) return
        setUsers(data)
        const auxiliares = data.filter(
          (u) => u.role === 'auxiliar_despacho' && u.is_active,
        )
        const results = await Promise.allSettled(
          auxiliares.map((u) =>
            fetchUserSchedule(u.id).then((s) => ({ userId: u.id, schedule: s })),
          ),
        )
        if (cancelled) return
        const schedMap = new Map<string, UserScheduleItem>()
        for (const r of results) {
          if (r.status === 'fulfilled') {
            schedMap.set(r.value.userId, r.value.schedule)
          }
        }
        setSchedules(schedMap)
      } catch {
        if (!cancelled) setErrorMsg(t('horarios.errors.load'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false
      if (activeSearch) {
        const q = activeSearch.toLowerCase()
        const name =
          `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase()
        if (
          !name.includes(q) &&
          !u.username.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [users, roleFilter, activeSearch])

  const stats = useMemo(() => {
    const withCustom = Array.from(schedules.values()).filter(
      (s) => s.is_active,
    ).length
    const unrestricted = users.filter(
      (u) => u.role !== 'auxiliar_despacho',
    ).length
    return { total: users.length, withCustom, unrestricted }
  }, [users, schedules])

  const openModal = useCallback(
    async (user: UserItem) => {
      setSelectedUser(user)
      setActiveTab('schedule')
      setSuccessMsg(null)
      setErrorMsg(null)
      setShowNewPermit(false)
      setResetConfirm(false)

      const sched = schedules.get(user.id)
      setSchedMStart(sched?.morning_start ?? '')
      setSchedMEnd(sched?.morning_end ?? '')
      setSchedAStart(sched?.afternoon_start ?? '')
      setSchedAEnd(sched?.afternoon_end ?? '')
      setSchedActive(sched?.is_active ?? true)

      try {
        const p = await fetchTemporaryPermits(user.id)
        setPermits(p)
      } catch {
        setPermits([])
      }
    },
    [schedules],
  )

  const closeModal = () => {
    setSelectedUser(null)
    setPStart('')
    setPEnd('')
    setP247(false)
    setPMStart('')
    setPMEnd('')
    setPAStart('')
    setPAEnd('')
    setPReason('')
  }

  const handleSaveSchedule = async () => {
    if (!selectedUser) return
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const payload: SchedulePayload = {
        morning_start: schedMStart || undefined,
        morning_end: schedMEnd || undefined,
        afternoon_start: schedAStart || undefined,
        afternoon_end: schedAEnd || undefined,
        is_active: schedActive,
      }
      const updated = await saveUserSchedule(selectedUser.id, payload)
      setSchedules((prev) => {
        const next = new Map(prev)
        next.set(selectedUser.id, updated)
        return next
      })
      setSuccessMsg(t('horarios.success.scheduleSaved'))
    } catch {
      setErrorMsg(t('horarios.errors.saveSchedule'))
    } finally {
      setSaving(false)
    }
  }

  const handleResetSchedule = async () => {
    if (!selectedUser) return
    setSaving(true)
    setErrorMsg(null)
    try {
      const payload: SchedulePayload = {
        morning_start: undefined,
        morning_end: undefined,
        afternoon_start: undefined,
        afternoon_end: undefined,
        is_active: false,
      }
      const updated = await saveUserSchedule(selectedUser.id, payload)
      setSchedules((prev) => {
        const next = new Map(prev)
        next.set(selectedUser.id, updated)
        return next
      })
      setSchedMStart('')
      setSchedMEnd('')
      setSchedAStart('')
      setSchedAEnd('')
      setSchedActive(false)
      setSuccessMsg(t('horarios.success.scheduleReset'))
    } catch {
      setErrorMsg(t('horarios.errors.saveSchedule'))
    } finally {
      setSaving(false)
      setResetConfirm(false)
    }
  }

  const handleGrantPermit = async () => {
    if (!selectedUser) return
    setPermitFormError(null)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!pStart || !pEnd) {
      setPermitFormError('Debes seleccionar la fecha de inicio y fin del permiso.')
      return
    }
    if (pStart > pEnd) {
      setPermitFormError('La fecha de fin debe ser posterior o igual a la de inicio.')
      return
    }
    if (!pReason.trim()) {
      setPermitFormError('El motivo es obligatorio.')
      return
    }
    if (!p247 && !(pMStart && pMEnd) && !(pAStart && pAEnd)) {
      setPermitFormError('Debes configurar al menos una franja horaria (mañana o tarde) o marcar "Acceso 24/7".')
      return
    }

    setGranting(true)
    try {
      const payload: PermitPayload = {
        start_datetime: `${pStart}T00:00:00`,
        end_datetime: `${pEnd}T23:59:00`,
        allow_24_7: p247,
        reason: pReason.trim(),
      }
      if (!p247) {
        payload.custom_morning_start = pMStart || undefined
        payload.custom_morning_end = pMEnd || undefined
        payload.custom_afternoon_start = pAStart || undefined
        payload.custom_afternoon_end = pAEnd || undefined
      }
      const created = await grantTemporaryPermit(selectedUser.id, payload)
      setPermits((prev) => [created, ...prev])
      setSuccessMsg(t('horarios.success.permitGranted'))
      setShowNewPermit(false)
      setPStart('')
      setPEnd('')
      setP247(false)
      setPMStart('')
      setPMEnd('')
      setPAStart('')
      setPAEnd('')
      setPReason('')
    } catch {
      setErrorMsg(t('horarios.errors.grantPermit'))
    } finally {
      setGranting(false)
    }
  }

  const handleRevokePermit = async (permitId: string) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const revoked = await revokeTemporaryPermit(permitId)
      setPermits((prev) => prev.map((p) => (p.id === permitId ? revoked : p)))
      setSuccessMsg(t('horarios.success.permitRevoked'))
    } catch {
      setErrorMsg(t('horarios.errors.revokePermit'))
    }
  }

  const isEditingAuxiliar =
    selectedUser?.role === 'auxiliar_despacho' && canEdit

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(search)
  }

  return (
    <AppShell
      title={t('horarios.title')}
      subtitle={t('horarios.subtitle')}
    >
      <div className="catalog-page fade-slide-up">
        {/* Metric strip */}
        <div
          className="metric-strip mb-4"
          style={{ maxWidth: 560 }}
        >
          <div className="metric-cell metric-cell--hero">
            <p className="metric-cell__eyebrow">
              {t('horarios.stats.total')}
            </p>
            <p className="metric-cell__val">{stats.total}</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">
              {t('horarios.stats.withCustom')}
            </p>
            <p className="metric-cell__val">{stats.withCustom}</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">
              {t('horarios.stats.unrestricted')}
            </p>
            <p className="metric-cell__val">{stats.unrestricted}</p>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div
            className="alert-bar alert-bar--ok"
            role="status"
            style={{ marginBottom: '1.5rem' }}
          >
            <span>{successMsg}</span>
            <button
              className="alert-bar__close"
              onClick={() => setSuccessMsg(null)}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
        {errorMsg && (
          <div
            className="alert-bar alert-bar--warn"
            role="alert"
            style={{ marginBottom: '1.5rem' }}
          >
            <AlertTriangle
              style={{ marginRight: '0.5rem', width: 18, height: 18 }}
            />
            <span>{errorMsg}</span>
            <button
              className="alert-bar__close"
              onClick={() => setErrorMsg(null)}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              flex: 1,
              gap: 8,
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  stroke: 'var(--teal-600)',
                  strokeWidth: 1.8,
                  fill: 'none',
                }}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="f-input"
                style={{ paddingLeft: 34 }}
                placeholder={t('horarios.filters.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--primary btn--sm">
              Buscar
            </button>
          </form>
          {activeSearch && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setSearch('')
                setActiveSearch('')
              }}
            >
              Limpiar filtro
            </button>
          )}
          <select
            className="f-input"
            style={{ width: 180 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">{t('horarios.filters.allRoles')}</option>
            <option value="almacenista">Almacenista</option>
            <option value="auxiliar_despacho">Aux. Despacho</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="empty-state">
            <p>Cargando usuarios…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Clock
              style={{
                width: 48,
                height: 48,
                strokeWidth: 1,
                color: 'var(--ink-40)',
                marginBottom: '1rem',
              }}
            />
            <p>No se encontraron usuarios que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="table-surface">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>
                      {t('horarios.table.user')}
                    </th>
                    <th style={{ width: '14%' }}>
                      {t('horarios.table.role')}
                    </th>
                    <th style={{ width: '28%' }}>
                      {t('horarios.table.schedule')}
                    </th>
                    <th style={{ width: '12%', textAlign: 'center' }}>
                      {t('horarios.table.status')}
                    </th>
                    <th style={{ width: '18%', textAlign: 'center' }}>
                      {t('horarios.table.action')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const sched = schedules.get(u.id)
                    return (
                      <tr key={u.id}>
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <UserAvatar user={u} />
                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: 'var(--ink)',
                                  fontSize: '0.9rem',
                                }}
                              >
                                {u.first_name ?? ''} {u.last_name ?? ''}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--ink-40)',
                                }}
                              >
                                @{u.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={getRolePillClass(u.role)}>
                            {translateRole(u.role)}
                          </span>
                        </td>
                        <td
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--ink-60)',
                          }}
                        >
                          {getScheduleText(u, sched, t)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={
                              u.is_active
                                ? 'pill pill--active'
                                : 'pill pill--inactive'
                            }
                          >
                            {u.is_active
                              ? t('horarios.status.active')
                              : t('horarios.status.inactive')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {u.role === 'auxiliar_despacho' && u.is_active ? (
                            <button
                              className="btn btn--outline btn--sm"
                              onClick={() => openModal(u)}
                            >
                              {t('horarios.actions.extend')}
                            </button>
                          ) : (
                            <span
                              style={{
                                color: 'var(--ink-30)',
                                fontSize: '0.8rem',
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,30,32,.45)',
            padding: 24,
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: 'var(--white)',
              borderRadius: 18,
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 24px 64px rgba(15,30,32,.2)',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--ink-06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                background: 'var(--white)',
                zIndex: 1,
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--ff-display)',
                    fontSize: 20,
                    fontWeight: 400,
                    margin: 0,
                  }}
                >
                  {t('horarios.modal.title')}
                </h2>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--ink-40)',
                    margin: '2px 0 0',
                  }}
                >
                  {selectedUser.first_name ?? ''} {selectedUser.last_name ?? ''}{' '}
                  — @{selectedUser.username}
                </p>
              </div>
              <button
                className="btn btn--ghost btn--sm"
                onClick={closeModal}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Modal alerts */}
            {successMsg && (
              <div
                className="alert-bar alert-bar--ok"
                role="status"
                style={{ margin: '16px 24px 0' }}
              >
                <span>{successMsg}</span>
                <button
                  className="alert-bar__close"
                  onClick={() => setSuccessMsg(null)}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}
            {errorMsg && (
              <div
                className="alert-bar alert-bar--warn"
                role="alert"
                style={{ margin: '16px 24px 0' }}
              >
                <AlertTriangle
                  style={{ marginRight: '0.5rem', width: 16, height: 16 }}
                />
                <span>{errorMsg}</span>
                <button
                  className="alert-bar__close"
                  onClick={() => setErrorMsg(null)}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--ink-06)',
                margin: '16px 24px 0',
              }}
            >
              <button
                onClick={() => setActiveTab('schedule')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'schedule' ? 600 : 400,
                  color:
                    activeTab === 'schedule'
                      ? 'var(--teal-700)'
                      : 'var(--ink-40)',
                  borderBottom:
                    activeTab === 'schedule'
                      ? '2px solid var(--teal-600)'
                      : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {t('horarios.modal.tabs.schedule')}
              </button>
              <button
                onClick={() => setActiveTab('permits')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'permits' ? 600 : 400,
                  color:
                    activeTab === 'permits'
                      ? 'var(--teal-700)'
                      : 'var(--ink-40)',
                  borderBottom:
                    activeTab === 'permits'
                      ? '2px solid var(--teal-600)'
                      : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {t('horarios.modal.tabs.permits')}
              </button>
            </div>

            {/* Tab content */}
            <div style={{ padding: 24 }}>
              {activeTab === 'schedule' && (
                <div>
                  {!isEditingAuxiliar && selectedUser.role !== 'auxiliar_despacho' ? (
                    <div
                      style={{
                        padding: 16,
                        background: 'var(--ink-03)',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                        color: 'var(--ink-60)',
                        textAlign: 'center',
                      }}
                    >
                      {t('horarios.schedule.unrestricted')}
                    </div>
                  ) : (
                    <div>
                      {!isEditingAuxiliar && (
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--ink-40)',
                            marginBottom: 16,
                          }}
                        >
                          {t('horarios.errors.noAuxiliar')}
                        </p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 16,
                        }}
                      >
                        <fieldset>
                          <legend
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: 'var(--ink-60)',
                              marginBottom: 8,
                            }}
                          >
                            Franja mañana
                          </legend>
                          <div
                            style={{
                              display: 'flex',
                              gap: 12,
                              alignItems: 'center',
                            }}
                          >
                            <div className="f-group" style={{ flex: 1 }}>
                              <label
                                className="f-label"
                                htmlFor="sched-m-start"
                              >
                                {t('horarios.modal.schedule.morningStart')}
                              </label>
                              <input
                                id="sched-m-start"
                                type="time"
                                className="f-input"
                                value={schedMStart}
                                onChange={(e) =>
                                  setSchedMStart(e.target.value)
                                }
                                disabled={!isEditingAuxiliar}
                              />
                            </div>
                            <span
                              style={{
                                marginTop: 20,
                                color: 'var(--ink-40)',
                              }}
                            >
                              a
                            </span>
                            <div className="f-group" style={{ flex: 1 }}>
                              <label
                                className="f-label"
                                htmlFor="sched-m-end"
                              >
                                {t('horarios.modal.schedule.morningEnd')}
                              </label>
                              <input
                                id="sched-m-end"
                                type="time"
                                className="f-input"
                                value={schedMEnd}
                                onChange={(e) =>
                                  setSchedMEnd(e.target.value)
                                }
                                disabled={!isEditingAuxiliar}
                              />
                            </div>
                          </div>
                        </fieldset>

                        <fieldset>
                          <legend
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: 'var(--ink-60)',
                              marginBottom: 8,
                            }}
                          >
                            Franja tarde
                          </legend>
                          <div
                            style={{
                              display: 'flex',
                              gap: 12,
                              alignItems: 'center',
                            }}
                          >
                            <div className="f-group" style={{ flex: 1 }}>
                              <label
                                className="f-label"
                                htmlFor="sched-a-start"
                              >
                                {t('horarios.modal.schedule.afternoonStart')}
                              </label>
                              <input
                                id="sched-a-start"
                                type="time"
                                className="f-input"
                                value={schedAStart}
                                onChange={(e) =>
                                  setSchedAStart(e.target.value)
                                }
                                disabled={!isEditingAuxiliar}
                              />
                            </div>
                            <span
                              style={{
                                marginTop: 20,
                                color: 'var(--ink-40)',
                              }}
                            >
                              a
                            </span>
                            <div className="f-group" style={{ flex: 1 }}>
                              <label
                                className="f-label"
                                htmlFor="sched-a-end"
                              >
                                {t('horarios.modal.schedule.afternoonEnd')}
                              </label>
                              <input
                                id="sched-a-end"
                                type="time"
                                className="f-input"
                                value={schedAEnd}
                                onChange={(e) =>
                                  setSchedAEnd(e.target.value)
                                }
                                disabled={!isEditingAuxiliar}
                              />
                            </div>
                          </div>
                        </fieldset>

                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '0.85rem',
                            color: 'var(--ink)',
                            cursor: isEditingAuxiliar
                              ? 'pointer'
                              : 'default',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={schedActive}
                            onChange={(e) =>
                              setSchedActive(e.target.checked)
                            }
                            disabled={!isEditingAuxiliar}
                          />
                          {t('horarios.modal.schedule.activeLabel')}
                        </label>

                        {isEditingAuxiliar && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                              justifyContent: 'flex-end',
                              marginTop: 8,
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => setResetConfirm(true)}
                            >
                              {t('horarios.modal.schedule.resetBtn')}
                            </button>
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              onClick={handleSaveSchedule}
                              disabled={saving}
                            >
                              {saving
                                ? t('horarios.modal.schedule.saving')
                                : t('horarios.modal.schedule.saveBtn')}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reset confirmation */}
                      {resetConfirm && (
                        <div
                          style={{
                            marginTop: 16,
                            padding: 12,
                            background: 'rgba(179,58,42,0.06)',
                            borderRadius: 8,
                            border: '1px solid rgba(179,58,42,0.15)',
                          }}
                        >
                          <p
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--err)',
                              margin: '0 0 8px',
                            }}
                          >
                            {t('horarios.modal.schedule.resetConfirm')}
                          </p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn--ghost btn--sm"
                              onClick={() => setResetConfirm(false)}
                            >
                              Cancelar
                            </button>
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={handleResetSchedule}
                            >
                              {t('horarios.modal.schedule.resetBtn')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'permits' && (
                <div>
                  {/* Active permits list */}
                  <div
                    style={{
                      marginBottom: 16,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {t('horarios.modal.permits.title')}
                  </div>

                  {permits.filter((p) => p.is_active).length === 0 ? (
                    <div
                      style={{
                        padding: 16,
                        background: 'var(--ink-03)',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                        color: 'var(--ink-40)',
                        textAlign: 'center',
                        marginBottom: 16,
                      }}
                    >
                      {t('horarios.modal.permits.noPermits')}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginBottom: 16,
                      }}
                    >
                      {permits
                        .filter((p) => p.is_active)
                        .map((p) => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              background: 'var(--ink-03)',
                              borderRadius: 8,
                              border: '1px solid var(--ink-06)',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  color: 'var(--ink)',
                                }}
                              >
                                {t('horarios.modal.permits.range', {
                                  start: formatDatetime(p.start_datetime),
                                  end: formatDatetime(p.end_datetime),
                                })}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--ink-40)',
                                  marginTop: 2,
                                }}
                              >
                                {p.allow_24_7 ? '24/7' : 'Ventana personalizada'}{' '}
                                — {p.reason}
                              </div>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <span
                                className="pill pill--active"
                                style={{ fontSize: '0.7rem' }}
                              >
                                {t('horarios.modal.permits.active')}
                              </span>
                              {isEditingAuxiliar && (
                                <button
                                  className="btn btn--ghost btn--sm"
                                  style={{ color: 'var(--err)' }}
                                  onClick={() =>
                                    handleRevokePermit(p.id)
                                  }
                                  title={t('horarios.modal.permits.revokeBtn')}
                                >
                                  <X
                                    style={{
                                      width: 14,
                                      height: 14,
                                    }}
                                  />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Expired permits */}
                  {permits.filter((p) => !p.is_active).length > 0 && (
                    <details
                      style={{
                        marginBottom: 16,
                        fontSize: '0.8rem',
                      }}
                    >
                      <summary
                        style={{
                          cursor: 'pointer',
                          color: 'var(--ink-40)',
                          marginBottom: 8,
                        }}
                      >
                        Permisos revocados/vencidos (
                        {permits.filter((p) => !p.is_active).length})
                      </summary>
                      {permits
                        .filter((p) => !p.is_active)
                        .map((p) => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              background: 'var(--ink-03)',
                              borderRadius: 6,
                              border: '1px solid var(--ink-06)',
                              marginBottom: 4,
                              opacity: 0.6,
                            }}
                          >
                            <div>
                              <span style={{ fontSize: '0.8rem' }}>
                                {formatDatetime(p.start_datetime)} →{' '}
                                {formatDatetime(p.end_datetime)}
                              </span>
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: '0.7rem',
                                  color: 'var(--ink-40)',
                                }}
                              >
                                {p.reason}
                              </span>
                            </div>
                            <span
                              className="pill pill--inactive"
                              style={{ fontSize: '0.7rem' }}
                            >
                              {t('horarios.modal.permits.expired')}
                            </span>
                          </div>
                        ))}
                    </details>
                  )}

                  {/* New permit button / form */}
                  {isEditingAuxiliar && (
                    <>
                      {!showNewPermit ? (
                        <button
                          className="btn btn--outline btn--sm"
                          style={{ width: '100%' }}
                          onClick={() => setShowNewPermit(true)}
                        >
                          <Plus
                            style={{
                              width: 14,
                              height: 14,
                              marginRight: 6,
                            }}
                          />
                          {t('horarios.modal.permits.newBtn')}
                        </button>
                      ) : (
                        <div
                          style={{
                            border: '1px solid var(--ink-06)',
                            borderRadius: 8,
                            padding: 16,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                gap: 12,
                              }}
                            >
                              <div className="f-group" style={{ flex: 1 }}>
                                <label
                                  className="f-label"
                                  htmlFor="permit-start"
                                >
                                  {t('horarios.modal.permits.startLabel')}
                                </label>
                                  <input
                                    id="permit-start"
                                    type="date"
                                    className="f-input"
                                    value={pStart}
                                    onChange={(e) =>
                                      setPStart(e.target.value)
                                    }
                                  />
                              </div>
                              <div className="f-group" style={{ flex: 1 }}>
                                <label
                                  className="f-label"
                                  htmlFor="permit-end"
                                >
                                  {t('horarios.modal.permits.endLabel')}
                                </label>
                                  <input
                                    id="permit-end"
                                    type="date"
                                    className="f-input"
                                    value={pEnd}
                                    onChange={(e) =>
                                      setPEnd(e.target.value)
                                    }
                                  />
                              </div>
                            </div>

                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: '0.85rem',
                                color: 'var(--ink)',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={p247}
                                onChange={(e) => setP247(e.target.checked)}
                              />
                              {t('horarios.modal.permits.allow247')}
                            </label>

                            {!p247 && (
                              <>
                                <fieldset>
                                  <legend
                                    style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: 'var(--ink-60)',
                                      marginBottom: 8,
                                    }}
                                  >
                                    Franja mañana
                                  </legend>
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: 12,
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div
                                      className="f-group"
                                      style={{ flex: 1 }}
                                    >
                                      <label
                                        className="f-label"
                                        htmlFor="permit-m-start"
                                      >
                                        {t(
                                          'horarios.modal.permits.morningStart',
                                        )}
                                      </label>
                                      <input
                                        id="permit-m-start"
                                        type="time"
                                        className="f-input"
                                        value={pMStart}
                                        onChange={(e) =>
                                          setPMStart(e.target.value)
                                        }
                                      />
                                    </div>
                                    <span
                                      style={{
                                        marginTop: 20,
                                        color: 'var(--ink-40)',
                                      }}
                                    >
                                      a
                                    </span>
                                    <div
                                      className="f-group"
                                      style={{ flex: 1 }}
                                    >
                                      <label
                                        className="f-label"
                                        htmlFor="permit-m-end"
                                      >
                                        {t(
                                          'horarios.modal.permits.morningEnd',
                                        )}
                                      </label>
                                      <input
                                        id="permit-m-end"
                                        type="time"
                                        className="f-input"
                                        value={pMEnd}
                                        onChange={(e) =>
                                          setPMEnd(e.target.value)
                                        }
                                      />
                                    </div>
                                  </div>
                                </fieldset>

                                <fieldset>
                                  <legend
                                    style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: 'var(--ink-60)',
                                      marginBottom: 8,
                                    }}
                                  >
                                    Franja tarde
                                  </legend>
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: 12,
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div
                                      className="f-group"
                                      style={{ flex: 1 }}
                                    >
                                      <label
                                        className="f-label"
                                        htmlFor="permit-a-start"
                                      >
                                        {t(
                                          'horarios.modal.permits.afternoonStart',
                                        )}
                                      </label>
                                      <input
                                        id="permit-a-start"
                                        type="time"
                                        className="f-input"
                                        value={pAStart}
                                        onChange={(e) =>
                                          setPAStart(e.target.value)
                                        }
                                      />
                                    </div>
                                    <span
                                      style={{
                                        marginTop: 20,
                                        color: 'var(--ink-40)',
                                      }}
                                    >
                                      a
                                    </span>
                                    <div
                                      className="f-group"
                                      style={{ flex: 1 }}
                                    >
                                      <label
                                        className="f-label"
                                        htmlFor="permit-a-end"
                                      >
                                        {t(
                                          'horarios.modal.permits.afternoonEnd',
                                        )}
                                      </label>
                                      <input
                                        id="permit-a-end"
                                        type="time"
                                        className="f-input"
                                        value={pAEnd}
                                        onChange={(e) =>
                                          setPAEnd(e.target.value)
                                        }
                                      />
                                    </div>
                                  </div>
                                </fieldset>
                              </>
                            )}

                            <div className="f-group">
                              <label
                                className="f-label"
                                htmlFor="permit-reason"
                              >
                                {t('horarios.modal.permits.reasonLabel')} *
                              </label>
                              <textarea
                                id="permit-reason"
                                className="f-input"
                                rows={2}
                                placeholder={t(
                                  'horarios.modal.permits.reasonPlaceholder',
                                )}
                                value={pReason}
                                onChange={(e) => setPReason(e.target.value)}
                              />
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                gap: 8,
                                justifyContent: 'flex-end',
                              }}
                            >
                              <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => {
                                  setShowNewPermit(false)
                                  setPStart('')
                                  setPEnd('')
                                  setP247(false)
                                  setPMStart('')
                                  setPMEnd('')
                                  setPAStart('')
                                  setPAEnd('')
                                  setPReason('')
                                }}
                              >
                                Cancelar
                              </button>
                              {permitFormError && (
                                <div
                                  style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--err)',
                                    background: 'rgba(179,58,42,0.06)',
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                  }}
                                >
                                  {permitFormError}
                                </div>
                              )}
                              <button
                                className="btn btn--primary btn--sm"
                                onClick={handleGrantPermit}
                                disabled={granting}
                              >
                                {granting
                                  ? t('horarios.modal.permits.granting')
                                  : t('horarios.modal.permits.grantBtn')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
