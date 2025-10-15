import socket from "@/lib/socket";
import { Message, SendMessagePayload, UnreadCount } from "@/types";

// ----------------- TYPES -----------------
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

// Track joined rooms to avoid duplicate joins
const joinedRooms = new Set<string>();

// ----------------- CONNECTION MANAGEMENT -----------------
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    joinedRooms.clear();
  }
};

// ----------------- ROOM MANAGEMENT -----------------
export const joinBookingRoom = (bookingId: string) => {
  if (!joinedRooms.has(bookingId)) {
    socket.emit("joinRoom", { bookingId });
    joinedRooms.add(bookingId);
    console.log(`[SOCKET] Joined room: ${bookingId}`);
  }
};

export const leaveBookingRoom = (bookingId: string) => {
  if (joinedRooms.has(bookingId)) {
    socket.emit("leaveRoom", { bookingId });
    joinedRooms.delete(bookingId);
    console.log(`[SOCKET] Left room: ${bookingId}`);
  }
};

// ----------------- SOCKET MESSAGES -----------------
export const sendMessageSocket = (
  payload: SendMessagePayload & { tempId?: string }
) => {
  socket.emit("sendMessage", payload);
};

// ----------------- TYPING EVENTS -----------------
export const emitTyping = (payload: TypingPayload) => {
  socket.emit("typing", payload);
};

export const emitStopTyping = (payload: TypingPayload) => {
  socket.emit("stopTyping", payload);
};

// ----------------- EVENT LISTENERS -----------------
export const onNewMessage = (
  callback: (message: NewMessagePayload) => void
) => {
  const newMessageHandler = (msg: Message) =>
    callback(msg as NewMessagePayload);
  const replaceHandler = ({
    tempId,
    message,
  }: {
    tempId?: string;
    message: Message;
  }) => {
    callback({ ...message, tempId });
  };

  socket.off("newMessage", newMessageHandler);
  socket.off("replaceTempMessage", replaceHandler);

  socket.on("newMessage", newMessageHandler);
  socket.on("replaceTempMessage", replaceHandler);

  return () => {
    socket.off("newMessage", newMessageHandler);
    socket.off("replaceTempMessage", replaceHandler);
  };
};

// Typing events
export const onUserTyping = (callback: () => void) => {
  socket.off("userTyping", callback);
  socket.on("userTyping", callback);
  return () => socket.off("userTyping", callback);
};

export const onUserStopTyping = (callback: () => void) => {
  socket.off("userStoppedTyping", callback);
  socket.on("userStoppedTyping", callback);
  return () => socket.off("userStoppedTyping", callback);
};

// Online status updates
export const onUserOnlineStatus = (
  callback: (data: UserOnlineStatusPayload) => void
) => {
  socket.off("updateOnlineStatus", callback);
  socket.on("updateOnlineStatus", callback);
  return () => socket.off("updateOnlineStatus", callback);
};

// Unread count updates
export const onUpdateUnreadCount = (callback: (data: UnreadCount) => void) => {
  socket.off("updateUnreadCount", callback);
  socket.on("updateUnreadCount", callback);
  return () => socket.off("updateUnreadCount", callback);
};
