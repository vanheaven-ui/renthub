import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_BACKEND_URL as string;

// Create a socket instance but do NOT connect automatically
const socket: Socket = io(URL, {
  autoConnect: false,         // Prevent auto connect on import
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Optional debug logs (remove in production)
socket.on("connect", () => console.log("[SOCKET] Connected:", socket.id));
socket.on("disconnect", (reason) => console.log("[SOCKET] Disconnected:", reason));
socket.on("connect_error", (err) => console.error("[SOCKET] Connection error:", err.message));

export default socket;
