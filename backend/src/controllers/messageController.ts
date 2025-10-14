import { Request, Response } from "express";
import { activeUsers, io } from "../socket";
import { prisma } from "../lib/prisma";

// -----------------------------
// Types
// -----------------------------
interface User {
  id: string;
  name?: string | null;
  profilePicture?: string | null;
}

interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  receiverId?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  read: boolean;
  readAt?: Date | null;

  sender?: User;
  receiver?: User;
}

interface PaginatedMessages {
  messages: Message[];
  hasMore: boolean;
  nextPage: number;
}

// -----------------------------
// GET /messages/:bookingId
// -----------------------------
export const getBookingMessages = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId)
      return res.status(400).json({ error: "bookingId is required" });

    const page = Number(req.query.page ?? "1");
    const limit = Number(req.query.limit ?? "20");
    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, name: true, profilePicture: true } },
        receiver: { select: { id: true, name: true, profilePicture: true } },
      },
    });

    const totalMessages = await prisma.message.count({ where: { bookingId } });

    const response: PaginatedMessages = {
      messages,
      hasMore: skip + messages.length < totalMessages,
      nextPage: page + 1,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// -----------------------------------------------
// POST MESSAGES
// -----------------------------------------------
// -----------------------------------------------
// POST MESSAGES
// -----------------------------------------------
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { bookingId, content, receiverId, tempId } = req.body;
    const senderId = (req as any).user.userId; // Validate required fields (Your validation is correct based on the schema)

    if (!bookingId || !content || !receiverId) {
      return res.status(400).json({
        error: "bookingId, content, and receiverId are required",
      });
    } // Create message in DB

    const newMessage = await prisma.message.create({
      data: {
        content,
        sender: { connect: { id: senderId } },
        receiver: { connect: { id: receiverId } },
        booking: { connect: { id: bookingId } },
      },
      include: {
        sender: { select: { id: true, name: true, profilePicture: true } },
        receiver: { select: { id: true, name: true, profilePicture: true } },
      },
    }); // 1. Emit via Socket.IO to the booking room (for ALL clients in the room) // This includes the tempId to allow the initiating client to find and replace the temp message

    io.to(bookingId).emit("newMessage", { ...newMessage, tempId }); // 2. Update unread count for receiver (correct)

    if (receiverId !== senderId) {
      const unreadCount = await prisma.message.count({
        where: { bookingId, receiverId, read: false },
      });
      io.to(receiverId).emit("updateUnreadCount", {
        bookingId,
        count: unreadCount,
      });
    }

    // 3. Send HTTP Response back to the INITIATING client.
    // FIX: Include the tempId here so the initiating client's TanStack Query mutation
    // has all the data it needs for success handling.
    res.status(201).json({ ...newMessage, tempId });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// -----------------------------
// PATCH /messages/:bookingId/read
// -----------------------------
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user.userId;
    if (!bookingId)
      return res.status(400).json({ error: "bookingId is required" });

    const updated = await prisma.message.updateMany({
      where: { bookingId, receiverId: userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    if (updated.count > 0) {
      io.to(userId).emit("updateUnreadCount", { bookingId, count: 0 });

      const readMessages = await prisma.message.findMany({
        where: { bookingId, receiverId: userId, read: true },
        select: { id: true, senderId: true, readAt: true },
      });

      readMessages.forEach((msg) => {
        io.to(msg.senderId).emit("messageRead", {
          messageId: msg.id,
          bookingId,
          readAt: msg.readAt,
        });
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

// -----------------------------
// GET /messages/:bookingId/unread
// -----------------------------
export const getUnreadMessages = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user.userId;
    if (!bookingId)
      return res.status(400).json({ error: "bookingId is required" });

    const unreadCount = await prisma.message.count({
      where: { bookingId, receiverId: userId, read: false },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    res.status(500).json({ error: "Failed to fetch unread messages" });
  }
};

// -----------------------------
// POST /messages/unread/batch
// -----------------------------
export const getUnreadMessagesBatch = async (req: Request, res: Response) => {
  try {
    const { bookingIds } = req.body;
    if (!bookingIds || !Array.isArray(bookingIds))
      return res.status(400).json({ error: "bookingIds required" });

    const userId = (req as any).user.userId;

    const counts = await Promise.all(
      bookingIds.map(async (id: string) => {
        const unreadCount = await prisma.message.count({
          where: { bookingId: id, receiverId: userId, read: false },
        });
        return { bookingId: id, unreadCount };
      })
    );

    res.json(counts);
  } catch (error) {
    console.error("Error fetching unread messages batch:", error);
    res.status(500).json({ error: "Failed to fetch unread messages" });
  }
};

// -----------------------------
// GET /online-status/:userId
// -----------------------------
export const getOnlineStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const isOnline = activeUsers.has(userId);
  res.json({ userId, isOnline });
};
