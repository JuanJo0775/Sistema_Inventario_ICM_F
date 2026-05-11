import { create } from 'zustand'
import { login as loginRequest } from '../services/auth'
import { setAuthToken } from '../services/api'
import type { LoginPayload, User } from '../types/auth'

type AuthStore = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginPayload) => Promise<void>
  logout: () => void
}

const storageKey = 'icm_auth_token'

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(storageKey)
}

const initialToken = getStoredToken()
if (initialToken) {
  setAuthToken(initialToken)
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: initialToken,
  isAuthenticated: Boolean(initialToken),
  login: async (credentials) => {
    const data = await loginRequest(credentials)
    localStorage.setItem(storageKey, data.access)
    setAuthToken(data.access)
    set({ token: data.access, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem(storageKey)
    setAuthToken(null)
    set({ token: null, user: null, isAuthenticated: false })
  },
}))

export default useAuthStore
