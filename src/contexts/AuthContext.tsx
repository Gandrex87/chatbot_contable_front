"use client";

import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const validUsers = {
  admin: {
    password: "password",
    user: { id: "1", username: "admin", name: "Admin User" },
  },
  contable: {
    password: "Temporal123",
    user: { id: "2", username: "contable", name: "Contable User" },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(logout, SESSION_TIMEOUT);
    };

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        resetTimeout();
        window.addEventListener("mousemove", resetTimeout);
        window.addEventListener("keydown", resetTimeout);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keydown", resetTimeout);
    };
  }, [logout]);
  
  const login = async (username: string, password: string) => {
    const lowercasedUsername = username.toLowerCase();
    if (
      lowercasedUsername in validUsers &&
      validUsers[lowercasedUsername as keyof typeof validUsers].password === password
    ) {
      const loggedInUser = validUsers[lowercasedUsername as keyof typeof validUsers].user;
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
