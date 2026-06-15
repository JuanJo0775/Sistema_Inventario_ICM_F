import axios from "axios";
import useAuthStore from "../store/useAuthStore";

declare module 'axios' {
  interface AxiosError {
    humanMessage?: string;
    fieldErrors?: Record<string, string> | null;
  }
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Interceptor para renovar el token cuando expira
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

function getFallbackMessage(status?: number): string {
  switch (status) {
    case 400: return 'Los datos enviados no son válidos. Revisa el formulario.';
    case 401: return 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.';
    case 403: return 'No tienes permiso para realizar esta acción.';
    case 404: return 'El recurso solicitado no existe.';
    case 409: return 'Conflicto con datos existentes. Verifica la información.';
    case 422: return 'Error de validación. Revisa los campos del formulario.';
    case 500: return 'Error interno del servidor. Intenta de nuevo más tarde.';
    default:  return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const data = error.response?.data;

    // Extraer mensaje legible del body del API
    const apiMessage =
      data?.message ||
      data?.detail ||
      data?.error?.message ||
      data?.non_field_errors?.[0] ||
      null;

    const fieldErrors = data?.detail && typeof data.detail === 'object' && !Array.isArray(data.detail)
      ? Object.fromEntries(
          Object.entries(data.detail).map(([k, v]) => [
            k,
            Array.isArray(v) ? v[0] : String(v)
          ])
        )
      : null;

    const fieldErrorValues = fieldErrors ? Object.values(fieldErrors) : [];
    const humanMessage = apiMessage || fieldErrorValues[0] || getFallbackMessage(status);

    error.humanMessage = humanMessage;
    error.fieldErrors = fieldErrors;

    // Si es 401 y no es la propia llamada de refresh (para evitar loop infinito)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/token/refresh/") &&
      !originalRequest.url?.includes("/auth/login/")
    ) {
      if (isRefreshing) {
        // Si ya hay un refresh en curso, encola esta petición
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshed = await useAuthStore.getState().tryRefreshToken();

      if (refreshed) {
        const newToken = useAuthStore.getState().token;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        isRefreshing = false;
        return api(originalRequest);
      } else {
        processQueue(error, null);
        isRefreshing = false;
        // Token inválido, redirigir al login
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
