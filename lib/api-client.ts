import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getToken } from './auth-store';

const DEFAULT_PRODUCTION_API_URL = 'https://ercoffeelab-api.vercel.app';

/**
 * Dynamically resolves the API base URL with smart production auto-detection.
 * 1. Checks process.env.EXPO_PUBLIC_API_URL
 * 2. If running in web browser on a production domain (e.g. *.vercel.app),
 *    automatically routes to the deployed production API (https://ercoffeelab-api.vercel.app).
 * 3. On physical mobile devices / Expo Go, extracts the Metro LAN IP.
 * 4. Fallbacks to http://localhost:3000 for local development.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // If on web browser
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

      // If running on a live web deployment (e.g. *.vercel.app or production domain)
      if (!isLocalhost) {
        // If envUrl is explicitly provided and does NOT point to localhost, use it
        if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
          return envUrl.replace(/\/+$/, '');
        }
        // Otherwise, automatically default to the deployed Vercel backend API
        return DEFAULT_PRODUCTION_API_URL;
      }
    }

    if (envUrl && envUrl.length > 0) {
      return envUrl.replace(/\/+$/, '');
    }

    return 'http://localhost:3000';
  }

  // Native / Mobile OS
  if (envUrl && envUrl.length > 0) {
    return envUrl.replace(/\/+$/, '');
  }

  // On physical mobile device or Expo Go, deduce host IP from Expo Constants
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }

  return 'http://localhost:3000';
}

/**
 * Centralized API fetch wrapper for ERCoffeeLab Mobile App.
 * Automatically injects JWT Bearer token stored securely via expo-secure-store.
 */
export async function mobileApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = await getToken();

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMessage =
      data && typeof data === 'object' && 'error' in data && data.error
        ? (data as { error: string }).error
        : `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  return data as T;
}

/**
 * Helper to construct full image URL for product thumbnails and assets.
 */
export function getImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}
