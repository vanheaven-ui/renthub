import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// A map to track active users: userId -> socket.id
export const activeUsers = new Map<string, string>();
let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: FRONTEND_URL,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // 1. Socket.IO Middleware for Authentication
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

        // Add user to the active users map and broadcast online status
        activeUsers.set(userId, socket.id);
        io.emit("userOnlineStatus", { userId, isOnline: true });

        // 2. Join a Booking Room
        socket.on("joinBookingRoom", (bookingId: string) => {
            socket.join(bookingId);
            console.log(`User ${userId} joined room: ${bookingId}`);
        });

        // 3. Typing and Stop Typing Events
        socket.on("typing", (data: { bookingId: string; userId: string }) => {
            // Broadcast to all other clients in the booking room
            socket.to(data.bookingId).emit("userTyping", { userId: data.userId });
        });

        socket.on("stopTyping", (data: { bookingId: string; userId: string }) => {
            // Broadcast to all other clients in the booking room
            socket.to(data.bookingId).emit("userStoppedTyping", { userId: data.userId });
        });

        // 4. Removed "sendMessage" Listener
        // The `sendMessage` logic is moved to the REST API (`POST /api/messages`)
        // to ensure database persistence before broadcasting.

        // 5. Handle Disconnection and Broadcast Offline Status
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${userId} (${socket.id})`);
            activeUsers.delete(userId);
            io.emit("userOnlineStatus", { userId, isOnline: false });
        });
    });

    return io;
};

// Export the io instance for use in other parts of the application
export { io };