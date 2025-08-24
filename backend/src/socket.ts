import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // New: User joins a specific booking room
    socket.on("joinBookingRoom", (bookingId: string) => {
      socket.join(bookingId);
      console.log(`User ${socket.id} joined room: ${bookingId}`);
    });

    socket.on(
      "sendMessage",
      async (messagePayload: {
        senderId: string;
        bookingId: string;
        content: string;
      }) => {
        try {
          const booking = await prisma.booking.findUnique({
            where: { id: messagePayload.bookingId },
            include: {
              owner: {
                select: { id: true },
              },
              renter: {
                select: { id: true },
              },
            },
          });

          if (!booking) {
            console.error("Booking not found.");
            return;
          }

          const receiverId =
            booking.ownerId === messagePayload.senderId
              ? booking.renterId
              : booking.ownerId;

          const savedMessage = await prisma.message.create({
            data: {
              content: messagePayload.content,
              senderId: messagePayload.senderId,
              receiverId: receiverId, // Store the receiver ID for historical context
              bookingId: messagePayload.bookingId,
            },
          });

          // Broadcast the message to all clients in the specific booking room
          io.to(messagePayload.bookingId).emit("receiveMessage", savedMessage);
        } catch (error) {
          console.error("Error saving or broadcasting message:", error);
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};
