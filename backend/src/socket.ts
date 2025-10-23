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
    console.log("⚙️ Initializing Socket.io server with cookie-based auth");
    const userId: string = socket.data.userId;
    console.log(`🟢 User connected: ${userId} (${socket.id})`);

    // Track active user sockets
    if (!activeUsers.has(userId)) activeUsers.set(userId, new Set());
    activeUsers.get(userId)!.add(socket.id);
    socket.join(userId);

    // Emit online with lastSeen null (online now), globally for all clients to catch
    io.emit("userOnlineStatus", { userId, isOnline: true, lastSeen: null });
    lastSeen.set(userId, new Date().toISOString()); // Update on connect too (active)

    const typingTimeouts = new Map<string, NodeJS.Timeout>();

    // Typing - Exclude sender with socket.to(), align event name to 'userStopTyping', add server log
    socket.on("typing", ({ bookingId }: TypingEvent) => {
      console.log(`[SERVER] Typing emit from ${userId} in room ${bookingId}`);
      // Pass bookingId & userId for frontend filters
      socket.to(bookingId).emit("userTyping", { userId, bookingId });

      if (typingTimeouts.has(bookingId))
        clearTimeout(typingTimeouts.get(bookingId)!);
      const timeout = setTimeout(() => {
        socket.to(bookingId).emit("userStopTyping", { userId, bookingId });
        typingTimeouts.delete(bookingId);
        console.log(`[SERVER] Auto-stop typing for ${userId} in ${bookingId}`);
      }, 2000); // Align to 2s
      typingTimeouts.set(bookingId, timeout);
    });

    // NEW: Also listen for explicit stopTyping (from frontend on send/blur)
    socket.on("stopTyping", ({ bookingId }: TypingEvent) => {
      if (typingTimeouts.has(bookingId)) {
        clearTimeout(typingTimeouts.get(bookingId)!);
        typingTimeouts.delete(bookingId);
      }
      socket.to(bookingId).emit("userStopTyping", { userId, bookingId });
      console.log(
        `[SERVER] Explicit stopTyping from ${userId} in ${bookingId}`
      );
    });

    // Send message - Exclude sender for newMessage/replace, align event if needed (assume frontend 'sendMessageSocket' → rename or map), add unread reset for sender, server logs
    socket.on(
      "sendMessageSocket",
      ({ bookingId, receiverId, content, tempId }: SendMessageEvent) => {
        // Listen for 'sendMessageSocket' (match frontend)
        const senderId = userId;

        // 1. IMMEDIATE BROADCAST (Optimistic UI) - Exclude sender (they have local optimistic)
        // Quick sender lookup for temp (non-blocking, cache if needed)
        // For now, keep placeholder; full populates below
        const tempMessage = {
          id: tempId || `temp-${Date.now()}`,
          bookingId, // Ensure present
          senderId,
          receiverId,
          content,
          createdAt: new Date().toISOString(), // ISO for frontend Date parsing
          updatedAt: new Date().toISOString(),
          read: false,
          readAt: null,
          delivered: false, // For UI checks
          sender: { id: senderId, name: "You", profilePicture: "" }, // Better placeholder
          temp: true,
        };
        socket.to(bookingId).emit("newMessage", tempMessage); // socket.to() excludes sender
        console.log(
          `[SERVER] Broadcast temp newMessage to room ${bookingId} (excl. ${senderId})`
        );

        // Immediate unread bump for receiver, reset for sender
        if (receiverId !== senderId) {
          if (!unreadCounts.has(receiverId))
            unreadCounts.set(receiverId, new Map());
          const receiverMap = unreadCounts.get(receiverId)!;
          const receiverCount = (receiverMap.get(bookingId) ?? 0) + 1;
          receiverMap.set(bookingId, receiverCount);
          io.to(receiverId).emit("updateUnreadCount", {
            bookingId,
            count: receiverCount,
          });

          // Reset sender unread to 0 immediately
          if (!unreadCounts.has(senderId))
            unreadCounts.set(senderId, new Map());
          const senderMap = unreadCounts.get(senderId)!;
          senderMap.set(bookingId, 0);
          socket.emit("updateUnreadCount", { bookingId, count: 0 });
        }

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
            // Populate sender/receiver for full MessageWithDelivered
            const fullMessage = {
              ...savedMessage,
              createdAt: savedMessage.createdAt.toISOString(),
              updatedAt: savedMessage.updatedAt.toISOString(),
              readAt: savedMessage.readAt?.toISOString() || null,
              sender: savedMessage.sender, // Now populated
              receiver: savedMessage.receiver, // For completeness
              delivered: true, // Assume delivered on save
              temp: false, // Mark as non-temp
              bookingId, // Ensure
            };
            console.log(
              `[SERVER] DB saved message ${savedMessage.id}, broadcasting replace to room ${bookingId}`
            );

            // Pass bookingId in payload for frontend filter
            const replacePayload = { tempId, message: fullMessage };
            // Replace temp for receiver (sender can handle locally if needed)
            socket.to(bookingId).emit("replaceTempMessage", replacePayload);
            // Optional: Confirm to sender too (they replace optimistic)
            socket.emit("replaceTempMessage", replacePayload);

            lastSeen.set(senderId, new Date().toISOString());
          })
          .catch((err) => {
            console.error("❌ sendMessage DB error:", err);
            // Emit error to sender if persistence fails
            socket.emit("sendMessageError", {
              error: "Failed to send message",
              tempId,
            });
            // Optional: Rollback temp on receiver if error
            socket.to(bookingId).emit("removeTempMessage", { tempId });
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
          .then((result) => {
            console.log(
              `[SERVER] Marked ${result.count} messages as read for ${receiverId} in ${bookingId}`
            );
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
      console.log(`[SERVER] User ${userId} joined room ${bookingId}`);

      // Emit current status for OTHER user in this booking? But since 1:1, emit own to room (receiver catches)
      // Better: Emit global own status again on join (refreshes late listeners)
      io.emit("userOnlineStatus", { userId, isOnline: true, lastSeen: null });
    });

    // Disconnect (No changes needed, but add lastSeen emit)
    socket.on("disconnect", () => {
      const sockets = activeUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeUsers.delete(userId);
          // Emit offline with lastSeen
          const disconnectTime = new Date().toISOString();
          lastSeen.set(userId, disconnectTime);
          io.emit("userOnlineStatus", {
            userId,
            isOnline: false,
            lastSeen: disconnectTime,
          });
          console.log(
            `[SERVER] All sockets for ${userId} gone, emitted offline at ${disconnectTime}`
          );
        }
      }
      typingTimeouts.forEach((timeout) => clearTimeout(timeout));
      typingTimeouts.clear();
      console.log(`🔴 User disconnected: ${userId} (${socket.id})`);
    });
  });

  return io;
};

export { io };
