import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
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

    // Use cookie-parser logic (assuming cookieParser middleware parses cookies into req.signedCookies or req.cookies)
    // Since cookie-parser is applied in server.ts, we parse manually here for Socket.IO
    const cookieParser = require("cookie-parser")();
    const req = { headers: { cookie: cookies } } as any;
    const res = { getHeader: () => {}, setHeader: () => {} } as any;

    cookieParser(req, res, () => {
      const token = req.signedCookies?.token || req.cookies?.token; // Check both signed and unsigned cookies
      if (!token) return next(new Error("Authentication error: No token"));

      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        socket.data.userId = decoded.userId;
        next();
      } catch (err) {
        next(new Error("Authentication error: Invalid token"));
      }
    });
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId} (${socket.id})`);

    // Add socket to user's set
    if (!activeUsers.has(userId)) activeUsers.set(userId, new Set());
    activeUsers.get(userId)!.add(socket.id);
    socket.join(userId); // Join personal room for user-specific events
    io.emit("userOnlineStatus", { userId, isOnline: true });

    socket.on("joinBookingRoom", (bookingId: string) => {
      socket.join(bookingId);
    });

    socket.on("typing", (data: { bookingId: string; userId: string }) => {
      socket.to(data.bookingId).emit("userTyping", { userId: data.userId });
    });

    socket.on("stopTyping", (data: { bookingId: string; userId: string }) => {
      socket
        .to(data.bookingId)
        .emit("userStoppedTyping", { userId: data.userId });
    });

    socket.on(
      "sendMessage",
      async (data: {
        bookingId: string;
        receiverId: string;
        content: string;
        tempId?: string;
      }) => {
        try {
          const senderId = socket.data.userId;
          const { bookingId, receiverId, content, tempId } = data;

          // Save message to DB
          const newMessage = await prisma.message.create({
            data: {
              content,
              senderId,
              receiverId,
              bookingId,
            },
            include: {
              sender: {
                select: { id: true, name: true, profilePicture: true },
              },
            },
          });

          // Emit message with tempId if provided
          io.to(bookingId).emit("newMessage", { ...newMessage, tempId });

          // Update unread count for receiver
          if (receiverId !== senderId) {
            const unreadCount = await prisma.message.count({
              where: {
                bookingId,
                receiverId,
                read: false,
              },
            });
            io.to(receiverId).emit("updateUnreadCount", {
              bookingId,
              count: unreadCount,
            });
          }
        } catch (err) {
          console.error("Error sending message:", err);
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
