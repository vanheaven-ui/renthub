import { format, isToday, isYesterday, isValid } from "date-fns";
import { MessageWithDelivered } from "@/types";

/**
 * Groups messages by their date (YYYY-MM-DD)
 * Example output:
 * {
 *   "2025-11-01": [msg1, msg2],
 *   "2025-10-31": [msg3]
 * }
 */
export const groupMessagesByDate = (
  messages: MessageWithDelivered[]
): Record<string, MessageWithDelivered[]> => {
  return messages.reduce((acc, msg) => {
    if (!msg?.createdAt) return acc; // skip if timestamp missing

    // Extract just the date portion from ISO string
    const dateKey = msg.createdAt.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);

    return acc;
  }, {} as Record<string, MessageWithDelivered[]>);
};

/**
 * Formats a date string into human-friendly form
 * - "Today" if it's today
 * - "Yesterday" if it's yesterday
 * - Else: "Nov 01, 2025"
 */
export const formatDateGroup = (dateString: string): string => {
  if (!dateString) return "Unknown Date";

  const date = new Date(dateString);

  // Handle invalid date values safely
  if (!isValid(date)) {
    console.warn("⚠️ Invalid date encountered in formatDateGroup:", dateString);
    return "Unknown Date";
  }

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  return format(date, "MMM dd, yyyy");
};

/**
 * Formats a timestamp (ISO string) into a short time like "2:45 PM"
 */
export const formatTime = (timestamp: string): string => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (!isValid(date)) return "";

  return format(date, "h:mm a");
};

/**
 * Formats a timestamp into both date and time e.g. "Nov 01, 2025 • 2:45 PM"
 */
export const formatFullDateTime = (timestamp: string): string => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (!isValid(date)) return "";

  return format(date, "MMM dd, yyyy • h:mm a");
};
