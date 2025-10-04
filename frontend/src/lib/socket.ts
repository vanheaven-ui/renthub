import { io, Socket } from "socket.io-client";

const socket: Socket = io(process.env.NEXT_PUBLIC_BACKEND_URL as string, {
  withCredentials: true,
  reconnection: true, // Enable reconnection
  reconnectionAttempts: 5, // Try reconnecting 5 times
  reconnectionDelay: 1000, // Wait 1s between attempts
});

export default socket;
