import { create } from "zustand";
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshAccessToken,
} from "../services/auth";
import { setAuthToken } from "../services/api";
import type { LoginPayload, User } from "../interfaces/auth";

type AuthStore = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  tryRefreshToken: () => Promise<boolean>;
};

const STORAGE_TOKEN_KEY = "icm_auth_token";
const STORAGE_REFRESH_KEY = "icm_auth_refresh";
const STORAGE_USER_KEY = "icm_auth_user";

const getStoredToken = () => {
  if (globalThis.window === undefined) return null;
  return localStorage.getItem(STORAGE_TOKEN_KEY);
};

const getStoredRefresh = () => {
  if (globalThis.window === undefined) return null;
  return localStorage.getItem(STORAGE_REFRESH_KEY);
};

const getStoredUser = () => {
  if (globalThis.window === undefined) return null;
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(STORAGE_USER_KEY);
    return null;
  }
};

const initialToken = getStoredToken();
const initialRefresh = getStoredRefresh();
const initialUser = getStoredUser();

if (initialToken) {
  setAuthToken(initialToken);
}

const useAuthStore = create<AuthStore>((set, get) => ({
  user: initialUser,
  token: initialToken,
  refreshToken: initialRefresh,
  isAuthenticated: Boolean(initialToken),

  login: async (credentials) => {
    const data = await loginRequest(credentials);
    localStorage.setItem(STORAGE_TOKEN_KEY, data.access);
    localStorage.setItem(STORAGE_REFRESH_KEY, data.refresh);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    setAuthToken(data.access);
    set({
      token: data.access,
      refreshToken: data.refresh,
      isAuthenticated: true,
      user: data.user,
    });
  },

  logout: async () => {
    const { refreshToken } = get();
    if (refreshToken) {
      await logoutRequest(refreshToken);
    }
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_REFRESH_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setAuthToken(null);
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  tryRefreshToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return false;
    try {
      const newAccess = await refreshAccessToken(refreshToken);
      localStorage.setItem(STORAGE_TOKEN_KEY, newAccess);
      setAuthToken(newAccess);
      set({ token: newAccess, isAuthenticated: true });
      return true;
    } catch {
      // El refresh falló (expiró o fue invalidado), cerramos sesión
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_REFRESH_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      setAuthToken(null);
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
      return false;
    }
  },
}));

export default useAuthStore;
