import axios from "axios";
import { api } from "./api";
import type { LoginPayload, LoginResponse } from "../interfaces/auth";

const getFriendlyAuthError = (status?: number, data?: unknown) => {
  const payload = data as
    | { message?: string; detail?: string; error?: string }
    | undefined;

  // Siempre prioriza el mensaje del backend si existe
  const apiMessage = payload?.detail || payload?.message;
  if (apiMessage) {
    return apiMessage;
  }

  if (!status) {
    return "No se pudo conectar con el servidor";
  }
  if (status >= 300 && status < 400) {
    return "Respuesta inesperada del servidor";
  }
  if (status === 401) {
    return "Usuario o contraseña incorrectos";
  }
  if (status === 403) {
    return "Acceso restringido. Verifica tu horario de acceso.";
  }
  if (status >= 400 && status < 500) {
    return "Datos inválidos o solicitud incorrecta";
  }
  if (status >= 500) {
    return "Error interno del servidor";
  }
  return "No se pudo iniciar sesión";
};

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/auth/login/", payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        getFriendlyAuthError(error.response?.status, error.response?.data),
      );
    }
    throw new Error("No se pudo iniciar sesión");
  }
};

export const logout = async (refreshToken: string): Promise<void> => {
  try {
    await api.post("/auth/logout/", { refresh: refreshToken });
  } catch {
    // Si falla el logout en el backend, igual limpiamos localmente
    console.warn("No se pudo invalidar el token en el servidor");
  }
};

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<string> => {
  const response = await api.post<{ access: string }>("/auth/token/refresh/", {
    refresh: refreshToken,
  });
  return response.data.access;
};
