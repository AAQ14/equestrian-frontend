import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { notificationsApi } from '../api/endpoints';
import useSse from '../hooks/useSse';

const NotificationContext = createContext(null);
const LAST_SEEN_KEY = 'notificationsLastSeen';

// Keeps the list of notifications for the bell icon and listens for live ones (SSE).
export function NotificationProvider({ children }) {
  const { token, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem(LAST_SEEN_KEY) || '');
  // The newest live notification. Pages can watch it, e.g. the seat map refreshes on TICKET_ events.
  const [lastEvent, setLastEvent] = useState(null);

  // Load past notifications after login; clear them on logout.
  useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      return;
    }
    notificationsApi
      .list()
      .then(setItems)
      .catch(() => setItems([]));
  }, [isLoggedIn]);

  // Live notifications from the server.
  useSse('/api/notifications/stream', token, (eventName, data) => {
    if (eventName !== 'notification') return;
    setItems((current) => [data, ...current]);
    setLastEvent(data);
    showToast(data.message, 'info');
  });

  // Unread = not read on the server and newer than the last time the bell was opened.
  const unreadCount = items.filter((n) => !n.isRead && (!lastSeen || n.createdAt > lastSeen)).length;

  // Called when the bell dropdown opens: everything up to now counts as seen.
  function markAllSeen() {
    // Local time in the same format as the backend dates ("2026-10-29T08:15:30").
    // toISOString() is in UTC, so we shift it by the time zone offset first.
    const date = new Date();
    const now = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
    localStorage.setItem(LAST_SEEN_KEY, now);
    setLastSeen(now);
  }

  return (
    <NotificationContext.Provider value={{ items, unreadCount, markAllSeen, lastEvent }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
