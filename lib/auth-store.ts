import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'customer_jwt';
let inMemoryToken: string | null = null;

/**
 * Saves customer JWT token securely in hardware-encrypted storage (or localStorage on Web).
 * @param token JWT token string returned from API authentication
 */
export async function setToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      } else {
        inMemoryToken = token;
      }
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.warn('[auth-store] Fallback storing auth token:', error);
    inMemoryToken = token;
  }
}

/**
 * Retrieves stored customer JWT token from SecureStore (or localStorage on Web).
 * @returns JWT token string or null if not set / unreadable
 */
export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(TOKEN_KEY);
      }
      return inMemoryToken;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('[auth-store] Fallback getting auth token:', error);
    return inMemoryToken;
  }
}

/**
 * Removes customer JWT token from SecureStore/localStorage (Logout).
 */
export async function removeToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
      inMemoryToken = null;
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.warn('[auth-store] Fallback removing auth token:', error);
    inMemoryToken = null;
  }
}

/**
 * Checks if a valid customer JWT token exists in storage.
 * @returns true if token exists and is non-empty, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getToken();
    return !!token && token.trim().length > 0;
  } catch {
    return false;
  }
}
