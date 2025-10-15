import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { prisma } from "./lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// --- Active users: userId => set of socketIds
export const activeUsers = new Map<string, Set<string>>();

// --- Unread counts cache: userId => (bookingId => count)
export const unreadCounts = new Map<string, Map<string, number>>();

// --- Last seen: userId => ISO string
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
    cors: { origin: FRONTEND_URL, methods: ["GET", "POST"], credentials: true },
  });

  // --- Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: No token"));
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId: string = socket.data.userId;
    console.log(`🟢 User connected: ${userId} (${socket.id})`);

    // --- Track active sockets
    if (!activeUsers.has(userId)) activeUsers.set(userId, new Set());
    activeUsers.get(userId)!.add(socket.id);
    socket.join(userId);
    io.emit("userOnlineStatus", { userId, isOnline: true });

    // --- Typing timeouts per user per booking
    const typingTimeouts = new Map<string, NodeJS.Timeout>();

    socket.on("typing", ({ bookingId }: TypingEvent) => {
      socket.to(bookingId).emit("userTyping", { userId });
      clearTimeout(typingTimeouts.get(bookingId));
      const timeout = setTimeout(() => {
        socket.to(bookingId).emit("userStoppedTyping", { userId });
        typingTimeouts.delete(bookingId);
      }, 3000);
      typingTimeouts.set(bookingId, timeout);
    });

    // --- Send message (socket)
    socket.on(
      "sendMessage",
      async ({ bookingId, receiverId, content, tempId }: SendMessageEvent) => {
        const senderId = userId;

        // --- Rate limiting: 5 messages per second per socket
        const RATE_LIMIT = 5;
        if (!socket.data.lastMessages) socket.data.lastMessages = [];
        const now = Date.now();
        socket.data.lastMessages = socket.data.lastMessages.filter(
          (ts: number) => now - ts < 1000
        );
        if (socket.data.lastMessages.length >= RATE_LIMIT) {
          return socket.emit("sendMessageError", {
            error: "Rate limit exceeded",
          });
        }
        socket.data.lastMessages.push(now);

        // --- Emit temp message immediately
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

        // --- Async DB write
        try {
          const savedMessage = await prisma.message.create({
            data: { bookingId, senderId, receiverId, content },
            include: {
              sender: {
                select: { id: true, name: true, profilePicture: true },
              },
              receiver: {
                select: { id: true, name: true, profilePicture: true },
              },
            },
          });

          // Replace temp message with saved message
          io.to(bookingId).emit("replaceTempMessage", {
            tempId,
            message: savedMessage,
          });

          // --- Update unread counts
          if (receiverId !== senderId) {
            if (!unreadCounts.has(receiverId))
              unreadCounts.set(receiverId, new Map());
            const bookingMap = unreadCounts.get(receiverId)!;
            const count = (bookingMap.get(bookingId) ?? 0) + 1;
            bookingMap.set(bookingId, count);
            io.to(receiverId).emit("updateUnreadCount", { bookingId, count });
          }

          // --- Update last seen for sender
          lastSeen.set(senderId, new Date().toISOString());
        } catch (err) {
          console.error("❌ Socket sendMessage DB error:", err);
          socket.emit("sendMessageError", { error: "Failed to send message" });
        }
      }
    );

    // --- Mark messages as read
    socket.on(
      "markMessagesAsRead",
      async ({ bookingId }: { bookingId: string }) => {
        const receiverId = userId;

        // Reset in-memory count
        unreadCounts.get(receiverId)?.set(bookingId, 0);
        io.to(receiverId).emit("updateUnreadCount", { bookingId, count: 0 });

        // Async DB update
        prisma.message
          .updateMany({
            where: { bookingId, receiverId, read: false },
            data: { read: true, readAt: new Date() },
          })
          .catch((err) =>
            console.error("❌ markMessagesAsRead DB error:", err)
          );

        // Update last seen
        lastSeen.set(receiverId, new Date().toISOString());
      }
    );

    // --- Join booking room
    socket.on("joinBookingRoom", (bookingId: string) => socket.join(bookingId));

    // --- Disconnect
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
    });
  });

  return io;
};

export { io };
