"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getBookingMessages,
  joinBookingRoom,
  sendMessageSocket,
} from "@/lib/api";
import { Message, SendMessagePayload } from "@/types";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthProvider";
import socket from "@/lib/socket";

export default function BookingMessagesPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // --- Fetch initial messages ---
  const { data: initialMessages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["messages", bookingId],
    queryFn: () => getBookingMessages(bookingId),
    enabled: !!bookingId,
  });

  // Initialize messages once fetched
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // --- Socket.IO effects ---
  useEffect(() => {
    if (!bookingId || !currentUserId) return;

    // Join booking room
    joinBookingRoom(bookingId);

    // Listen for incoming messages
    const handleReceiveMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleUserTyping = ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) {
        setTypingUsers((prev) =>
          prev.includes(userId) ? prev : [...prev, userId]
        );
      }
    };

    const handleUserStoppedTyping = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    // Subscribe to socket events
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
    };
  }, [bookingId, currentUserId]);

  // --- Handlers ---
  const handleSend = () => {
    if (!message.trim() || !currentUserId) return;

    const payload: SendMessagePayload = {
      bookingId,
      senderId: currentUserId,
      content: message,
    };

    // Send message via Socket.IO
    sendMessageSocket(payload);

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        ...payload,
        id: Math.random().toString(36).substring(2),
        receiverId: "", // temp
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Message, // typecast to satisfy TS
    ]);

    setMessage("");
    socket.emit("stopTyping", bookingId, currentUserId);
  };

  const handleTyping = (val: string) => {
    setMessage(val);
    if (!currentUserId) return;

    if (val.length > 0) {
      socket.emit("typing", bookingId, currentUserId);
    } else {
      socket.emit("stopTyping", bookingId, currentUserId);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 font-bold text-lg">
        Booking Chat
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <p className="text-gray-400 text-center">Loading messages...</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-xs shadow-md ${
                  msg.senderId === currentUserId
                    ? "bg-indigo-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span className="block text-[10px] opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <p className="text-xs text-gray-500 italic">
            {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"}{" "}
            typing...
          </p>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 border rounded-2xl px-4 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!currentUserId}
          className="bg-indigo-500 text-white px-5 py-2 rounded-2xl shadow hover:bg-indigo-600 transition disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
