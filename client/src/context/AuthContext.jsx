import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('webbill_user')) || null;
    } catch {
      return null;
    }
  });
  const [business, setBusiness] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('webbill_business')) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('webbill_token') || null);

  const login = (data) => {
    localStorage.setItem('webbill_token', data.token);
    localStorage.setItem('webbill_user', JSON.stringify(data.user));
    localStorage.setItem('webbill_business', JSON.stringify(data.business));
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
  };

  const logout = () => {
    localStorage.removeItem('webbill_token');
    localStorage.removeItem('webbill_user');
    localStorage.removeItem('webbill_business');
    setToken(null);
    setUser(null);
    setBusiness(null);
  };

  return (
    <AuthContext.Provider value={{ user, business, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
