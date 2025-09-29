"use client";

import { getUserInfo } from '@/lib/user-config';
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";


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
  },
  contable: {
    password: "Temporal123",
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
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);
  
  const login = async (username: string, password: string) => {
    const lowercasedUsername = username.toLowerCase();
    
    if (
      lowercasedUsername in validUsers &&
      validUsers[lowercasedUsername as keyof typeof validUsers].password === password
    ) {
      // Obtener información completa del usuario desde user-config
      const userConfig = getUserInfo(lowercasedUsername);
      
      // Generar ID único
      const userId = `user_${lowercasedUsername}_${Date.now()}`;
      
      // Crear objeto User con información completa
      const loggedInUser: User = {
        id: userId,
        username: lowercasedUsername,
        name: userConfig.fullName,
        role: userConfig.role,
        style: userConfig.style,
      };
      
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}