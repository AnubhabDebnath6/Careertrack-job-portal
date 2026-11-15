import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const onLogout = () => setAdmin(null);
    window.addEventListener('careertrack-logout', onLogout);

    if (!getToken()) {
      setReady(true);
    } else {
      api
        .me()
        .then((data) => alive && setAdmin(data.admin))
        .catch(() => clearToken())
        .finally(() => alive && setReady(true));
    }

    return () => {
      alive = false;
      window.removeEventListener('careertrack-logout', onLogout);
    };
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setAdmin(data.admin);
  };

  const logout = () => {
    clearToken();
    setAdmin(null);
  };

  return <AuthContext.Provider value={{ admin, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
