import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { prisma } from "./lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const activeUsers = new Map<string, Set<string>>();
let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, methods: ["GET", "POST"], credentials: true },
  });

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

    // Add socket to user's active list
    if (!activeUsers.has(userId)) activeUsers.set(userId, new Set());
    activeUsers.get(userId)!.add(socket.id);
    socket.join(userId);
    io.emit("userOnlineStatus", { userId, isOnline: true });

    socket.on("joinBookingRoom", (bookingId: string) => {
      socket.join(bookingId);
    });

    socket.on("typing", ({ bookingId, userId }) => {
      socket.to(bookingId).emit("userTyping", { userId });
    });

    socket.on("stopTyping", ({ bookingId, userId }) => {
      socket.to(bookingId).emit("userStoppedTyping", { userId });
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

          const newMessage = await prisma.message.create({
            data: { content, senderId, receiverId, bookingId },
            include: {
              sender: {
                select: { id: true, name: true, profilePicture: true },
              },
            },
          });

          io.to(bookingId).emit("newMessage", { ...newMessage, tempId });

          // Update unread count for receiver
          if (receiverId !== senderId) {
            const unreadCount = await prisma.message.count({
              where: { bookingId, receiverId, read: false },
            });

            io.to(receiverId).emit("updateUnreadCount", {
              bookingId,
              count: unreadCount,
            });
          }
        } catch (err) {
          console.error("❌ Error sending message:", err);
        }
      }
    );

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
