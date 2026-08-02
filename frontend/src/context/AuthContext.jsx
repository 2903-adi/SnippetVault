import { createContext, useContext, useEffect, useState } from "react";
import { fetchMe, getToken, setToken as saveToken } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function boot() {
      const token = getToken();
      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const me = await fetchMe();
        if (active) setUser(me);
      } catch {
        saveToken(null);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    boot();
    return () => {
      active = false;
    };
  }, []);

  function login(token, nextUser) {
    saveToken(token);
    setUser(nextUser);
  }

  function logout() {
    saveToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
