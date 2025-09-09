import { BookingStatus } from "@prisma/client";
import { io } from "../socket";

export const emitBookingStatusUpdate = (
  renterId: string,
  bookingId: string,
  status: BookingStatus
) => {
  if (!io) return;
  io.to(renterId).emit("bookingStatusUpdated", { bookingId, status });
};
