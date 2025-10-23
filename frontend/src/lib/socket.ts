import { io as socketIOClient, Socket } from "socket.io-client";

let socket: Socket;

export const connectSocket = () => {
  if (!socket || !socket.connected) {
    socket = socketIOClient(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      withCredentials: true, // Important for cookie-based auth
      autoConnect: true,     // Automatically connect on creation
      reconnection: true,    // Enable reconnection
      reconnectionAttempts: 5, // Max attempts
      reconnectionDelay: 2000, // Delay between retries
      transports: ["websocket"], // Prefer WebSocket
    });
  }
  return socket;
};

export const initSocket = () => {
  const s = socket || connectSocket();

  // ✅ Connected successfully
  s.on("connect", () => {
    console.log("[SOCKET] Connected:", s.id);
  });

  // ✅ Handle disconnects
  s.on("disconnect", (reason) => {
    console.warn("[SOCKET] Disconnected:", reason);
  });

  // ✅ Handle connection errors
  s.on("connect_error", (err) => {
    console.error("[SOCKET] Connection error:", err.message);
  });

  // ✅ Reconnection events
  s.on("reconnect_attempt", (attempt) => {
    console.log(`[SOCKET] Reconnection attempt ${attempt}`);
  });

  s.on("reconnect_failed", () => {
    console.error("[SOCKET] Reconnection failed");
  });

  return s;
};

export { socket };
