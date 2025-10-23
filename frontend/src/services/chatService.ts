import { socket } from "@/lib/socket";
import {
  Message,
  SendMessagePayload,
  UnreadCount,
  MessageWithDelivered,
} from "@/types";

export interface NewMessagePayload extends Message {
  tempId?: string;
}

interface TypingPayload {
  bookingId: string;
  userId: string;
}

interface UserOnlineStatusPayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface ReplaceTempMessagePayload {
  tempId: string;
  message: MessageWithDelivered;
}

const joinedRooms = new Set<string>();

// ---------------------------
// Safe emit helper
// ---------------------------
const emitSafe = <T = unknown>(event: string, payload?: T): void => {
  if (socket.connected) {
    socket.emit(event, payload);
  } else {
    console.warn(`[SOCKET] Tried to emit "${event}" but socket not connected`);
  }
};

// ---------------------------
// Room management
// ---------------------------
export const joinBookingRoom = (bookingId: string) => {
  if (!joinedRooms.has(bookingId)) {
    emitSafe("joinBookingRoom", bookingId);
    joinedRooms.add(bookingId);
  }
};

export const leaveBookingRoom = (bookingId: string) => {
  if (joinedRooms.has(bookingId)) {
    emitSafe("leaveRoom", bookingId);
    joinedRooms.delete(bookingId);
  }
};

// ---------------------------
// Messaging
// ---------------------------
export const sendMessageSocket = (
  payload: SendMessagePayload & { tempId?: string }
) => {
  emitSafe("sendMessageSocket", payload); // match backend event
};

export const emitTyping = (payload: TypingPayload) =>
  emitSafe("typing", payload);
export const emitStopTyping = (payload: TypingPayload) =>
  emitSafe("stopTyping", payload);

// ---------------------------
// Listeners
// ---------------------------
export const onNewMessage = (callback: (msg: NewMessagePayload) => void) => {
  const handler = (msg: Message) => callback(msg as NewMessagePayload);
  socket.on("newMessage", handler);
  return () => socket.off("newMessage", handler);
};

export const onUserTyping = (callback: (payload: TypingPayload) => void) => {
  socket.on("userTyping", callback);
  return () => socket.off("userTyping", callback);
};

export const onUserStopTyping = (
  callback: (payload: TypingPayload) => void
) => {
  socket.on("userStopTyping", callback);
  return () => socket.off("userStopTyping", callback);
};

export const onUserOnlineStatus = (
  callback: (data: UserOnlineStatusPayload) => void
) => {
  socket.on("userOnlineStatus", callback);
  return () => socket.off("userOnlineStatus", callback);
};

export const onUpdateUnreadCount = (callback: (data: UnreadCount) => void) => {
  socket.on("updateUnreadCount", callback);
  return () => socket.off("updateUnreadCount", callback);
};

export const onReplaceTempMessage = (
  callback: (payload: ReplaceTempMessagePayload) => void
) => {
  const handler = (payload: ReplaceTempMessagePayload) => callback(payload);
  socket.on("replaceTempMessage", handler);
  return () => socket.off("replaceTempMessage", handler);
};
