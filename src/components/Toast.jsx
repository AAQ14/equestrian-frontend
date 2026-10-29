import './Toast.css';

const ICONS = { success: '✓', error: '!', info: 'i' };

// One small message box. The list of toasts is managed by ToastContext.
export default function Toast({ message, type, onClose }) {
  return (
    <div className={`toast toast-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="toast-icon" aria-hidden="true">
        {ICONS[type]}
      </span>
      <p className="toast-message">{message}</p>
      <button className="toast-close" onClick={onClose} aria-label="Close message">
        ×
      </button>
    </div>
  );
}
