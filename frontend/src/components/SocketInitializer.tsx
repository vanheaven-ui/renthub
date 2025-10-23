"use client";

import { initSocket } from "@/lib/socket";
import { useEffect, useState } from "react";

/**
 * SocketInitializer ensures:
 * 1. The socket is initialized once globally.
 * 2. Connection lifecycle events (connect/disconnect/error) are logged.
 * 3. Optionally tracks connection state (useful for debugging or context).
 */
export default function SocketInitializer() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = initSocket(); // Initialize or retrieve existing socket instance

    const handleConnect = () => {
      console.log("[SOCKET INIT] ✅ Connected:", socket.id);
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.warn("[SOCKET INIT] ⚠️ Disconnected:", reason);
      setIsConnected(false);
    };

    const handleError = (err: Error) => {
      console.error("[SOCKET INIT] ❌ Connection error:", err.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
    };
  }, []);

  // In production, this component doesn't render anything visible
  return null;
}
