// @/lib/socket.ts
import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_BACKEND_URL as string;

// Create socket instance — use cookies for auth
export const socket: Socket = io(URL, {
  autoConnect: false,
  withCredentials: true, // ✅ send cookies automatically
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// ----------------- DEBUG (REMOVED GLOBAL LISTENERS) -----------------
// The global listeners are removed here. They should only be registered
// once in a stable location (like chatService.ts init or a top-level component)
// to prevent duplicate logs/behavior.

// ----------------- CONNECTION -----------------
export const connectSocket = () => {
  if (!socket.connected) {
    console.log("[SOCKET] Attempting to connect using cookies...");
    socket.connect();
  }
};

export const disconnectSocket = () => {
  // Note: Disconnect often sets autoConnect to false internally,
  // but the client-side logic should handle re-connection attempts.
  if (socket.connected) {
    console.log("[SOCKET] Disconnecting...");
    socket.disconnect();
  }
};
