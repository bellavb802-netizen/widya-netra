import React, { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { clearSession, getSession, saveSession } from "@/lib/session";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getSession());
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let active = true;
    base44.get("/auth/me")
      .then(({ data }) => {
        if (!active) return;
        const session = saveSession(data.user);
        setUser(session);
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status !== 401) {
          console.error("Gagal memeriksa sesi:", error);
        }
        clearSession();
        setUser(null);
      })
      .finally(() => {
        if (active) setIsLoadingAuth(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (username, password) => {
    try {
      const { data } = await base44.post("/auth/login", { username, password });
      const session = saveSession(data.user);
      setUser(session);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.error || error.message || "Login gagal.",
      };
    }
  };

  const logout = async () => {
    try {
      await base44.post("/auth/logout");
    } finally {
      clearSession();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
