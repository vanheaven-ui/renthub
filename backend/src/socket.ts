import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { prisma } from "./lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Active users map: userId => set of socketIds
export const activeUsers = new Map<string, Set<string>>();

// In-memory unread message counts: receiverId => (bookingId => count)
const unreadCounts = new Map<string, Map<string, number>>();

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, methods: ["GET", "POST"], credentials: true },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return next(new Error("No cookies found"));

    const cookieParser = require("cookie-parser")();
    const req = { headers: { cookie: cookies } } as any;
    const res = { getHeader: () => {}, setHeader: () => {} } as any;

    cookieParser(req, res, () => {
      const token = req.signedCookies?.token || req.cookies?.token;
      if (!token) return next(new Error("Authentication error: No token"));

      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        socket.data.userId = decoded.userId;
        next();
      } catch {
        next(new Error("Authentication error: Invalid token"));
      }
    });
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`🟢 User connected: ${userId} (${socket.id})`);

    // Track active sockets
    if (!activeUsers.has(userId)) activeUsers.set(userId, new Set());
    activeUsers.get(userId)!.add(socket.id);
    socket.join(userId);
    io.emit("userOnlineStatus", { userId, isOnline: true });

    // -----------------------------
    // Socket Event Handlers
    // -----------------------------

    socket.on("joinBookingRoom", (bookingId: string) => {
      socket.join(bookingId);
    });

    // Debounced typing events
    let typingTimeout: NodeJS.Timeout;
    socket.on("typing", ({ bookingId, userId: typingUserId }) => {
      socket.to(bookingId).emit("userTyping", { userId: typingUserId });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket
          .to(bookingId)
          .emit("userStoppedTyping", { userId: typingUserId });
      }, 3000);
    });

    socket.on(
      "sendMessage",
      async ({
        bookingId,
        receiverId,
        content,
        tempId,
      }: {
        bookingId: string;
        receiverId: string;
        content: string;
        tempId?: string;
      }) => {
        try {
          const senderId = socket.data.userId;

          // Create message in DB
          const newMessage = await prisma.message.create({
            data: { content, senderId, receiverId, bookingId },
            include: {
              sender: {
                select: { id: true, name: true, profilePicture: true },
              },
            },
          });

          // Emit message to booking room
          io.to(bookingId).emit("newMessage", { ...newMessage, tempId });

          // -----------------------------
          // Update in-memory unread counter
          // -----------------------------
          if (receiverId !== senderId) {
            if (!unreadCounts.has(receiverId))
              unreadCounts.set(receiverId, new Map());
            const bookingCounts = unreadCounts.get(receiverId)!;
            bookingCounts.set(
              bookingId,
              (bookingCounts.get(bookingId) ?? 0) + 1
            );

            io.to(receiverId).emit("updateUnreadCount", {
              bookingId,
              count: bookingCounts.get(bookingId),
            });
          }
        } catch (err) {
          console.error("❌ Error sending message:", err);
          socket.emit("sendMessageError", { error: "Failed to send message" });
        }
      }
    );

    socket.on("markMessagesAsRead", async ({ bookingId }) => {
      const receiverId = socket.data.userId;

      try {
        // Reset in-memory counter
        if (unreadCounts.has(receiverId)) {
          const bookingCounts = unreadCounts.get(receiverId)!;
          bookingCounts.set(bookingId, 0);
        }

        // Optionally update DB in background
        await prisma.message.updateMany({
          where: { bookingId, receiverId, read: false },
          data: { read: true, readAt: new Date() },
        });

        io.to(receiverId).emit("updateUnreadCount", { bookingId, count: 0 });
      } catch (err) {
        console.error("❌ Error marking messages as read:", err);
      }
    });

    socket.on("disconnect", () => {
      const userSockets = activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUsers.delete(userId);
          io.emit("userOnlineStatus", { userId, isOnline: false });
        }
      }
    });
  });

  return io;
};

export { io };
