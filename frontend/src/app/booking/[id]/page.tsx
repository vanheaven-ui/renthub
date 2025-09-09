"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getBookingMessages,
  joinBookingRoom,
  sendMessageSocket,
} from "@/lib/api";
import { Message, SendMessagePayload } from "@/types";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthProvider";
import socket from "@/lib/socket";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

export default function BookingMessagesPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll to the bottom of the chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        receiverId: "",
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Message,
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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-300 via-pink-200 to-blue-200 animate-gradient-slow"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob-1 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 animate-blob-2 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-2xl h-[85vh] flex flex-col bg-white/30 backdrop-blur-3xl rounded-[3rem] shadow-2xl transition-all duration-500">
        {/* Header */}
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-t-[3rem] text-purple-900 shadow-md">
          <h1 className="font-bold text-3xl drop-shadow-sm text-center">
            Booking Chat
          </h1>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {isLoading ? (
            <p className="text-gray-600 text-center animate-pulse">
              Loading messages...
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderId === currentUserId
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`relative px-5 py-3 max-w-[75%] rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform ${
                    msg.senderId === currentUserId
                      ? "bg-gradient-to-tr from-purple-600 to-pink-500 text-white rounded-br-none"
                      : "bg-white/80 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="block text-[10px] opacity-80 mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          {/* Typing indicator bubble */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="px-5 py-3 rounded-3xl bg-white/80 text-gray-800 rounded-bl-none shadow-lg max-w-[75%]">
                <div className="flex items-center space-x-2">
                  <span className="text-sm italic">
                    {typingUsers.join(", ")}{" "}
                    {typingUsers.length > 1 ? "are" : "is"} typing
                  </span>
                  <div className="flex space-x-1">
                    <span
                      className="block w-2 h-2 bg-gray-500 rounded-full animate-bounce-dot"
                      style={{ animationDelay: "0s" }}
                    ></span>
                    <span
                      className="block w-2 h-2 bg-gray-500 rounded-full animate-bounce-dot"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                    <span
                      className="block w-2 h-2 bg-gray-500 rounded-full animate-bounce-dot"
                      style={{ animationDelay: "0.4s" }}
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Area */}
        <div className="relative p-6 bg-white/40 backdrop-blur-md rounded-b-[3rem] mt-auto">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Start a conversation..."
              className="flex-1 bg-white/60 backdrop-blur-md border border-gray-300 rounded-full px-6 py-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none transition-all"
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!currentUserId || message.trim() === ""}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
            >
              <PaperAirplaneIcon className="w-6 h-6 transform rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
