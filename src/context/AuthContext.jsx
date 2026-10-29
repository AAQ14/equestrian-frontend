import { createContext, useContext, useState } from 'react';
import * as authApi from '../api/authApi';
import { TOKEN_KEY } from '../api/axiosInstance';
import { decodeToken, isTokenExpired } from '../utils/jwt';

const NAME_KEY = 'userName';

const AuthContext = createContext(null);

// Builds the user object from the token (email + role) and the saved name.
function buildUser(token, name) {
  const claims = decodeToken(token);
  if (isTokenExpired(claims)) return null;
  return {
    email: claims.sub,
    role: claims.role, // CLIENT, INSTRUCTOR or ADMIN
    firstName: name?.firstName || '',
    lastName: name?.lastName || '',
  };
}

// Reads what was saved in localStorage, so a page refresh keeps the user logged in.
function loadSavedSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { token: null, user: null };
  const name = JSON.parse(localStorage.getItem(NAME_KEY) || 'null');
  const user = buildUser(token, name);
  if (!user) {
    localStorage.removeItem(TOKEN_KEY);
    return { token: null, user: null };
  }
  return { token, user };
}

export function AuthProvider({ children }) {
  // The token lives in React state (so the UI re-renders) AND in localStorage (survives refresh).
  const [session, setSession] = useState(loadSavedSession);

  async function login(email, password) {
    const data = await authApi.login(email, password); // { firstName, lastName, token }
    const name = { firstName: data.firstName, lastName: data.lastName };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(NAME_KEY, JSON.stringify(name));
    const user = buildUser(data.token, name);
    setSession({ token: data.token, user });
    return user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    setSession({ token: null, user: null });
  }

  const value = {
    token: session.token,
    user: session.user,
    isLoggedIn: Boolean(session.user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Small helper hook: const { user, login } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
