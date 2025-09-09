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
  onUpdateUnreadCount,
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

    sendMessageSocket({
      bookingId,
      senderId: otherUserId,
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

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-3xl mx-auto bg-gray-100/60 backdrop-blur-3xl rounded-[3rem] shadow-2xl flex flex-col h-[85vh] overflow-hidden transition-all duration-500 hover:shadow-3xl">
        {/* Header */}
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-t-[3rem] flex items-center justify-between shadow-md gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {otherUserProfile ? (
                <img
                  src={otherUserProfile}
                  alt={otherUserName}
                  className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-14 h-14 rounded-full border-4 border-white shadow-lg bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-2xl">
                  ?
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  isUserOnline
                    ? "bg-green-400 animate-pulse-fast"
                    : "bg-gray-400"
                }`}
                title={isUserOnline ? "Online" : "Offline"}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-purple-900 font-bold text-xl truncate drop-shadow-sm">
                {otherUserName}
              </span>
              <span className="text-sm text-gray-600 opacity-90 truncate italic">
                {isOtherUserTyping ? "Typing..." : getStatusText()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        {/* Messages with unique pattern */}
        <div
          className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 0L0 100h100V0zM0 0l100 100V0H0z' fill='%23d3d3d3' fill-opacity='0.1'/%3E%3C/svg%3E")`,
            backgroundSize: "100px 100px", // Adjust size for subtlety
          }}
        >
          {isLoading && (
            <p className="text-center text-gray-500 animate-pulse">
              Loading messages...
            </p>
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
                className={`max-w-[85%] md:max-w-[70%] px-5 py-3 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform ${
                  msg.senderId === user.id
                    ? "bg-gradient-to-tr from-purple-600 to-pink-500 text-white rounded-br-none"
                    : "bg-blue-50/70 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="text-sm font-light">{msg.content}</p>
                <p className="text-xs text-right mt-1 opacity-80">
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
              <div className="bg-blue-50/70 text-gray-800 rounded-3xl px-5 py-3 rounded-bl-none shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm italic">
                    {otherUserName} is typing
                  </span>
                  <div className="flex space-x-1">
                    <span
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-dot"
                      style={{ animationDelay: "0s" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-dot"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-dot"
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
        <form
          onSubmit={handleSubmit}
          className="relative p-6 bg-white/40 backdrop-blur-md mt-auto rounded-b-[3rem] shadow-inner-xl"
        >
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Start a conversation..."
              className="flex-1 bg-white/60 backdrop-blur-md border border-gray-300 rounded-full px-6 py-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 outline-none transition-all"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
              disabled={!newMessage.trim()}
            >
              <PaperAirplaneIcon className="w-6 h-6 transform rotate-90" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingChat;
