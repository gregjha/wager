import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Cross-platform key/value store for short string secrets.
 *
 * - Native: backed by {@link SecureStore} (iOS Keychain / Android
 *   Keystore).
 * - Web: SecureStore is unavailable, so we fall back to
 *   `localStorage`. Web is dev-only for the mobile app; production
 *   tokens never live in a browser.
 */
export const secureStore = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async delete(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
