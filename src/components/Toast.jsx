import { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((title, icon = 'none') => {
    setToast({ title, icon });
    setTimeout(() => setToast(null), 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast-overlay">
          <div className="toast-box">
            {toast.icon === 'success' && <span className="toast-icon">✓</span>}
            <span>{toast.title}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
