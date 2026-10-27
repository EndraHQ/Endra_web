/**
 * ENDRA Web - Core HTTP Client
 * Shared base request wrapper, error classes, and URL configuration.
 */

export const DEFAULT_API_BASE_URL = 'https://endramobilebe.onrender.com';

// Vite exposes only VITE_-prefixed values to browser code. Keep the deployed
// API as an explicit fallback so local development works without an env file.
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const normalizedApiBaseUrl = configuredApiBaseUrl?.replace(/\/+$/, '');
export const API_BASE_URL = normalizedApiBaseUrl || DEFAULT_API_BASE_URL;

export const DEFAULT_TIMEOUT_MS = 15000;

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  userId?: number;
}

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Normalizes phone numbers to standard E.164 +234 format for Nigerian numbers
 */
export function formatApiPhone(phone: string): string {
  let cleaned = String(phone || '').replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+234')) {
    return cleaned;
  }
  if (cleaned.startsWith('234') && cleaned.length >= 13) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return '+234' + cleaned.replace(/\D/g, '');
}

/**
 * Standard fetch wrapper with JSON serialization, configurable timeout, and structured error parsing
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  if (options.userId !== undefined && options.userId !== null) {
    headers.set('X-User-ID', String(options.userId));
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Combine caller signal if provided
  let signal = controller.signal;
  if (options.signal) {
    const callerSignal = options.signal;
    if (callerSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new ApiError(
        `The server took too long to respond (${timeoutMs / 1000}s timeout). Please try again.`,
        408,
        err
      );
    }
    throw new ApiError(
      'Unable to connect to the server. Please check your internet connection and try again.',
      0,
      err
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string') {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        errorMsg = data.detail.map((d: any) => d.msg || d.message).filter(Boolean).join('; ') || errorMsg;
      } else if (typeof data.message === 'string') {
        errorMsg = data.message;
      }
    }
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}
