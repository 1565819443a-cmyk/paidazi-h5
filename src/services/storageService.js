const PREFIX = 'pidazi_';

export const storageService = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {}
  },
  toggleInArray(key, item) {
    const arr = this.get(key, []);
    const idx = arr.indexOf(item);
    if (idx > -1) { arr.splice(idx, 1); this.set(key, arr); return false; }
    else { arr.unshift(item); this.set(key, arr.slice(0, 200)); return true; }
  },
  isInArray(key, item) {
    return this.get(key, []).includes(item);
  },
};

export default storageService;
