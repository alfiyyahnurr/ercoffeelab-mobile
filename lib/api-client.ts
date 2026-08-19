import * as SecureStore from 'expo-secure-store';

/**
 * Centralized API fetch wrapper for ERCoffeeLab Mobile App.
 * Automatically injects JWT Bearer token stored in hardware encrypted SecureStore.
 */
export async function mobileApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  let token: string | null = null;

  try {
    token = await SecureStore.getItemAsync('customer_jwt');
  } catch (e) {
    console.warn('[SecureStore] Failed to read token:', e);
  }

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
 * Helper to get full image URL for product thumbnails
 */
export function getImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}
