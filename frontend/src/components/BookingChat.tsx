"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBookingMessages,
  markMessagesAsRead,
  getUserOnlineStatus,
  getUserProfile,
  sendMessageSocket,
  onNewMessage,
  onUserTyping,
  onUserStoppedTyping,
  onUserOnlineStatus,
  onUpdateUnreadCount, // 🔥 NEW
  joinBookingRoom,
} from "@/lib/api";
import { Message, User, BookingDetails } from "@/types";
import { useAuth } from "@/app/context/AuthProvider";
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import socket from "@/lib/socket";

interface BookingChatProps {
  bookingId: string;
  onClose: () => void;
  bookingDetails: BookingDetails | null;
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

  if (!bookingDetails || !user) return null;

  const isCurrentUserOwner = user.id === bookingDetails.ownerId;
  const otherUserId = isCurrentUserOwner
    ? bookingDetails.renterId
    : bookingDetails.ownerId;
  const otherUserName = isCurrentUserOwner
    ? bookingDetails.renterName
    : bookingDetails.ownerName;
  const otherUserProfile = isCurrentUserOwner
    ? bookingDetails.renterProfile
    : bookingDetails.ownerProfile;

  // --- Queries ---
  const {
    data: messages,
    isLoading,
    error,
  } = useQuery<Message[]>({
    queryKey: ["bookingMessages", bookingId],
    queryFn: () => getBookingMessages(bookingId),
  });

  const { data: otherUserProfileData } = useQuery<User>({
    queryKey: ["otherUserProfile", otherUserId],
    queryFn: () => getUserProfile(otherUserId),
  });

  const { data: initialOnlineStatus } = useQuery({
    queryKey: ["userOnlineStatus", otherUserId],
    queryFn: () => getUserOnlineStatus(otherUserId),
  });

  useEffect(() => {
    if (initialOnlineStatus !== undefined) setIsUserOnline(initialOnlineStatus);
  }, [initialOnlineStatus]);

  // --- Mark as read ---
  const markAsReadMutation = useMutation({
    mutationFn: markMessagesAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookingMessages", bookingId],
      });
    },
  });

  useEffect(() => {
    markAsReadMutation.mutate(bookingId);
  }, [bookingId, markAsReadMutation]);

  // --- Socket listeners ---
  useEffect(() => {
    joinBookingRoom(bookingId);

    const unsubscribeMessage = onNewMessage(bookingId, (message) => {
      queryClient.setQueryData<Message[]>(
        ["bookingMessages", bookingId],
        (old: Message[] = []) => {
          if (old.some((msg) => msg.id === message.id)) return old;
          return [...old, message];
        }
      );
    });

    const unsubscribeTyping = onUserTyping(bookingId, user.id, () =>
      setIsOtherUserTyping(true)
    );
    const unsubscribeStoppedTyping = onUserStoppedTyping(
      bookingId,
      user.id,
      () => setIsOtherUserTyping(false)
    );

    const unsubscribeOnline = onUserOnlineStatus(otherUserId, (isOnline) =>
      setIsUserOnline(isOnline)
    );

    // Unread count updates in real time
    const unsubscribeUnread = onUpdateUnreadCount((data) => {
      queryClient.setQueryData(["unreadMessages", data.bookingId], {
        unreadCount: data.count,
      });
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeStoppedTyping();
      unsubscribeOnline();
      unsubscribeUnread();
    };
  }, [bookingId, user.id, otherUserId, queryClient]);

  // --- Scroll to bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherUserTyping]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!typingTimeoutRef.current) {
      socket.emit("typing", { bookingId, userId: user.id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { bookingId, userId: user.id });
      typingTimeoutRef.current = null;
    }, 1200);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = Date.now().toString();

    // Optimistic UI
    const tempMessage: Message = {
      id: tempId,
      bookingId,
      senderId: user.id,
      receiverId: otherUserId,
      content: newMessage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name ?? "You",
        profilePicture: user.profilePicture ?? "",
      },
      read: false,
    };

    queryClient.setQueryData<Message[]>(
      ["bookingMessages", bookingId],
      (old: Message[] = []) => [...old, tempMessage]
    );

    // Emit message
    sendMessageSocket({
      bookingId,
      receiverId: otherUserId,
      content: newMessage,
    });

    setNewMessage("");
  };

  const getStatusText = () => {
    if (isUserOnline) return "Online";
    if (!otherUserProfileData?.lastSeen) return "Offline";

    const lastSeenDate = new Date(otherUserProfileData.lastSeen);
    const diffMinutes = Math.floor(
      (Date.now() - lastSeenDate.getTime()) / 60000
    );
    if (diffMinutes < 1) return "Online recently";
    if (diffMinutes < 60)
      return `Last seen ${diffMinutes} minute${
        diffMinutes === 1 ? "" : "s"
      } ago`;
    if (diffMinutes < 1440)
      return `Last seen ${Math.floor(diffMinutes / 60)} hour(s) ago`;
    return `Last seen on ${lastSeenDate.toLocaleDateString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4 rounded-t-2xl flex items-center justify-between shadow-md gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {otherUserProfile ? (
                <img
                  src={otherUserProfile}
                  alt={otherUserName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-300 flex items-center justify-center text-gray-500">
                  ?
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  isUserOnline ? "bg-green-400 animate-pulse" : "bg-gray-400"
                }`}
                title={isUserOnline ? "Online" : "Offline"}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-semibold text-lg truncate">
                {otherUserName}
              </span>
              <span className="text-sm text-white opacity-80 truncate">
                {isOtherUserTyping ? "Typing..." : getStatusText()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white hover:bg-purple-700 transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
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
                msg.senderId === user.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                  msg.senderId === user.id
                    ? "bg-purple-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="font-semibold text-sm">
                  {msg.sender?.name || "Unknown User"}
                </p>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-right mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isOtherUserTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 rounded-2xl px-4 py-2 rounded-bl-none">
                <p className="text-sm">{otherUserName} is typing...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
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
            />
            <button
              type="submit"
              className="p-3 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition disabled:bg-gray-400"
              disabled={!newMessage.trim()}
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
