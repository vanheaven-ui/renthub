import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
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

export const initSocket = () => {
  if (!socket.connected) connectSocket();

  // Production-ready: Removed console logs for connect/disconnect/error
  socket.on("connect", () => {});
  socket.on("disconnect", () => {});
  socket.on("connect_error", () => {});
};

// Removed export of closeSocket to prevent accidental global disconnect

export const joinBookingRoom = (bookingId: string) => {
  if (!joinedRooms.has(bookingId) && socket.connected) {
    socket.emit("joinBookingRoom", bookingId);
    joinedRooms.add(bookingId);
  }
};

export const leaveBookingRoom = (bookingId: string) => {
  if (joinedRooms.has(bookingId)) {
    socket.emit("leaveRoom", bookingId);
    joinedRooms.delete(bookingId);
  }
};

export const sendMessageSocket = (
  payload: SendMessagePayload & { tempId?: string }
) => {
  socket.emit("sendMessage", payload);
};

export const emitTyping = (payload: TypingPayload) =>
  socket.emit("typing", payload);

export const emitStopTyping = (payload: TypingPayload) =>
  socket.emit("stopTyping", payload);

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
  socket.on("userStopTyping", callback); // Align with backend emit
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

// Added onReplaceTempMessage
export const onReplaceTempMessage = (
  callback: (payload: ReplaceTempMessagePayload) => void
) => {
  const handler = (payload: ReplaceTempMessagePayload) => callback(payload);
  socket.on("replaceTempMessage", handler);
  return () => socket.off("replaceTempMessage", handler);
};
