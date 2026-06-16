import axios from 'axios';

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.humanMessage || 'Ocurrió un error inesperado.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

export function extractFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError(error) && error.fieldErrors) {
    return error.fieldErrors;
  }
  return {};
}
