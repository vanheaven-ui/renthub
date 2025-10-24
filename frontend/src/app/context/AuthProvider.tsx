"use client";

import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getMe, logoutUser } from "@/lib/api";
import { User } from "@/types";
// Import socket functions/instance
import { initSocket, socket } from "@/lib/socket";

// --- Interfaces ---

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
}

// --- Context ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // 1. Initial user loading and verification (Runs once on mount)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Re-verify user identity with the backend to ensure session is active
      getMe().catch(() => {
        // If verification fails, clear local storage and state
        localStorage.removeItem("user");
        setUser(null);
      });
    }
  }, []);

  // 2. SOCKET MANAGEMENT (Runs when 'user' state changes)
  useEffect(() => {
    // A. Initialize the socket only if a user is logged in
    if (user) {
      console.log("[SOCKET INIT] User detected. Attempting connection...");
      const s = initSocket(); // Connects the socket and starts the attempt

      // B. Define and attach connection listeners (for logging)
      const handleConnect = () => {
        console.log(`[SOCKET INIT] ✅ Connected as user ID ${user.id}:`, s.id);
      };
      const handleDisconnect = (reason: string) => {
        console.warn("[SOCKET INIT] ⚠️ Disconnected:", reason);
      };
      const handleError = (err: Error) => {
        console.error("[SOCKET INIT] ❌ Connection error:", err.message);
      };

      s.on("connect", handleConnect);
      s.on("disconnect", handleDisconnect);
      s.on("connect_error", handleError);

      // C. Cleanup function: runs on component unmount OR when 'user' changes
      return () => {
        console.log("[SOCKET INIT] Cleaning up socket listeners...");
        s.off("connect", handleConnect);
        s.off("disconnect", handleDisconnect);
        s.off("connect_error", handleError);
      };
    } else {
      // D. If user state is null (user logged out/session expired), disconnect the socket
      if (socket && socket.connected) {
        console.log(
          "[SOCKET INIT] User logged out/session invalid. Disconnecting socket."
        );
        socket.disconnect();
      }
    }

    // Note: The dependency array [user] ensures this effect runs after login, after initial load, and after logout.
  }, [user]);

  // --- Auth Functions ---

  const login = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // API logout failure is ignored, local session cleanup is prioritized
    } finally {
      localStorage.removeItem("user");
      // Setting user to null triggers the socket cleanup logic in the useEffect
      setUser(null);
      router.push("/login");
    }
  };

  // --- Render ---

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook ---

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
