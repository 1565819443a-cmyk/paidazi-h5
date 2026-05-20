export function getStorageSync(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStorageSync(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export function removeStorageSync(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearStorageSync() {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
}
