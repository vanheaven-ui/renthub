import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { prisma } from "./lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "token";

// Maps to track users and their sockets
export const activeUsers = new Map<string, Set<string>>(); // userId => socketIds
export const unreadCounts = new Map<string, Map<string, number>>(); // userId => bookingId => count
export const lastSeen = new Map<string, string>(); // userId => ISO string

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

// Helper to emit online status only to the other participant of a booking
const sendOnlineStatusToBooking = async (
  bookingId: string,
  currentUserId: string,
  isOnline: boolean
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { ownerId: true, renterId: true },
  });
  if (!booking) return;

  const otherUserId =
    booking.ownerId === currentUserId ? booking.renterId : booking.ownerId;

  io.to(otherUserId).emit("userOnlineStatus", {
    userId: currentUserId,
    isOnline,
    lastSeen: isOnline ? null : new Date().toISOString(),
  });
};

export const initSocket = (httpServer: HttpServer): Server => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL,
      credentials: true,
    },
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log("⚙️ Socket.IO initialized with origin:", FRONTEND_URL);

  // --- Authentication Middleware
  io.use((socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie
        ? cookie.parse(socket.handshake.headers.cookie)
        : {};
      const token = cookies[COOKIE_NAME];

      if (!token) return next(new Error("Authentication error: No token"));

      const decoded: any = jwt.verify(token, JWT_SECRET);
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      console.error("[SOCKET] Auth error:", err);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId: string = socket.data.userId;
    console.log(`🟢 User connected: ${userId} (socket ${socket.id})`);

    // Track user sockets
    if (!activeUsers.has(userId)) activeUsers.set(userId, new Set());
    activeUsers.get(userId)!.add(socket.id);
    socket.join(userId);

    // --- Typing Events
    const typingTimeouts = new Map<string, NodeJS.Timeout>();

    socket.on("typing", ({ bookingId }: TypingEvent) => {
      if (!bookingId) return;
      socket.to(bookingId).emit("userTyping", { userId, bookingId });

      if (typingTimeouts.has(bookingId))
        clearTimeout(typingTimeouts.get(bookingId)!);
      const timeout = setTimeout(() => {
        socket.to(bookingId).emit("userStopTyping", { userId, bookingId });
        typingTimeouts.delete(bookingId);
      }, 2000);
      typingTimeouts.set(bookingId, timeout);
    });

    socket.on("stopTyping", ({ bookingId }: TypingEvent) => {
      if (!bookingId) return;
      if (typingTimeouts.has(bookingId)) {
        clearTimeout(typingTimeouts.get(bookingId)!);
        typingTimeouts.delete(bookingId);
      }
      socket.to(bookingId).emit("userStopTyping", { userId, bookingId });
    });

    // --- Send Message
    socket.on(
      "sendMessageSocket",
      async ({ bookingId, receiverId, content, tempId }: SendMessageEvent) => {
        if (!bookingId || !receiverId || !content) return;

        const senderId = userId;

        try {
          // Persist message
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

          const fullMessage = {
            ...savedMessage,
            createdAt: savedMessage.createdAt.toISOString(),
            updatedAt: savedMessage.updatedAt.toISOString(),
            readAt: savedMessage.readAt?.toISOString() || null,
            delivered: true,
            temp: false,
          };

          // Emit replace to sender only
          socket.emit("replaceTempMessage", {
            tempId: tempId || savedMessage.id,
            message: fullMessage,
          });
          // Emit full message to receivers only
          socket.to(bookingId).emit("newMessage", fullMessage);

          // Update unread counts
          if (receiverId !== senderId) {
            if (!unreadCounts.has(receiverId))
              unreadCounts.set(receiverId, new Map());
            const count =
              (unreadCounts.get(receiverId)!.get(bookingId) ?? 0) + 1;
            unreadCounts.get(receiverId)!.set(bookingId, count);
            io.to(receiverId).emit("updateUnreadCount", { bookingId, count });
          }

          lastSeen.set(senderId, new Date().toISOString());
        } catch (err) {
          console.error("❌ Message DB error:", err);
          socket.emit("sendMessageError", {
            error: "Failed to save message",
            tempId,
          });
        }
      }
    );

    // --- Mark Messages Read
    socket.on(
      "markMessagesAsRead",
      async ({ bookingId }: { bookingId: string }) => {
        if (!bookingId) return;

        const receiverId = userId;
        unreadCounts.get(receiverId)?.set(bookingId, 0);
        io.to(receiverId).emit("updateUnreadCount", { bookingId, count: 0 });

        try {
          const result = await prisma.message.updateMany({
            where: { bookingId, receiverId, read: false },
            data: { read: true, readAt: new Date() },
          });
          console.log(`[SERVER] ${result.count} messages marked as read`);
        } catch (err) {
          console.error("❌ markMessagesAsRead DB error:", err);
        }
        lastSeen.set(receiverId, new Date().toISOString());
      }
    );

    // --- Join Booking Room
    socket.on("joinBookingRoom", async (bookingId: string) => {
      if (!bookingId) return;
      socket.join(bookingId);
      console.log(`[SERVER] ${userId} joined ${bookingId}`);

      // Send online status to the other participant only
      await sendOnlineStatusToBooking(bookingId, userId, true);
    });

    // --- Disconnect
    socket.on("disconnect", async () => {
      const sockets = activeUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeUsers.delete(userId);
          const disconnectTime = new Date().toISOString();
          lastSeen.set(userId, disconnectTime);

          // Notify all bookings this user was part of
          const bookings = await prisma.booking.findMany({
            where: {
              OR: [{ ownerId: userId }, { renterId: userId }],
            },
            select: { id: true, ownerId: true, renterId: true },
          });

          for (const b of bookings) {
            const otherUserId = b.ownerId === userId ? b.renterId : b.ownerId;
            io.to(otherUserId).emit("userOnlineStatus", {
              userId,
              isOnline: false,
              lastSeen: disconnectTime,
            });
          }
        }
      }

      typingTimeouts.forEach((timeout) => clearTimeout(timeout));
      typingTimeouts.clear();
      console.log(`🔴 User disconnected: ${userId} (${socket.id})`);
    });
  });

  io.engine.on("connection_error", (err) => {
    console.error("⚠️ Socket engine connection error:", err);
  });

  return io;
};

export { io };
