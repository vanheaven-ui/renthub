import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const activeUsers = new Map<string, string>();
let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, methods: ["GET", "POST"], credentials: true },
  });

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return next(new Error("No cookies found"));
    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.token;
    if (!token) return next(new Error("Authentication error: No token"));

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId} (${socket.id})`);

    activeUsers.set(userId, socket.id);
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
      }) => {
        try {
          const senderId = socket.data.userId;
          const { bookingId, receiverId, content } = data;

          // 1. Save the new message to the database
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

          // 2. Broadcast the message to all clients in the room
          // Use `io.to(bookingId).emit` to send it to the room
          io.to(bookingId).emit("newMessage", newMessage);
        } catch (err) {
          console.error("Error sending message:", err);
        }
      }
    );

    socket.on("disconnect", () => {
      activeUsers.delete(userId);
      io.emit("userOnlineStatus", { userId, isOnline: false });
    });
  });

  return io;
};

export { io };
