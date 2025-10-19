// @/lib/chatService.ts
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
// IMPORTANT: This set should be relied on by components to manage state,
// but the server ultimately decides room membership.
const joinedRooms = new Set<string>();

// ----------------- CONNECTION -----------------

// The initSocket function is fine as it runs once (in MyBookingsPage's Effect 1)
export const initSocket = () => {
  console.log("[SOCKET SERVICE] Initializing socket (cookie auth)...");
  connectSocket();

  // Register global connection listeners here (once)
  socket.on("connect", () =>
    console.log("[SOCKET SERVICE] Connected:", socket.id)
  );
  socket.on("disconnect", (reason) =>
    console.log("[SOCKET SERVICE] Disconnected:", reason)
  );
  socket.on("connect_error", (err: unknown) => {
    if (err instanceof Error)
      // This is the CRITICAL log from the server (e.g., "Authentication error: No token found")
      console.error("[SOCKET SERVICE] ❌ Connection error:", err.message);
    else console.error("[SOCKET SERVICE] ❌ Connection error:", err);
  });
};

export const closeSocket = () => {
  // Only disconnect the socket if needed (e.g., user logs out or leaves page)
  console.log("[SOCKET SERVICE] Closing socket...");
  // Clear listeners before disconnecting to prevent memory leaks
  socket.removeAllListeners();
  disconnectSocket();
  joinedRooms.clear();
};

// ----------------- ROOM MANAGEMENT -----------------
export const joinBookingRoom = (bookingId: string) => {
  // CRITICAL: Only emit if connected to prevent failed handshake attempts
  if (socket.connected && !joinedRooms.has(bookingId)) {
    try {
      socket.emit("joinBookingRoom", bookingId);
      joinedRooms.add(bookingId);
      console.log(`[SOCKET SERVICE] Joined room: ${bookingId}`);
    } catch (err: unknown) {
      console.error(`[SOCKET SERVICE] Failed to join room ${bookingId}:`, err);
    }
  } else if (!socket.connected) {
    // Log if attempting to join room before connection is stable
    console.warn(
      `[SOCKET SERVICE] Cannot join room ${bookingId}. Socket not connected.`
    );
  }
};

export const leaveBookingRoom = (bookingId: string) => {
  if (joinedRooms.has(bookingId)) {
    try {
      // Note: Your server implementation may not have a 'leaveRoom' handler.
      // If it does, ensure the server handler removes the socket from the room.
      socket.emit("leaveRoom", bookingId);
      joinedRooms.delete(bookingId);
      console.log(`[SOCKET SERVICE] Left room: ${bookingId}`);
    } catch (err: unknown) {
      console.error(`[SOCKET SERVICE] Failed to leave room ${bookingId}:`, err);
    }
  }
};

// ----------------- MESSAGES & TYPING (Logic is fine) -----------------
export const sendMessageSocket = (
  payload: SendMessagePayload & { tempId?: string }
) => {
  // ... logic remains the same ...
  try {
    socket.emit("sendMessage", payload);
    console.log(`[SOCKET SERVICE] Sent message:`, payload);
  } catch (err: unknown) {
    console.error("[SOCKET SERVICE] Failed to send message:", err);
  }
};

export const emitTyping = (payload: TypingPayload) => {
  // ... logic remains the same ...
  try {
    socket.emit("typing", payload);
  } catch (err: unknown) {
    console.error("[SOCKET SERVICE] Failed to emit typing:", err);
  }
};

export const emitStopTyping = (payload: TypingPayload) => {
  // ... logic remains the same ...
  try {
    socket.emit("stopTyping", payload);
  } catch (err: unknown) {
    console.error("[SOCKET SERVICE] Failed to emit stopTyping:", err);
  }
};

// ----------------- EVENT LISTENERS (Refined) -----------------

// The cleanup logic inside the returned function is what React's useEffect relies on.
// We remove the duplicate socket.off/socket.on pattern from the start of the function.

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

  // ⛔ Removed socket.off calls here! The consumer's useEffect cleanup handles this.

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

// Example of simplified listener function:
export const onUserTyping = (callback: (payload: TypingPayload) => void) => {
  socket.on("userTyping", callback);
  console.log("[SOCKET SERVICE] Registered userTyping listener");
  return () => socket.off("userTyping", callback);
};

export const onUserStopTyping = (
  callback: (payload: TypingPayload) => void
) => {
  socket.on("userStoppedTyping", callback);
  console.log("[SOCKET SERVICE] Registered userStoppedTyping listener");
  return () => socket.off("userStoppedTyping", callback);
};

export const onUserOnlineStatus = (
  callback: (data: UserOnlineStatusPayload) => void
) => {
  socket.on("userOnlineStatus", callback);
  console.log("[SOCKET SERVICE] Registered userOnlineStatus listener");
  return () => socket.off("userOnlineStatus", callback);
};

export const onUpdateUnreadCount = (callback: (data: UnreadCount) => void) => {
  socket.on("updateUnreadCount", callback);
  console.log("[SOCKET SERVICE] Registered updateUnreadCount listener");
  return () => socket.off("updateUnreadCount", callback);
};
