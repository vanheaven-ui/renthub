"use client";

import { useEffect, useState, useRef, FormEvent, ChangeEvent } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
  useQuery,
} from "@tanstack/react-query";
import {
  getBookingMessages,
  markMessagesAsRead,
  getUserOnlineStatus,
  getUserProfile,
  sendMessageHttp,
  joinBookingRoom,
} from "@/lib/api";
import {
  Message,
  User,
  BookingDetails,
  PaginatedMessages,
  OnlineStatus,
  SendMessagePayload,
} from "@/types";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/20/solid";
import socket from "@/lib/socket";
import { useAuth } from "@/app/context/AuthProvider";
import Image from "next/image";

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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmit = useRef<number>(0);

  const [newMessage, setNewMessage] = useState<string>("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState<boolean>(false);
  const [isUserOnline, setIsUserOnline] = useState<boolean>(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState<boolean>(true);

  // --- DERIVED STATE: Calculated unconditionally for use in hook 'enabled' flags ---
  const otherUserId =
    user && bookingDetails
      ? user.id === bookingDetails.ownerId
        ? bookingDetails.renterId
        : bookingDetails.ownerId
      : undefined;

  const isReady = !!user && !!bookingDetails && !!otherUserId;

  // --- HOOKS (MUST BE CALLED UNCONDITIONALLY) ---

  // Fetch messages
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = // L77 warning fixed here
    useInfiniteQuery({
      queryKey: ["bookingMessages", bookingId],
      queryFn: async ({ queryKey, pageParam = 1 }) => {
        const [, id] = queryKey;
        const pageNumber = typeof pageParam === "number" ? pageParam : 1;
        return getBookingMessages(id, pageNumber);
      },
      getNextPageParam: (lastPage: PaginatedMessages) =>
        lastPage.hasMore ? lastPage.nextPage : undefined,
      initialPageParam: 1,
      enabled: isReady, // Only fetch when component has all necessary data
    });

  // Mark messages as read mutation
  const markRead = useMutation({
    mutationFn: () => markMessagesAsRead(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookingMessages", bookingId],
      });
      queryClient.invalidateQueries({ queryKey: ["unreadMessagesBatch"] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (payload: SendMessagePayload & { tempId: string }) =>
      sendMessageHttp(payload),
    onError: (error, variables) => {
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(
        ["bookingMessages", bookingId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter(
                (msg) => msg.id !== variables.tempId
              ),
            })),
          };
        }
      );
    },
  });

  // Fetch other user profile
  const { data: otherUserProfileData } = useQuery<User>({
    queryKey: ["otherUserProfile", otherUserId],
    queryFn: () => getUserProfile(otherUserId!),
    enabled: isReady,
  });

  // Fetch initial online status
  const { data: initialOnlineStatusData } = useQuery<OnlineStatus>({
    queryKey: ["userOnlineStatus", otherUserId],
    queryFn: () => getUserOnlineStatus(otherUserId!),
    enabled: isReady,
  });

  // Effect to set initial online status
  useEffect(() => {
    if (initialOnlineStatusData)
      setIsUserOnline(initialOnlineStatusData.isOnline);
  }, [initialOnlineStatusData]);

  // Effect to mark messages as read
  useEffect(() => {
    // Only attempt to mark read if the component is fully ready
    if (isReady) {
      markRead.mutate();
    }
  }, [bookingId, markRead, isReady]);

  // Socket events
  useEffect(() => {
    if (!isReady) return; // Guard to prevent execution until data is ready

    joinBookingRoom(bookingId);

    const handleNewMessage = (message: Message & { tempId?: string }) => {
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(
        ["bookingMessages", bookingId],
        (old) => {
          if (!old) return old;
          const oldPages = old.pages;
          const lastPage = oldPages[oldPages.length - 1];
          if (!lastPage) return old;

          let finalMessage = message;

          if (message.tempId) {
            return {
              ...old,
              pages: oldPages.map((page, index) => ({
                ...page,
                messages:
                  index === oldPages.length - 1
                    ? page.messages.map((msg) =>
                        msg.id === message.tempId
                          ? {
                              ...message,
                              id: message.id,
                              delivered: true,
                              createdAt: message.createdAt,
                            }
                          : msg
                      )
                    : page.messages,
              })),
            };
          }

          const isDuplicate = oldPages.some((page) =>
            page.messages.some((msg) => msg.id === message.id)
          );
          if (isDuplicate) return old;

          // Attach sender profile if missing
          if (
            message.senderId === otherUserId &&
            !message.sender &&
            otherUserProfileData
          ) {
            finalMessage = { ...message, sender: otherUserProfileData };
          }

          if (finalMessage.senderId !== user.id) markRead.mutate();

          return {
            ...old,
            pages: [
              ...oldPages.slice(0, -1),
              { ...lastPage, messages: [...lastPage.messages, finalMessage] },
            ],
          };
        }
      );
    };

    const handleMessageRead = (data: {
      messageId: string;
      bookingId: string;
      readAt: string;
    }) => {
      if (data.bookingId !== bookingId) return;
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(
        ["bookingMessages", bookingId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) =>
                msg.senderId === user.id &&
                !msg.read &&
                new Date(msg.createdAt) <= new Date(data.readAt)
                  ? { ...msg, read: true, readAt: data.readAt }
                  : msg
              ),
            })),
          };
        }
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageRead", handleMessageRead);
    socket.on("userTyping", () => setIsOtherUserTyping(true));
    socket.on("userStoppedTyping", () => setIsOtherUserTyping(false));
    socket.on(
      "userOnlineStatus",
      (data: { userId: string; isOnline: boolean }) => {
        if (data.userId === otherUserId) setIsUserOnline(data.isOnline);
      }
    );

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageRead", handleMessageRead);
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("userOnlineStatus");
    };
  }, [
    bookingId,
    queryClient,
    user, // The full user object is stable enough in context
    otherUserId,
    markRead,
    otherUserProfileData,
    isReady,
  ]);

  // --- DERIVED STATE FROM HOOKS (Calculated UNCONDITIONALLY) ---
  // Moved up from after the early return
  const messages: Message[] =
    data?.pages.flatMap((page) => page.messages) ?? [];

  // Scroll to bottom (MOVED UP to be called UNCONDITIONALLY)
  useEffect(() => {
    if (isScrolledToBottom)
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isScrolledToBottom]);

  // --- EARLY RETURN (NOW SAFE) ---
  if (!bookingDetails || !user) return null;

  // --- REST OF LOGIC (Now safe to be here) ---

  // Recalculate variables that depend on the non-null user and bookingDetails for use in JSX
  const otherUserName =
    user.id === bookingDetails.ownerId
      ? bookingDetails.renterName
      : bookingDetails.ownerName;
  const otherUserProfile =
    user.id === bookingDetails.ownerId
      ? bookingDetails.renterProfile
      : bookingDetails.ownerProfile;

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 1;
    setIsScrolledToBottom(isAtBottom);

    if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      const oldScrollHeight = container.scrollHeight;
      fetchNextPage().then(() => {
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop =
            newScrollHeight - oldScrollHeight;
        }
      });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    const now = Date.now();
    if (now - lastTypingEmit.current > 500) {
      socket.emit("typing", { bookingId, userId: user.id });
      lastTypingEmit.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { bookingId, userId: user.id });
      typingTimeoutRef.current = null;
      lastTypingEmit.current = 0;
    }, 1200);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    const tempId = Date.now().toString();
    const now = new Date().toISOString();

    const tempMessage: Message & { delivered: boolean } = {
      id: tempId,
      bookingId,
      senderId: user.id,
      receiverId: otherUserId!, // otherUserId is guaranteed to be defined here due to the early return guard
      content,
      createdAt: now,
      updatedAt: now,
      sender: {
        id: user.id,
        name: user.name ?? "You",
        profilePicture: user.profilePicture ?? "",
      },
      read: false,
      readAt: null,
      delivered: false,
    };

    queryClient.setQueryData<InfiniteData<PaginatedMessages>>(
      ["bookingMessages", bookingId],
      (old) => {
        if (!old) return old;
        const oldPages = old.pages;
        const lastPage = oldPages[oldPages.length - 1];
        if (!lastPage) return old;
        const isDuplicate = lastPage.messages.some(
          (msg) => msg.id === tempMessage.id
        );
        if (isDuplicate) return old;

        return {
          ...old,
          pages: [
            ...oldPages.slice(0, -1),
            { ...lastPage, messages: [...lastPage.messages, tempMessage] },
          ],
        };
      }
    );

    const payload: SendMessagePayload & { tempId: string } = {
      bookingId,
      content,
      senderId: user.id,
      receiverId: otherUserId!,
      tempId,
    };

    sendMessageMutation.mutate(payload);
    setNewMessage("");
    setIsScrolledToBottom(true);
  };

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
    setIsScrolledToBottom(true);
  };

  const MessageStatusIcon = ({
    message,
  }: {
    message: Message & { delivered?: boolean };
  }) => {
    if (message.senderId !== user.id) return null;
    if (message.read)
      return (
        <span className="flex items-center text-xs text-purple-200">
          <CheckIconSolid className="w-3 h-3 -ml-0.5" />
          <CheckIconSolid className="w-3 h-3 text-pink-300 -ml-1.5" />
        </span>
      );
    if (message.delivered)
      return (
        <span className="flex items-center text-xs text-white/70">
          <CheckIconSolid className="w-3 h-3 -ml-0.5" />
          <CheckIconSolid className="w-3 h-3 -ml-1.5" />
        </span>
      );
    return null;
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
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl mx-auto bg-gray-100/50 border border-white/30 rounded-[3rem] shadow-lg flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-t-[3rem] flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative w-16 h-16">
              {otherUserProfile ? (
                <Image
                  src={otherUserProfile}
                  alt={otherUserName}
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-white shadow-xl bg-gray-300 flex items-center justify-center" />
              )}
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  isUserOnline
                    ? "bg-green-500 animate-ping-once"
                    : "bg-gray-400"
                }`}
                title={isUserOnline ? "Online" : "Offline"}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-purple-800 font-extrabold text-2xl truncate">
                {otherUserName}
              </span>
              <span
                className={`text-sm font-medium ${
                  isOtherUserTyping ? "text-pink-600" : "text-gray-600"
                } italic`}
              >
                {isOtherUserTyping ? "Typing..." : getStatusText()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-gray-100 hover:bg-red-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                msg.senderId === user.id ? "justify-end" : "justify-start"
              }`}
            >
              {msg.senderId !== user.id && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1">
                  <Image
                    src={msg.sender?.profilePicture || "/default-avatar.png"}
                    alt={msg.sender?.name || "User"}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              )}
              <div className="relative max-w-[70%]">
                <div
                  className={`px-4 py-2 rounded-2xl break-words ${
                    msg.senderId === user.id
                      ? "bg-purple-700 text-white"
                      : "bg-white text-gray-900 shadow"
                  } text-sm`}
                >
                  {msg.content}
                </div>
                <div className="absolute bottom-0 right-0 -mb-4 -mr-1">
                  <MessageStatusIcon message={msg} />
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          {!isScrolledToBottom && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 bg-purple-700 text-white p-2 rounded-full shadow-lg"
            >
              <ArrowUpIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 p-6 bg-white/70 backdrop-blur-xl rounded-b-[3rem] border-t border-gray-200"
        >
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="bg-purple-700 text-white p-3 rounded-full hover:bg-purple-800"
          >
            <PaperAirplaneIcon className="w-5 h-5 rotate-45" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingChat;
