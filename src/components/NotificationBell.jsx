import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatDateTime } from '../utils/format';
import './NotificationBell.css';

// A small icon per notification type, so the list is easy to scan.
function iconFor(type = '') {
  if (type.startsWith('TICKET')) return '🎟';
  if (type.startsWith('TOURNAMENT')) return '🏆';
  if (type.startsWith('HORSE')) return '🐎';
  if (type.startsWith('BOOKING') || type.startsWith('SESSION')) return '📅';
  return '🔔';
}

// Bell icon with an unread badge and a dropdown of past notifications.
export default function NotificationBell() {
  const { items, unreadCount, markAllSeen } = useNotifications();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Close the dropdown when clicking anywhere outside it.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function toggle() {
    if (!open) markAllSeen();
    setOpen(!open);
  }

  return (
    <div className="bell" ref={boxRef}>
      <button
        className="bell-button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z" />
        </svg>
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="bell-panel">
          <p className="bell-title">Notifications</p>
          {items.length === 0 ? (
            <p className="bell-empty">No notifications yet.</p>
          ) : (
            <ul className="bell-list">
              {items.slice(0, 30).map((item) => (
                <li key={item.id} className="bell-item">
                  <span className="bell-icon" aria-hidden="true">{iconFor(item.notificationType)}</span>
                  <div>
                    <p className="bell-message">{item.message}</p>
                    <p className="bell-time">{formatDateTime(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
