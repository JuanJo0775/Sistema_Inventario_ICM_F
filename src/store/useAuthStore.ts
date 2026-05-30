import { create } from 'zustand'
import { login as loginRequest } from '../services/auth'
import { setAuthToken } from '../services/api'
import type { LoginPayload, User } from '../interfaces/auth'
import { mockDemoUser } from '../mocks/auth'

type AuthStore = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginPayload) => Promise<void>
  loginDemo: (profile?: { name?: string; role?: User['role'] }) => void
  logout: () => void
}

const storageKey = 'icm_auth_token'
const storageUserKey = 'icm_auth_user'

const getStoredToken = () => {
  if (globalThis.window === undefined) {
    return null
  }
  return localStorage.getItem(storageKey)
}

const getStoredUser = () => {
  if (globalThis.window === undefined) {
    return null
  }
  const raw = localStorage.getItem(storageUserKey)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as User
  } catch {
    localStorage.removeItem(storageUserKey)
    return null
  }
}

const initialToken = getStoredToken()
const initialUser = getStoredUser()
if (initialToken) {
  setAuthToken(initialToken)
}

const useAuthStore = create<AuthStore>((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken),
  login: async (credentials) => {
    const data = await loginRequest(credentials)
    localStorage.setItem(storageKey, data.access)
    localStorage.setItem(storageUserKey, JSON.stringify(data.user))
    setAuthToken(data.access)
    set({ token: data.access, isAuthenticated: true, user: data.user })
  },
  loginDemo: (profile) => {
    const demoToken = 'demo-session'
    const role = profile?.role ?? mockDemoUser.role
    const demoUser = { ...mockDemoUser, role }

    localStorage.setItem(storageKey, demoToken)
    localStorage.setItem(storageUserKey, JSON.stringify(demoUser))
    setAuthToken(demoToken)
    set({ token: demoToken, isAuthenticated: true, user: demoUser })
  },
  logout: () => {
    localStorage.removeItem(storageKey)
    localStorage.removeItem(storageUserKey)
    setAuthToken(null)
    set({ token: null, user: null, isAuthenticated: false })
  },
}))

export default useAuthStore
