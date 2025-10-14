import socket from "@/lib/socket";
import { Message } from "@/types";

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
}

// ----------------- ROOM MANAGEMENT -----------------
export const joinBookingRoom = (bookingId: string) => {
  socket.emit("joinRoom", { bookingId });
};

// ----------------- SOCKET MESSAGES -----------------
export const sendMessageSocket = (message: Message & { tempId: string }) => {
  socket.emit("sendMessage", message);
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
  socket.on("newMessage", callback);
  return () => socket.off("newMessage", callback);
};

export const onUserTyping = (callback: () => void) => {
  socket.on("userTyping", callback);
  return () => socket.off("userTyping", callback);
};

export const onUserStopTyping = (callback: () => void) => {
  socket.on("userStoppedTyping", callback);
  return () => socket.off("userStoppedTyping", callback);
};

export const onUserOnlineStatus = (
  callback: (data: UserOnlineStatusPayload) => void
) => {
  socket.on("userOnlineStatus", callback);
  return () => socket.off("userOnlineStatus", callback);
};

// ----------------- CLEANUP -----------------
export const disconnectSocket = () => {
  socket.disconnect();
};
