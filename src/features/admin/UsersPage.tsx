import React, { useEffect, useState, useMemo } from 'react'
import { ModalPortal } from '../../components/ui/ModalPortal'
import {
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  X,
  User,
  Shield,
  Activity,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import {
  fetchUsersList,
  createUser,
  updateUser,
  disableUser,
  enableUser,
  fetchRoleChoices,
} from '../../services/users'
import type { UserItem, RoleChoice } from '../../interfaces/users'

export const UsersPage: React.FC = () => {
  const { t } = useTranslation()
  // Data states
  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<RoleChoice[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)

  // Form states
  const [formFullName, setFormFullName] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formRole, setFormRole] = useState('')
  const [formPassword, setFormPassword] = useState('')

  // Confirmation modal state
  const [userToDeactivate, setUserToDeactivate] = useState<UserItem | null>(null)

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch initial data
  const loadData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const [usersData, rolesData] = await Promise.all([
        fetchUsersList({ include_inactive: true }),
        fetchRoleChoices(),
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (err: any) {
      setErrorMsg(err.message || t('users.errors.load'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter computation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase()
      const matchSearch =
        !activeSearch ||
        fullName.includes(activeSearch.toLowerCase()) ||
        u.username.toLowerCase().includes(activeSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(activeSearch.toLowerCase())

      const matchRole = !filterRole || u.role === filterRole
      const matchStatus =
        !filterStatus ||
        (filterStatus === 'ACTIVO' && u.is_active) ||
        (filterStatus === 'INACTIVO' && !u.is_active)

      return matchSearch && matchRole && matchStatus
    })
  }, [users, activeSearch, filterRole, filterStatus])

  // Stat calculations
  const totalUsersCount = users.length
  const activeUsersCount = users.filter((u) => u.is_active).length
  const inactiveUsersCount = users.filter((u) => !u.is_active).length

  // Filter actions
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchTerm)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setActiveSearch('')
    setFilterRole('')
    setFilterStatus('')
  }

  const hasActiveFilters = activeSearch || filterRole || filterStatus

  // Open creation modal
  const handleOpenCreateModal = () => {
    setEditingUser(null)
    setFormFullName('')
    setFormUsername('')
    setFormEmail('')
    setFormPhone('')
    setFormRole('')
    setFormPassword('')
    setValidationError(null)
    setIsModalOpen(true)
  }

  // Open edit modal
  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user)
    setFormFullName(`${user.first_name || ''} ${user.last_name || ''}`.trim())
    setFormUsername(user.username)
    setFormEmail(user.email)
    setFormPhone(user.phone || '')
    setFormRole(user.role)
    setFormPassword('') // No password during edit
    setValidationError(null)
    setIsModalOpen(true)
  }

  // Form submit (create/edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setErrorMsg(null)
    setSuccessMsg(null)

    // Validations
    const nameTrimmed = formFullName.trim()
    const usernameTrimmed = formUsername.trim()
    const emailTrimmed = formEmail.trim()
    const phoneTrimmed = formPhone.trim()

    if (!nameTrimmed) {
      setValidationError(t('users.errors.nameRequired'))
      return
    }
    if (!usernameTrimmed) {
      setValidationError(t('users.errors.usernameRequired'))
      return
    }
    if (!emailTrimmed) {
      setValidationError(t('users.errors.emailRequired'))
      return
    }
    if (!formRole) {
      setValidationError(t('users.errors.roleRequired'))
      return
    }
    if (!editingUser && (!formPassword || formPassword.length < 8)) {
      setValidationError(t('users.errors.passwordRequired'))
      return
    }

    // Split first name and last name
    const nameParts = nameTrimmed.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ')

    setSubmitting(true)
    try {
      if (editingUser) {
        // Edit User
        await updateUser(editingUser.id, {
          username: usernameTrimmed,
          email: emailTrimmed,
          first_name: firstName,
          last_name: lastName,
          phone: phoneTrimmed,
          role: formRole,
        })
        setSuccessMsg(t('users.success.updated'))
      } else {
        // Create User
        await createUser({
          username: usernameTrimmed,
          password: formPassword,
          email: emailTrimmed,
          first_name: firstName,
          last_name: lastName,
          phone: phoneTrimmed,
          role: formRole,
        })
        setSuccessMsg(t('users.success.created'))
      }
      setIsModalOpen(false)
      loadData() // Refresh list
    } catch (err: any) {
      // Extract specific backend validation errors
      let detailedError = ''
      if (err.response?.data) {
        const data = err.response.data
        const keys = Object.keys(data)
        if (keys.length > 0) {
          const firstKey = keys[0]
          const msg = data[firstKey]
          detailedError = `${firstKey}: ${Array.isArray(msg) ? msg.join(', ') : msg}`
        }
      }
      setErrorMsg(detailedError || err.message || t('users.errors.save'))
    } finally {
      setSubmitting(false)
    }
  }

  // Deactivate User (Soft Delete)
  const handleDeactivate = async () => {
    if (!userToDeactivate) return
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await disableUser(userToDeactivate.id)
      setSuccessMsg(t('users.success.deactivated', { username: userToDeactivate.username }))
      setUserToDeactivate(null)
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setErrorMsg(err.message || t('users.errors.deactivate'))
      setUserToDeactivate(null)
    }
  }

  // Reactivate User
  const handleReactivate = async (user: UserItem) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await enableUser(user.id)
      setSuccessMsg(t('users.success.reactivated', { username: user.username }))
      loadData()
    } catch (err: any) {
      setErrorMsg(err.message || t('users.errors.reactivate'))
    }
  }

  // Avatars helpers
  const getInitials = (firstName?: string, lastName?: string, username?: string): string => {
    const name = `${firstName || ''} ${lastName || ''}`.trim() || username || 'U'
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('')
  }

  const getAvatarBg = (username: string): string => {
    const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']
    let sum = 0
    for (let i = 0; i < username.length; i++) sum += username.charCodeAt(i)
    return colors[sum % colors.length]
  }

  // Role restriction dynamic messages
  const getRoleRestrictionText = (role: string) => {
    if (role === 'auxiliar_despacho') {
      return t('users.roleRestrictions.auxiliar_despacho')
    }
    if (role === 'almacenista') {
      return t('users.roleRestrictions.almacenista')
    }
    if (role === 'administrador') {
      return t('users.roleRestrictions.administrador')
    }
    return null
  }

  // Visual helper for roles badge
  const renderRoleBadge = (roleValue: string) => {
    let bg = '#f3f4f6'
    let color = '#4b5563'
    let label = roleValue

    const roleObj = roles.find((r) => r.value === roleValue)
    if (roleObj) {
      label = roleObj.display_name
    }

    if (roleValue === 'administrador') {
      bg = '#e8f2ff'
      color = '#1971c2'
    } else if (roleValue === 'almacenista') {
      bg = '#ebfbee'
      color = '#099268'
    } else if (roleValue === 'auxiliar_despacho') {
      bg = '#fff4e6'
      color = '#d9480f'
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.625rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 700,
          lineHeight: 1,
          backgroundColor: bg,
          color: color,
        }}
      >
        {label.toUpperCase()}
      </span>
    )
  }

  return (
    <AppShell title={t('users.title')} subtitle={t('users.subtitle')}>
      <div className="catalog-page fade-slide-up" style={{ padding: '0.5rem 0' }}>
        
        {/* Header Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn--primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              height: '38px',
              padding: '0 1.25rem',
              borderRadius: '8px',
            }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            {t('users.createBtn')}
          </button>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Card 1: Totales */}
          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#e8f2ff',
                color: '#1971c2',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <User style={{ width: '22px', height: '22px', color: '#1971c2' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>
                {totalUsersCount}
              </span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                {t('users.stats.total')}
              </p>
            </div>
          </div>

          {/* Card 2: Activos */}
          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ebfbee',
                color: '#099268',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <CheckCircle2 style={{ width: '22px', height: '22px', color: '#0ca678' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>
                {activeUsersCount}
              </span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                {t('users.stats.active')}
              </p>
            </div>
          </div>

          {/* Card 3: Inactivos */}
          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff0f0',
                color: '#e03131',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <Activity style={{ width: '22px', height: '22px', color: '#f03e3e' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>
                {inactiveUsersCount}
              </span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                {t('users.stats.inactive')}
              </p>
            </div>
          </div>
        </section>

        {/* ── Feedback alerts ───────────────────────────────────────────── */}
        {successMsg && (
          <div className="alert-bar alert-bar--ok" role="status" style={{ marginBottom: '1.5rem' }}>
            <span>{successMsg}</span>
            <button className="alert-bar__close" onClick={() => setSuccessMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{errorMsg}</span>
            <button className="alert-bar__close" onClick={() => setErrorMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* ── Filters and Toolbar ────────────────────────────────────────── */}
        <div
          className="catalog-toolbar"
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'end',
          }}
        >
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexGrow: 2, minWidth: '280px', gap: '0.5rem' }}>
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '15px',
                  height: '15px',
                  color: '#9ca3af',
                }}
              />
              <input
                type="text"
                placeholder={t('users.filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
            <button type="submit" className="btn btn--primary" style={{ height: '38px', padding: '0 1.25rem' }}>
              {t('users.filters.searchBtn')}
            </button>
          </form>

          {/* Role Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>{t('users.filters.roleLabel')}</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '0 0.5rem',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
              }}
            >
              <option value="">{t('users.filters.roleAll')}</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '130px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>{t('users.filters.statusLabel')}</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '0 0.5rem',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
              }}
            >
              <option value="">{t('users.filters.statusAll')}</option>
              <option value="ACTIVO">{t('users.filters.statusActive')}</option>
              <option value="INACTIVO">{t('users.filters.statusInactive')}</option>
            </select>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn btn--secondary"
              style={{ height: '38px', borderRadius: '8px', whiteSpace: 'nowrap' }}
            >
              {t('users.filters.clearBtn')}
            </button>
          )}
        </div>

        {/* ── Table / Users list ────────────────────────────────────────── */}
        {loading ? (
          <div className="empty-state" style={{ padding: '3rem 0', textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>{t('users.loading')}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div
            className="empty-state"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            <User style={{ width: '48px', height: '48px', color: '#9ca3af', marginBottom: '1rem', strokeWidth: 1 }} />
            <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
              {t('users.empty')}
            </p>
          </div>
        ) : (
          <div
            className="table-surface"
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    {t('users.table.user')}
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    {t('users.table.contact')}
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    {t('users.table.role')}
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                    }}
                  >
                    {t('users.table.status')}
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                    }}
                  >
                    {t('users.table.action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || t('users.noName')
                  const initials = getInitials(u.first_name, u.last_name, u.username)
                  const avatarColor = getAvatarBg(u.username)

                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.1s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {/* Name / Avatar / Username */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: avatarColor,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <span style={{ display: 'block', fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                              {fullName}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280' }}>
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact / Email */}
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.85rem' }}>
                        <div style={{ color: '#374151' }}>{u.email}</div>
                        {u.phone && <div style={{ color: '#9ca3af', fontSize: '0.78rem' }}> {u.phone}</div>}
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>{renderRoleBadge(u.role)}</td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.25rem 0.625rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            backgroundColor: u.is_active ? '#e6fcf5' : '#fff0f0',
                            color: u.is_active ? '#0ca678' : '#f03e3e',
                            border: `1px solid ${u.is_active ? '#c3fae8' : '#ffc9c9'}`,
                          }}
                        >
                          {u.is_active ? t('users.status.active') : t('users.status.inactive')}
                        </span>
                      </td>

                      {/* Button Action */}
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                        {u.is_active ? (
                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => handleOpenEditModal(u)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              height: '30px',
                              padding: '0 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.825rem',
                              fontWeight: 500,
                            }}
                          >
                            <Edit2 style={{ width: '13px', height: '13px' }} />
                            {t('users.actions.edit')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleReactivate(u)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: '30px',
                              padding: '0 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.825rem',
                              fontWeight: 500,
                              backgroundColor: '#ebfbee',
                              color: '#099268',
                              border: '1px solid #b2f2bb',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#d3f9d8'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ebfbee'
                            }}
                          >
                            {t('users.actions.reactivate')}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CREATE / EDIT USER MODAL ───────────────────────────────────── */}
        {isModalOpen && (
          <ModalPortal onClose={() => setIsModalOpen(false)}>
            <div
              style={{
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                width: '100%',
                maxWidth: '480px',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  flexShrink: 0,
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {editingUser ? t('users.modal.editTitle') : t('users.modal.createTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '0.25rem',
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ overflow: 'auto', flex: 1, padding: '1.5rem' }}>
                <form id="user-form" onSubmit={handleSave}>
                  {validationError && (
                    <div
                      className="alert-bar alert-bar--warn"
                      role="alert"
                      style={{ marginBottom: '1.25rem', padding: '0.5rem 0.75rem' }}
                    >
                      <AlertTriangle style={{ marginRight: '0.35rem', width: '15px', height: '15px' }} />
                      <span style={{ fontSize: '0.825rem' }}>{validationError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Nombre Completo */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {t('users.modal.fullName')} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User
                          style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '14px',
                            height: '14px',
                            color: '#9ca3af',
                          }}
                        />
                        <input
                          type="text"
                          placeholder={t('users.modal.fullNamePlaceholder')}
                          value={formFullName}
                          onChange={(e) => setFormFullName(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            paddingLeft: '2.25rem',
                            height: '38px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '0.875rem',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Username & Correo en dos columnas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {/* Username */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '0.35rem',
                          }}
                        >
                          {t('users.modal.username')} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              left: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: '0.875rem',
                              color: '#9ca3af',
                              fontWeight: 600,
                            }}
                          >
                            @
                          </span>
                          <input
                            type="text"
                            placeholder="carlos.a"
                            value={formUsername}
                            onChange={(e) => setFormUsername(e.target.value)}
                            required
                            disabled={!!editingUser}
                            style={{
                              width: '100%',
                              paddingLeft: '1.75rem',
                              height: '38px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              outline: 'none',
                              backgroundColor: editingUser ? '#f3f4f6' : '#fff',
                              color: editingUser ? '#6b7280' : '#111827',
                            }}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '0.35rem',
                          }}
                        >
                          {t('users.modal.email')} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Mail
                            style={{
                              position: 'absolute',
                              left: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '14px',
                              height: '14px',
                              color: '#9ca3af',
                            }}
                          />
                          <input
                            type="email"
                            placeholder="ejemplo@icm.com"
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              paddingLeft: '2.25rem',
                              height: '38px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Teléfono & Rol en dos columnas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {/* Teléfono */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '0.35rem',
                          }}
                        >
                          {t('users.modal.phone')}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Phone
                            style={{
                              position: 'absolute',
                              left: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '14px',
                              height: '14px',
                              color: '#9ca3af',
                            }}
                          />
                          <input
                            type="text"
                            placeholder="3001234567"
                            value={formPhone}
                            onChange={(e) => setFormPhone(e.target.value)}
                            style={{
                              width: '100%',
                              paddingLeft: '2.25rem',
                              height: '38px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>

                      {/* Rol select */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '0.35rem',
                          }}
                        >
                          {t('users.modal.role')} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Shield
                            style={{
                              position: 'absolute',
                              left: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '14px',
                              height: '14px',
                              color: '#9ca3af',
                            }}
                          />
                          <select
                            value={formRole}
                            onChange={(e) => setFormRole(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              paddingLeft: '2.25rem',
                              height: '38px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              outline: 'none',
                              backgroundColor: '#fff',
                            }}
                          >
                            <option value="">{t('users.modal.roleSelectPlaceholder')}</option>
                            {roles.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.display_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contraseña temporal (solo visible en creación) */}
                    {!editingUser && (
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '0.35rem',
                          }}
                        >
                          {t('users.modal.password')} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Lock
                            style={{
                              position: 'absolute',
                              left: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '14px',
                              height: '14px',
                              color: '#9ca3af',
                            }}
                          />
                          <input
                            type="password"
                            placeholder={t('users.modal.passwordPlaceholder')}
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            required={!editingUser}
                            style={{
                              width: '100%',
                              paddingLeft: '2.25rem',
                              height: '38px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Dynamic role restriction banner */}
                    {formRole && getRoleRestrictionText(formRole) && (
                      <div
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          backgroundColor: formRole === 'auxiliar_despacho' ? '#fff4e6' : '#e6fcf5',
                          borderLeft: `4px solid ${formRole === 'auxiliar_despacho' ? '#d9480f' : '#0ca678'}`,
                          fontSize: '0.8rem',
                          color: formRole === 'auxiliar_despacho' ? '#d9480f' : '#099268',
                          fontWeight: 500,
                          lineHeight: '1.4',
                        }}
                      >
                        {getRoleRestrictionText(formRole)}
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #e5e7eb',
                  flexShrink: 0,
                  background: '#fff',
                }}
              >
                {/* Left: Deactivate button (Only when editing an active user) */}
                {editingUser && editingUser.is_active ? (
                  <button
                    type="button"
                    onClick={() => setUserToDeactivate(editingUser)}
                    style={{
                      height: '36px',
                      padding: '0 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      backgroundColor: '#fff5f5',
                      color: '#e03131',
                      border: '1px solid #ffc9c9',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffe3e3'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff5f5'
                    }}
                  >
                    {t('users.deactivateBtn')}
                  </button>
                ) : (
                  <div />
                )}

                {/* Right: Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn--secondary"
                    style={{ height: '36px', padding: '0 1rem', borderRadius: '6px', fontSize: '0.825rem' }}
                  >
                    {t('users.modal.cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    form="user-form"
                    disabled={submitting}
                    className="btn btn--primary"
                    style={{ height: '36px', padding: '0 1.25rem', borderRadius: '6px', fontSize: '0.825rem' }}
                  >
                    {submitting
                      ? t('users.modal.savingBtn')
                      : editingUser
                      ? t('users.modal.saveBtn')
                      : t('users.modal.createSubmitBtn')}
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* ── DEACTIVATE CONFIRMATION MODAL ──────────────────────────────── */}
        {userToDeactivate && (
          <ModalPortal onClose={() => setUserToDeactivate(null)}>
            <div
              style={{
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                width: '100%',
                maxWidth: '420px',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fff5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  border: '1px solid #ffe3e3',
                }}
              >
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#f03e3e' }} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
                {t('users.deactivateModal.title')}
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.4', margin: '0 0 1.5rem 0' }}>
                {t('users.deactivateModal.confirm')} <strong>@{userToDeactivate.username}</strong>?
                <br />
                {t('users.deactivateModal.warning')}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setUserToDeactivate(null)}
                  className="btn btn--secondary"
                  style={{ height: '36px', padding: '0 1.25rem', borderRadius: '6px', fontSize: '0.825rem' }}
                >
                  {t('users.deactivateModal.cancelBtn')}
                </button>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  style={{
                    height: '36px',
                    padding: '0 1.25rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    backgroundColor: '#e03131',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#c22525'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e03131'
                  }}
                >
                  {t('users.deactivateModal.confirmBtn')}
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </AppShell>
  )
}

export default UsersPage
