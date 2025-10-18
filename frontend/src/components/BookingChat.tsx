"use client";

import { useEffect, useState, useRef, FormEvent, ChangeEvent } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import {
  MessageWithDelivered,
  BookingDetails,
  PaginatedMessages,
  OnlineStatus,
  SendMessagePayload,
  User,
} from "@/types";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/20/solid";
import * as chatService from "@/services/chatService";
import { useAuth } from "@/app/context/AuthProvider";
import {
  getBookingMessages,
  getUserOnlineStatus,
  getUserProfile,
  markMessagesAsRead,
  sendMessageHttp,
} from "@/lib/api";
import Image from "next/image";
import DefaultProfileIcon from "@/components/DefaultProfileIcon";
import { formatDateGroup, groupMessagesByDate } from "@/lib/dateUtil";

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

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const otherUserId =
    user && bookingDetails
      ? user.id === bookingDetails.ownerId
        ? bookingDetails.renterId
        : bookingDetails.ownerId
      : undefined;

  const isReady = !!user && !!bookingDetails && !!otherUserId;

  // -------------------- FETCH MESSAGES --------------------
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<PaginatedMessages, Error>({
      queryKey: ["bookingMessages", bookingId],
      queryFn: async ({ pageParam = 1 }) =>
        getBookingMessages(bookingId, pageParam as number),
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.nextPage : undefined,
      initialPageParam: 1,
      enabled: isReady,
      staleTime: Infinity,
    });

  const messages: MessageWithDelivered[] =
    data?.pages.flatMap((page) => page.messages) ?? [];
  const groupedMessages = groupMessagesByDate(messages);

  // -------------------- MARK AS READ --------------------
  const markReadMutation = useMutation({
    mutationFn: () => markMessagesAsRead(bookingId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["unreadMessagesBatch"] }),
  });

  useEffect(() => {
    if (isReady) markReadMutation.mutate();
  }, [bookingId, isReady, markReadMutation]); // ✅ added markReadMutation

  // -------------------- SEND MESSAGE --------------------
  const sendMessageMutation = useMutation({
    mutationFn: (payload: SendMessagePayload & { tempId: string }) =>
      sendMessageHttp(payload),
    onError: (_, variables) => {
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(
        ["bookingMessages", bookingId],
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  messages: page.messages.filter(
                    (msg) => msg.id !== variables.tempId
                  ),
                })),
              }
            : old
      );
    },
  });

  // -------------------- FETCH OTHER USER --------------------
  const { data: otherUserProfileData } = useQuery<User>({
    queryKey: ["otherUserProfile", otherUserId],
    queryFn: () => getUserProfile(otherUserId!),
    enabled: isReady,
  });

  // -------------------- ONLINE STATUS --------------------
  const { data: initialOnlineStatusData } = useQuery<OnlineStatus>({
    queryKey: ["userOnlineStatus", otherUserId],
    queryFn: () => getUserOnlineStatus(otherUserId!),
    enabled: isReady,
    staleTime: 60000,
  });

  useEffect(() => {
    if (!initialOnlineStatusData) return;
    const { isOnline, lastSeen } = initialOnlineStatusData;
    setIsUserOnline(isOnline);
    setLastSeen(
      !isOnline && lastSeen
        ? new Date(lastSeen).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            month: "short",
            day: "numeric",
          })
        : null
    );
  }, [initialOnlineStatusData]);

  // -------------------- SOCKET CONNECTION --------------------
  useEffect(() => {
    if (!isReady) return;

    chatService.initSocket();
    chatService.joinBookingRoom(bookingId);

    const offNewMessage = chatService.onNewMessage((message) => {
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(
        ["bookingMessages", bookingId],
        (old) => {
          if (!old) return old;
          const lastPage = old.pages[old.pages.length - 1];
          if (!lastPage) return old;

          const isDuplicate = old.pages.some((p) =>
            p.messages.some((m) => m.id === message.id)
          );
          if (isDuplicate) return old;

          if (message.senderId !== user.id) markReadMutation.mutate();

          const updated = {
            ...old,
            pages: [
              ...old.pages.slice(0, -1),
              { ...lastPage, messages: [...lastPage.messages, message] },
            ],
          };

          if (isScrolledToBottom) setTimeout(scrollToBottom, 100);

          return updated;
        }
      );
    });

    const offTyping = chatService.onUserTyping(() =>
      setIsOtherUserTyping(true)
    );
    const offStopTyping = chatService.onUserStopTyping(() =>
      setIsOtherUserTyping(false)
    );

    const offOnline = chatService.onUserOnlineStatus((data) => {
      if (data.userId === otherUserId) {
        setIsUserOnline(data.isOnline);
        setLastSeen(
          !data.isOnline && data.lastSeen
            ? new Date(data.lastSeen).toLocaleString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                month: "short",
                day: "numeric",
              })
            : null
        );
      }
    });

    return () => {
      offNewMessage();
      offTyping();
      offStopTyping();
      offOnline();
      chatService.leaveBookingRoom(bookingId);
      chatService.closeSocket();
    };
  }, [
    bookingId,
    isReady,
    otherUserId,
    user?.id,
    isScrolledToBottom, // ✅ added
    markReadMutation, // ✅ added
    queryClient, // ✅ added
  ]);

  // -------------------- INPUT HANDLERS --------------------
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!user) return;

    chatService.emitTyping({ bookingId, userId: user.id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      chatService.emitStopTyping({ bookingId, userId: user.id });
      typingTimeoutRef.current = null;
    }, 1500);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !otherUserId) return;

    const content = newMessage.trim();
    const tempId = Date.now().toString();
    const now = new Date().toISOString();

    const tempMessage: MessageWithDelivered = {
      id: tempId,
      bookingId,
      senderId: user.id,
      receiverId: otherUserId,
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
      (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page, i, arr) =>
                i === arr.length - 1
                  ? { ...page, messages: [...page.messages, tempMessage] }
                  : page
              ),
            }
          : old
    );

    chatService.sendMessageSocket({
      bookingId,
      content,
      senderId: user.id,
      receiverId: otherUserId,
      tempId,
    });

    sendMessageMutation.mutate({
      bookingId,
      content,
      senderId: user.id,
      receiverId: otherUserId,
      tempId,
    });

    setNewMessage("");
    setIsScrolledToBottom(true);
    setTimeout(scrollToBottom, 50);
  };

  // -------------------- SCROLL --------------------
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 20;
    setIsScrolledToBottom(isAtBottom);

    if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      const oldHeight = container.scrollHeight;
      fetchNextPage().then(() => {
        if (messagesContainerRef.current) {
          const newHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newHeight - oldHeight;
        }
      });
    }
  };

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
    setIsScrolledToBottom(true);
  };

  if (!bookingDetails || !user) return null;

  const otherUserName =
    otherUserProfileData?.name ??
    (user.id === bookingDetails.ownerId
      ? bookingDetails.renterName
      : bookingDetails.ownerName);

  const otherUserAvatar = otherUserProfileData?.profilePicture;

  // -------------------- RENDER --------------------
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
              {otherUserAvatar ? (
                <Image
                  src={otherUserAvatar}
                  alt={otherUserName ?? "User avatar"}
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <DefaultProfileIcon size={64} />
              )}
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  isUserOnline
                    ? "bg-green-500 animate-ping-once"
                    : "bg-gray-400"
                }`}
                title={
                  isUserOnline
                    ? "Online"
                    : lastSeen
                    ? `Last seen ${lastSeen}`
                    : "Offline"
                }
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
                {isOtherUserTyping
                  ? "Typing..."
                  : isUserOnline
                  ? "Online"
                  : lastSeen
                  ? `Last seen ${lastSeen}`
                  : "Offline"}
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
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="relative flex flex-col gap-2">
              {/* Date Separator */}
              <div className="flex justify-center my-2">
                <div className="relative inline-block px-4 py-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 text-white font-semibold rounded-full shadow-lg">
                  {formatDateGroup(date)}
                </div>
              </div>
              {msgs.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.senderId === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.senderId !== user.id && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1">
                      {msg.sender?.profilePicture ? (
                        <Image
                          src={msg.sender.profilePicture}
                          alt={msg.sender?.name ?? "User"}
                          width={32}
                          height={32}
                          className="object-cover rounded-full"
                        />
                      ) : (
                        <DefaultProfileIcon size={32} />
                      )}
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
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                    {msg.senderId === user.id && (
                      <div className="absolute bottom-0 right-0 translate-x-full -translate-y-1/2 flex items-center text-xs text-purple-200">
                        {msg.read ? (
                          <>
                            <CheckIconSolid className="w-3 h-3 -ml-0.5" />
                            <CheckIconSolid className="w-3 h-3 text-pink-300 -ml-1.5" />
                          </>
                        ) : msg.delivered ? (
                          <>
                            <CheckIconSolid className="w-3 h-3 -ml-0.5" />
                            <CheckIconSolid className="w-3 h-3 -ml-1.5" />
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 p-6 border-t border-gray-300 bg-white/70 backdrop-blur-xl"
        >
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="submit"
            className="p-3 bg-purple-700 text-white rounded-full hover:bg-purple-800"
          >
            <PaperAirplaneIcon className="w-5 h-5 rotate-90" />
          </button>
        </form>
      </div>

      {!isScrolledToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-10 p-3 rounded-full bg-purple-700 text-white shadow-lg hover:bg-purple-800"
        >
          <ArrowUpIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default BookingChat;
