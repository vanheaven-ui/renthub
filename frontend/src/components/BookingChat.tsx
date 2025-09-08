// src/app/components/BookingChat.tsx

"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBookingMessages,
  sendMessage,
  markMessagesAsRead,
  getUserOnlineStatus,
} from "@/lib/api";
import { Message, SendMessagePayload } from "@/types";
import { useAuth } from "@/app/context/AuthProvider";
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import socket from "@/lib/socket";

interface BookingChatProps {
  bookingId: string;
  onClose: () => void;
  bookingDetails: any;
}

const BookingChat = ({
  bookingId,
  onClose,
  bookingDetails,
}: BookingChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isUserOnline, setIsUserOnline] = useState(false);

  const otherUserId =
    user?.id === bookingDetails.ownerId
      ? bookingDetails.renterId
      : bookingDetails.ownerId;

  const otherUser =
    user?.id === bookingDetails.ownerId
      ? bookingDetails.renterName
      : bookingDetails.ownerName;

  const {
    data: messages,
    isLoading,
    error,
  } = useQuery<Message[]>({
    queryKey: ["bookingMessages", bookingId],
    queryFn: () => getBookingMessages(bookingId),
    enabled: !!bookingId,
  });

  const { data: initialOnlineStatus } = useQuery({
    queryKey: ["userOnlineStatus", otherUserId],
    queryFn: () => getUserOnlineStatus(otherUserId),
    enabled: !!otherUserId,
  });

  useEffect(() => {
    if (initialOnlineStatus !== undefined) {
      setIsUserOnline(initialOnlineStatus);
    }
  }, [initialOnlineStatus]);

  const markAsReadMutation = useMutation({
    mutationFn: markMessagesAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookingMessages", bookingId],
      });
    },
  });

  useEffect(() => {
    if (bookingId) {
      markAsReadMutation.mutate(bookingId);
    }
  }, [bookingId]);

  const sendMessageMutation = useMutation<void, unknown, SendMessagePayload>({
    mutationFn: ({ bookingId, receiverId, content }) =>
      sendMessage(bookingId, receiverId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookingMessages", bookingId],
      });
      setNewMessage("");
    },
  });

  useEffect(() => {
    if (!bookingId || !user) return;

    socket.emit("joinBookingRoom", bookingId);

    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(
        ["bookingMessages", bookingId],
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return [message];
          return [...oldMessages, message];
        }
      );
    };

    const handleUserTyping = (data: { userId: string }) => {
      if (data.userId !== user.id) {
        setIsOtherUserTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: { userId: string }) => {
      if (data.userId !== user.id) {
        setIsOtherUserTyping(false);
      }
    };

    const handleUserOnline = (onlineUser: {
      userId: string;
      isOnline: boolean;
    }) => {
      if (onlineUser.userId === otherUserId) {
        setIsUserOnline(onlineUser.isOnline);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);
    socket.on("userOnlineStatus", handleUserOnline);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("userOnlineStatus", handleUserOnline);
    };
  }, [bookingId, queryClient, user, bookingDetails, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!typingTimeoutRef.current) {
      socket.emit("typing", {
        bookingId: bookingId,
        userId: user?.id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        bookingId: bookingId,
        userId: user?.id,
      });
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const payload: SendMessagePayload = {
      bookingId,
      receiverId: otherUserId,
      content: newMessage,
    };

    sendMessageMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative z-10 w-full max-w-xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col h-[70vh] overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4 rounded-t-2xl flex flex-wrap items-center justify-between shadow-md">
          {/* Left: Other user info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Profile picture with SVG fallback */}
            <div className="relative flex-shrink-0">
              {bookingDetails.otherUserProfile ? (
                <img
                  src={bookingDetails.otherUserProfile}
                  alt={otherUser}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <svg
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-300 text-gray-500 p-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}

              {/* Online indicator */}
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  isUserOnline ? "bg-green-400 animate-pulse" : "bg-gray-400"
                }`}
                title={isUserOnline ? "Online" : "Offline"}
              ></span>
            </div>

            {/* Name and listing */}
            <div className="flex flex-col min-w-0">
              <span className="text-white font-semibold text-lg truncate">
                {otherUser}
              </span>
              <span className="text-sm text-white opacity-80 truncate">
                {bookingDetails.listingTitle}
              </span>
            </div>
          </div>

          {/* Right: Current user + close button */}
          <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-shrink-0">
            <span className="text-sm text-white opacity-80 flex items-center gap-1">
              You
              <span
                className="w-3 h-3 rounded-full bg-green-400"
                title="You are online"
              ></span>
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white hover:bg-purple-700 transition"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {isLoading && (
            <p className="text-center text-gray-500">Loading messages...</p>
          )}
          {error && (
            <p className="text-center text-red-500">Error fetching messages.</p>
          )}
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                  msg.senderId === user?.id
                    ? "bg-purple-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="font-semibold text-sm">
                  {msg.sender?.name || "Unknown User"}
                </p>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-right mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isOtherUserTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 rounded-2xl px-4 py-2 rounded-bl-none">
                <p className="text-sm">{otherUser} is typing...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-gray-200 bg-white"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              disabled={sendMessageMutation.isPending}
            />
            <button
              type="submit"
              className="p-3 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition disabled:bg-gray-400"
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              <PaperAirplaneIcon className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingChat;
