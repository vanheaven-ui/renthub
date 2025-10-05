// frontend/hooks/useAuth.ts
"use client";

import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import { getMe, loginUser, registerUser, logoutUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Load user from localStorage when client mounts
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  // ✅ Refresh session (checks with backend)
  const refreshUser = async () => {
    try {
      const me = await getMe();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
    } catch {
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  // ✅ Login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user } = await loginUser({ email, password });
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register
  const register = async (data: any) => {
    setLoading(true);
    try {
      const { user } = await registerUser(data);
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout
  const logout = async () => {
    await logoutUser();
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
