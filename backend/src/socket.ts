import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { prisma } from "./lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "token";

export const activeUsers = new Map<string, Set<string>>();
export const unreadCounts = new Map<string, Map<string, number>>();
export const lastSeen = new Map<string, string>();

let io: Server;

interface TypingEvent {
  bookingId: string;
}

interface SendMessageEvent {
  bookingId: string;
  receiverId: string;
  content: string;
  tempId?: string;
}

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, credentials: true },
    // Increased maxHttpBufferSize to handle larger payloads if needed, but primarily for chat speed
    maxHttpBufferSize: 1e8,
  });

  // --- Cookie-based auth middleware (No changes needed)
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake?.headers?.cookie;
      const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};

      const token = cookies[COOKIE_NAME];
      if (!token) {
        console.warn("[SOCKET] No token found in cookies:", cookies);
        return next(new Error("Authentication error: No token found"));
      }

      const decoded: any = jwt.verify(token, JWT_SECRET);
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      console.error("[SOCKET] Auth error:", err);
      next(new Error("Authentication error: Invalid or missing token"));
    }
  });

  io.on("connection", (socket) => {
    const userId: string = socket.data.userId;
    console.log(`🟢 User connected: ${userId} (${socket.id})`);

    // Track active user sockets
    if (!activeUsers.has(userId)) activeUsers.set(userId, new Set());
    activeUsers.get(userId)!.add(socket.id);
    socket.join(userId);
    io.emit("userOnlineStatus", { userId, isOnline: true });

    const typingTimeouts = new Map<string, NodeJS.Timeout>();

    // Typing events (No changes needed)
    socket.on("typing", ({ bookingId }: TypingEvent) => {
      socket.to(bookingId).emit("userTyping", { userId });
      clearTimeout(typingTimeouts.get(bookingId));
      const timeout = setTimeout(() => {
        socket.to(bookingId).emit("userStoppedTyping", { userId });
        typingTimeouts.delete(bookingId);
      }, 3000);
      typingTimeouts.set(bookingId, timeout);
    });

    // Send message (OPTIMIZED: DB write is decoupled)
    socket.on(
      "sendMessage",
      ({ bookingId, receiverId, content, tempId }: SendMessageEvent) => {
        const senderId = userId;

        // 1. IMMEDIATE BROADCAST (Optimistic UI)
        const tempMessage = {
          id: tempId || `temp-${Date.now()}`,
          bookingId,
          senderId,
          receiverId,
          content,
          createdAt: new Date(),
          read: false,
          temp: true,
        };
        io.to(bookingId).emit("newMessage", tempMessage);

        // 2. ASYNCHRONOUS DB WRITE (Fire-and-Forget)
        prisma.message
          .create({
            data: { bookingId, senderId, receiverId, content },
            // Fetch all necessary user details to avoid further DB lookups on client
            include: {
              sender: {
                select: { id: true, name: true, profilePicture: true },
              },
              receiver: {
                select: { id: true, name: true, profilePicture: true },
              },
            },
          })
          .then(async (savedMessage) => {
            // NOTE: Need to import/define 'toPublicUrl' inside this file or pass it from messageController
            // Assuming 'toPublicUrl' is imported/defined globally for this socket context.
            // For now, removing the logic that requires `toPublicUrl` import in `socket.ts`
            // as it makes the replacement logic much slower. Ideally, the client handles the URL conversion
            // or `savedMessage` is emitted with raw paths and the client converts them.

            // The client can infer the sender/receiver profile pictures based on its local user data.
            // To keep this logic clean and fast, we emit the DB-saved message directly.
            io.to(bookingId).emit("replaceTempMessage", {
              tempId,
              message: savedMessage, // Emitting message without public URL conversion
            });

            // 3. Update unread count
            if (receiverId !== senderId) {
              if (!unreadCounts.has(receiverId))
                unreadCounts.set(receiverId, new Map());
              const map = unreadCounts.get(receiverId)!;
              const count = (map.get(bookingId) ?? 0) + 1;
              map.set(bookingId, count);
              io.to(receiverId).emit("updateUnreadCount", { bookingId, count });
            }

            lastSeen.set(senderId, new Date().toISOString());
          })
          .catch((err) => {
            console.error("❌ sendMessage DB error:", err);
            // Emit error to sender if persistence fails
            socket.emit("sendMessageError", {
              error: "Failed to send message",
            });
          });
      }
    );

    // Mark as read (OPTIMIZED: DB update is fire-and-forget)
    socket.on(
      "markMessagesAsRead",
      async ({ bookingId }: { bookingId: string }) => {
        const receiverId = userId;

        // 1. Immediate memory and socket update
        unreadCounts.get(receiverId)?.set(bookingId, 0);
        io.to(receiverId).emit("updateUnreadCount", { bookingId, count: 0 });

        // 2. Fire-and-forget DB update
        prisma.message
          .updateMany({
            where: { bookingId, receiverId, read: false },
            data: { read: true, readAt: new Date() },
          })
          .catch((err) =>
            console.error("❌ markMessagesAsRead DB error:", err)
          );

        lastSeen.set(receiverId, new Date().toISOString());
      }
    );

    // Join booking room (No changes needed)
    socket.on("joinBookingRoom", (bookingId: string) => {
      socket.join(bookingId);
      console.log(`User ${userId} joined room ${bookingId}`);
    });

    // Disconnect (No changes needed)
    socket.on("disconnect", () => {
      const sockets = activeUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeUsers.delete(userId);
          io.emit("userOnlineStatus", { userId, isOnline: false });
          lastSeen.set(userId, new Date().toISOString());
        }
      }
      typingTimeouts.forEach((timeout) => clearTimeout(timeout));
      console.log(`🔴 User disconnected: ${userId} (${socket.id})`);
    });
  });

  return io;
};

export { io };
