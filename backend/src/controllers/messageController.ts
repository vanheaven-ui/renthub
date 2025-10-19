import { Request, Response } from "express";
import { activeUsers, io, unreadCounts } from "../socket";
import { prisma } from "../lib/prisma";
import { supabase, supabaseBucket } from "../config/supabase";

/**
 * Helper to convert file paths to public URLs
 * NOTE: For optimal performance, ensure this uses a hardcoded BASE_URL
 * instead of making an API call to supabase for every message.
 */
const toPublicUrl = (filePath?: string | null) => {
  if (!filePath) return null;
  // Assuming supabase.storage.getPublicUrl is fast/cached on the server,
  // but a hardcoded base URL is better if available.
  const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(filePath);
  return data.publicUrl;
};

// --- Fetch messages (Optimized for Cursor Pagination)
export const getBookingMessages = async (req: Request, res: Response) => {
  console.log("HIT THIS PLACE NOW: GET BOOKING MESSAGES HTTP");
  try {
    const { bookingId } = req.params;
    // Use a much larger limit for fast chat loading, capped at 100
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    // Fetch N+1 messages in DESC order (latest first)
    const messages = await prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      include: {
        sender: { select: { id: true, name: true, profilePicture: true } },
        receiver: { select: { id: true, name: true, profilePicture: true } },
      },
    });

    // Determine if there are more messages
    const hasMore = messages.length > limit;
    const messagesToSend = hasMore ? messages.slice(0, limit) : messages;

    // Reverse the order back to 'asc' for client display (oldest first)
    messagesToSend.reverse();

    // Convert profile pictures to public URLs
    const messagesWithPublicPics = messagesToSend.map((msg) => ({
      ...msg,
      sender: {
        ...msg.sender,
        profilePicture: toPublicUrl(msg.sender.profilePicture),
      },
      receiver: {
        ...msg.receiver,
        profilePicture: toPublicUrl(msg.receiver.profilePicture),
      },
    }));

    res.json({
      messages: messagesWithPublicPics,
      hasMore,
      // The cursor for the next page is the ID of the oldest message sent in this batch
      nextCursor: hasMore ? messages[limit].id : null,
    });
  } catch (err) {
    console.error("❌ getBookingMessages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// --- Send message (HTTP fallback - logic maintained, only logs removed)
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { bookingId, receiverId, content, tempId } = req.body;
    const senderId = (req as any).user.userId;

    if (!bookingId || !receiverId || !content)
      return res.status(400).json({ error: "Missing fields" });

    // Emit via socket immediately (Optimistic UI)
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

    // Async DB write (must await here for the HTTP response to get the final message object)
    const savedMessage = await prisma.message.create({
      data: { bookingId, senderId, receiverId, content },
      include: {
        sender: { select: { id: true, name: true, profilePicture: true } },
        receiver: { select: { id: true, name: true, profilePicture: true } },
      },
    });

    // Convert profile pictures to public URLs
    (savedMessage.sender as any).profilePicture = toPublicUrl(
      savedMessage.sender.profilePicture
    );
    (savedMessage.receiver as any).profilePicture = toPublicUrl(
      savedMessage.receiver.profilePicture
    );

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

// --- Get unread count (logs removed)
export const getUnreadMessages = (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const userId = (req as any).user.userId;
  const count = unreadCounts.get(userId)?.get(bookingId) ?? 0;
  res.json({ bookingId, unreadCount: count });
};

// --- Batch unread counts (logs removed)
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

// --- Mark messages as read (DB update is now fire-and-forget)
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user.userId;

    // Immediate memory and socket update
    unreadCounts.get(userId)?.set(bookingId, 0);
    io.to(userId).emit("updateUnreadCount", { bookingId, count: 0 });

    // Fire-and-forget DB update
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

// --- Get online status (logs removed)
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
