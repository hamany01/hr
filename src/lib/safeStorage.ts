// Safe storage helper to prevent Uncaught SecurityError in sandbox/iframe environments
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (isLocalStorageAvailable()) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`localStorage.getItem failed for key "${key}":`, e);
    }
    return memoryStorage[key] !== undefined ? memoryStorage[key] : null;
  },

  setItem(key: string, value: string): void {
    try {
      if (isLocalStorageAvailable()) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`localStorage.setItem failed for key "${key}":`, e);
    }
    memoryStorage[key] = String(value);
  },

  removeItem(key: string): void {
    try {
      if (isLocalStorageAvailable()) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`localStorage.removeItem failed for key "${key}":`, e);
    }
    delete memoryStorage[key];
  },

  clear(): void {
    try {
      if (isLocalStorageAvailable()) {
        window.localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn("localStorage.clear failed:", e);
    }
    for (const key in memoryStorage) {
      delete memoryStorage[key];
    }
  }
};
