import { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

let nextId = 1;

// Holds the list of toasts on screen. Any page can call showToast('Saved!', 'success').
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function removeToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  // type: 'success' | 'error' | 'info'
  function showToast(message, type = 'info') {
    const id = nextId++;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => removeToast(id), 4500); // Disappears after 4.5 seconds.
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
