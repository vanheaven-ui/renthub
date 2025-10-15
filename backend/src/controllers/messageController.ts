import { Request, Response } from "express";
import { activeUsers, io, unreadCounts } from "../socket";
import { prisma } from "../lib/prisma";

// --- Fetch messages
export const getBookingMessages = async (req: Request, res: Response) => {
  console.log("HIT THIS PLACE NOW: GET BOOKING MESSAGES HTTP");
  try {
    const { bookingId } = req.params;
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
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

    res.json({
      messages,
      hasMore: skip + messages.length < totalMessages,
      nextPage: page + 1,
    });
  } catch (err) {
    console.error("❌ getBookingMessages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// --- Send message (HTTP fallback)
export const sendMessage = async (req: Request, res: Response) => {

  console.log("HIT THIS PACE NOW: SEND MESSAGE HTTP");
  try {
    const { bookingId, receiverId, content, tempId } = req.body;
    const senderId = (req as any).user.userId;

    if (!bookingId || !receiverId || !content)
      return res.status(400).json({ error: "Missing fields" });

    // Emit via socket immediately
    io.to(bookingId).emit("newMessage", {
      id: tempId || `temp-${Date.now()}`,
      bookingId,
      senderId,
      receiverId,
      content,
      createdAt: new Date(),
      read: false,
      temp: true,
    });

    // Async DB write
    const savedMessage = await prisma.message.create({
      data: { bookingId, senderId, receiverId, content },
      include: {
        sender: { select: { id: true, name: true, profilePicture: true } },
        receiver: { select: { id: true, name: true, profilePicture: true } },
      },
    });

    io.to(bookingId).emit("replaceTempMessage", {
      tempId,
      message: savedMessage,
    });

    // Update unread counts
    if (receiverId !== senderId) {
      if (!unreadCounts.has(receiverId))
        unreadCounts.set(receiverId, new Map());
      const count = (unreadCounts.get(receiverId)!.get(bookingId) ?? 0) + 1;
      unreadCounts.get(receiverId)!.set(bookingId, count);
      io.to(receiverId).emit("updateUnreadCount", { bookingId, count });
    }

    res.status(201).json({ success: true, tempId });
  } catch (err) {
    console.error("❌ sendMessage HTTP error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// --- Get unread count
export const getUnreadMessages = (req: Request, res: Response) => {
  console.log("HIT THIS PLACE NOW: GET UNREAD MESSAGES HTTP");
  const { bookingId } = req.params;
  const userId = (req as any).user.userId;
  const count = unreadCounts.get(userId)?.get(bookingId) ?? 0;
  res.json({ bookingId, unreadCount: count });
};

// --- Batch unread counts
export const getUnreadMessagesBatch = (req: Request, res: Response) => {
  const { bookingIds } = req.body;
  const userId = (req as any).user.userId;
  const bookingMap = unreadCounts.get(userId) ?? new Map();
  const counts = bookingIds.map((id: string) => ({
    bookingId: id,
    unreadCount: bookingMap.get(id) ?? 0,
  }));
  res.json(counts);
};

// --- Mark messages as read
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user.userId;

    unreadCounts.get(userId)?.set(bookingId, 0);
    io.to(userId).emit("updateUnreadCount", { bookingId, count: 0 });

    prisma.message
      .updateMany({
        where: { bookingId, receiverId: userId, read: false },
        data: { read: true, readAt: new Date() },
      })
      .catch((err) => console.error("❌ markMessagesAsRead DB error:", err));

    res.json({ success: true });
  } catch (err) {
    console.error("❌ markMessagesAsRead error:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

export const getOnlineStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const isOnline = activeUsers.has(userId);
    res.json({ userId, isOnline });
  } catch (err) {
    console.error("❌ getOnlineStatus error:", err);
    res.status(500).json({ error: "Failed to fetch online status" });
  }
};
