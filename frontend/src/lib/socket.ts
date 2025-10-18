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

// ----------------- DEBUG -----------------
socket.on("connect", () => console.log("[SOCKET] Connected:", socket.id));
socket.on("disconnect", (reason) =>
  console.log("[SOCKET] Disconnected:", reason)
);

// Type the error properly as `Error`
socket.on("connect_error", (err: Error) =>
  console.error("[SOCKET] Connection error:", err.message)
);

// ----------------- CONNECTION -----------------
export const connectSocket = () => {
  if (!socket.connected) {
    console.log("[SOCKET] Attempting to connect using cookies...");
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    console.log("[SOCKET] Disconnecting...");
    socket.disconnect();
  }
};
