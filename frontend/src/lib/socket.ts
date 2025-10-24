import { io as socketIOClient, Socket } from "socket.io-client";

let socket: Socket;

// Connects/returns the existing socket. Does NOT add listeners here.
export const connectSocket = (): Socket => {
  if (!socket || !socket.connected) {
    socket = socketIOClient(process.env.NEXT_PUBLIC_BACKEND_URL!, {
      withCredentials: true, // Important for cookie-based auth
      autoConnect: false, // Prevent auto-connect on instantiation
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ["websocket"],
    });
  }
  return socket;
};

// Initializes the socket and returns the instance.
// Removed listeners here, they will be handled by the AuthProvider's useEffect.
export const initSocket = (): Socket => {
  const s = connectSocket();
  // If it's the first time and autoConnect is false, we should explicitly call .connect()
  if (!s.connected) {
    s.connect(); // Explicitly start the connection attempt
  }
  return s;
};

// Export the socket instance
export { socket };