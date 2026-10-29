import axios from 'axios';

export const TOKEN_KEY = 'token';

// One axios instance for the whole app.
// baseURL is empty because Vite's proxy forwards /api and /auth to port 8000.
const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: runs before EVERY request and adds the JWT if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  // Do not overwrite a header that was set on purpose (the reset-password token).
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: runs after EVERY response.
// On 401 with a saved token, the token has expired: log out and go to the login page.
// Calls to /auth/... are skipped, because a wrong password on login is also a 401.
// Guests (no token) are not redirected; the page shows a "please log in" message instead.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const hadToken = Boolean(localStorage.getItem(TOKEN_KEY));
    if (status === 401 && hadToken && !url.startsWith('/auth/')) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

// Some list endpoints answer 404 when the list is empty.
// This helper turns that 404 into an empty array, so pages can show "No items yet".
export async function getList(url, config) {
  try {
    const response = await api.get(url, config);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
}

// Turns any axios error into a short text for a toast.
// The backend always sends { timestamp, status, error, message, path }.
export function getErrorMessage(error) {
  if (!error.response) {
    return 'Cannot reach the server. Is the backend running on port 8000?';
  }
  if (error.response.status === 429) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  return error.response.data?.message || 'Something went wrong. Please try again.';
}

export default api;
