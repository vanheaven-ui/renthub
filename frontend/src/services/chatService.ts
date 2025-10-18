import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
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

// ----------------- STATE -----------------
const joinedRooms = new Set<string>();

// ----------------- CONNECTION -----------------
export const initSocket = () => {
  console.log("[SOCKET SERVICE] Initializing socket (cookie auth)...");
  connectSocket();

  socket.on("connect", () =>
    console.log("[SOCKET SERVICE] Connected:", socket.id)
  );
  socket.on("disconnect", (reason) =>
    console.log("[SOCKET SERVICE] Disconnected:", reason)
  );
  socket.on("connect_error", (err: any) =>
    console.error("[SOCKET SERVICE] Connection error:", err.message)
  );
};

export const closeSocket = () => {
  console.log("[SOCKET SERVICE] Closing socket...");
  disconnectSocket();
  joinedRooms.clear();
};

// ----------------- ROOM MANAGEMENT -----------------
export const joinBookingRoom = (bookingId: string) => {
  if (!joinedRooms.has(bookingId)) {
    try {
      socket.emit("joinBookingRoom", bookingId);
      joinedRooms.add(bookingId);
      console.log(`[SOCKET SERVICE] Joined room: ${bookingId}`);
    } catch (err) {
      console.error(`[SOCKET SERVICE] Failed to join room ${bookingId}:`, err);
    }
  }
};

export const leaveBookingRoom = (bookingId: string) => {
  if (joinedRooms.has(bookingId)) {
    try {
      socket.emit("leaveRoom", bookingId);
      joinedRooms.delete(bookingId);
      console.log(`[SOCKET SERVICE] Left room: ${bookingId}`);
    } catch (err) {
      console.error(`[SOCKET SERVICE] Failed to leave room ${bookingId}:`, err);
    }
  }
};

// ----------------- MESSAGES -----------------
export const sendMessageSocket = (
  payload: SendMessagePayload & { tempId?: string }
) => {
  try {
    socket.emit("sendMessage", payload);
    console.log(`[SOCKET SERVICE] Sent message:`, payload);
  } catch (err) {
    console.error("[SOCKET SERVICE] Failed to send message:", err);
  }
};

// ----------------- TYPING -----------------
export const emitTyping = (payload: TypingPayload) => {
  try {
    socket.emit("typing", payload);
  } catch (err) {
    console.error("[SOCKET SERVICE] Failed to emit typing:", err);
  }
};

export const emitStopTyping = (payload: TypingPayload) => {
  try {
    socket.emit("stopTyping", payload);
  } catch (err) {
    console.error("[SOCKET SERVICE] Failed to emit stopTyping:", err);
  }
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
  }) => callback({ ...message, tempId });

  socket.off("newMessage", newMessageHandler);
  socket.off("replaceTempMessage", replaceHandler);

  socket.on("newMessage", newMessageHandler);
  socket.on("replaceTempMessage", replaceHandler);

  console.log(
    "[SOCKET SERVICE] Registered newMessage and replaceTempMessage listeners"
  );

  return () => {
    socket.off("newMessage", newMessageHandler);
    socket.off("replaceTempMessage", replaceHandler);
    console.log(
      "[SOCKET SERVICE] Removed newMessage and replaceTempMessage listeners"
    );
  };
};

export const onUserTyping = (callback: () => void) => {
  socket.off("userTyping", callback);
  socket.on("userTyping", callback);
  console.log("[SOCKET SERVICE] Registered userTyping listener");
  return () => socket.off("userTyping", callback);
};

export const onUserStopTyping = (callback: () => void) => {
  socket.off("userStoppedTyping", callback);
  socket.on("userStoppedTyping", callback);
  console.log("[SOCKET SERVICE] Registered userStoppedTyping listener");
  return () => socket.off("userStoppedTyping", callback);
};

export const onUserOnlineStatus = (
  callback: (data: UserOnlineStatusPayload) => void
) => {
  socket.off("userOnlineStatus", callback);
  socket.on("userOnlineStatus", callback);
  console.log("[SOCKET SERVICE] Registered userOnlineStatus listener");
  return () => socket.off("userOnlineStatus", callback);
};

export const onUpdateUnreadCount = (callback: (data: UnreadCount) => void) => {
  socket.off("updateUnreadCount", callback);
  socket.on("updateUnreadCount", callback);
  console.log("[SOCKET SERVICE] Registered updateUnreadCount listener");
  return () => socket.off("updateUnreadCount", callback);
};
