// lib/dateUtil.ts
import { format, isToday, isYesterday } from "date-fns";
import { MessageWithDelivered } from "@/types";

/**
 * Groups messages by their date (YYYY-MM-DD)
 */
export const groupMessagesByDate = (
  messages: MessageWithDelivered[]
): Record<string, MessageWithDelivered[]> => {
  return messages.reduce((acc, msg) => {
    const dateKey = msg.createdAt.split("T")[0]; // "YYYY-MM-DD"
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {} as Record<string, MessageWithDelivered[]>);
};

/**
 * Formats a date string for display in the chat
 * Returns "Today", "Yesterday", or formatted date
 */
export const formatDateGroup = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM dd, yyyy"); // e.g., Oct 15, 2025
};
