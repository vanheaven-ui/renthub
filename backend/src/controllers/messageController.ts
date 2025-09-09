import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { activeUsers, io } from "../socket"; 

const prisma = new PrismaClient();

// GET /messages/:bookingId
export const getBookingMessages = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const messages = await prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, profilePicture: true } },
        receiver: { select: { id: true, name: true, profilePicture: true } },
      },
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// POST /messages
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { bookingId, content, receiverId } = req.body;
    const senderId = (req as any).user.userId;

    const newMessage = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        bookingId,
      },
      include: {
        sender: { select: { id: true, name: true, profilePicture: true } },
      },
    });

    // 1. Broadcast the new message to the booking room
    io.to(bookingId).emit("newMessage", newMessage);

    // 2. Calculate and broadcast the updated unread count to the receiver
    const unreadCount = await prisma.message.count({
      where: {
        bookingId,
        receiverId,
        read: false,
      },
    });

    io.to(bookingId).emit("updateUnreadCount", {
      bookingId,
      count: unreadCount,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

// GET /messages/:bookingId/unread
export const getUnreadMessages = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user.userId;

    const count = await prisma.message.count({
      where: {
        bookingId,
        receiverId: userId,
        read: false,
      },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unread messages" });
  }
};

// PATCH /messages/:bookingId/read
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user.userId;

    await prisma.message.updateMany({
      where: {
        bookingId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

export const getUnreadMessagesBatch = async (req: Request, res: Response) => {
  try {
    const { bookingIds } = req.body; // expect array of booking IDs
    if (!bookingIds || !Array.isArray(bookingIds))
      return res.status(400).json({ error: "bookingIds required" });

    const unreadCounts = await Promise.all(
      bookingIds.map(async (id: string) => {
        const count = await prisma.message.count({
          where: {
            bookingId: id,
            receiverId: (req as any).user.userId,
            read: false,
          },
        });
        return { bookingId: id, unreadCount: count };
      })
    );

    res.json(unreadCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch unread messages" });
  }
};

// GET /online-status/:userId
export const getOnlineStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const isOnline = activeUsers.has(userId);
  res.json({ userId, isOnline });
};
