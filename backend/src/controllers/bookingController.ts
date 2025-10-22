import { Request, Response } from "express";
import { BookingStatus } from "@prisma/client";
import { supabase, supabaseBucket } from "../config/supabase";
import { AuthRequest } from "../middleware/authMiddleware";
import { emitBookingStatusUpdate } from "../lib/socketHelper";
import { io } from "../socket";
import { prisma } from "../lib/prisma";

/**
 * Helper to convert file paths to public URLs
 */
const toPublicUrls = (filePaths: string[] = []) => {
  return filePaths.map((filePath) => {
    const { data } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(filePath);
    return data.publicUrl;
  });
};

/**
 * Create a new booking
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, startDate, endDate } = req.body;
    const renterId = req.user?.userId;

    if (!renterId)
      return res.status(401).json({ message: "User not authenticated." });
    if (!listingId || !startDate || !endDate)
      return res
        .status(400)
        .json({ message: "All booking fields are required." });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end)
      return res.status(400).json({ message: "Invalid booking dates." });

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing)
      return res.status(404).json({ message: "Listing not found." });
    if (listing.ownerId === renterId)
      return res
        .status(403)
        .json({ message: "You cannot book your own listing." });

    // Check overlapping bookings
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        listingId,
        AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (overlappingBooking) {
      return res.status(400).json({
        message: `This listing is already booked from ${overlappingBooking.startDate.toDateString()} to ${overlappingBooking.endDate.toDateString()}. Please choose different dates.`,
        existingBooking: overlappingBooking,
      });
    }

    const dayCount = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = dayCount * listing.pricePerDay;

    const newBooking = await prisma.booking.create({
      data: {
        listingId,
        renterId,
        ownerId: listing.ownerId,
        startDate: start,
        endDate: end,
        totalPrice,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      include: {
        listing: {
          select: {
            title: true,
            location: true,
            pricePerDay: true,
            images: true,
          },
        },
      },
    });

    // Convert images to public URLs
    newBooking.listing.images = toPublicUrls(newBooking.listing.images);

    // Emit event to owner
    io.to(listing.ownerId).emit("newBooking", {
      bookingId: newBooking.id,
      listingId,
      renterId,
      startDate: newBooking.startDate,
      endDate: newBooking.endDate,
      totalPrice: newBooking.totalPrice,
      status: newBooking.status,
    });

    res.status(201).json({
      message: "Booking created successfully. You can now proceed to payment.",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Get bookings of current user (as renter or owner)
 */
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res.status(401).json({ message: "User not authenticated." });

    const bookings = await prisma.booking.findMany({
      where: { OR: [{ renterId: userId }, { ownerId: userId }] },
      include: {
        listing: { select: { title: true, location: true, images: true } },
        renter: { select: { name: true, email: true } },
        owner: { select: { name: true, email: true } },
        messages: {
          select: {
            id: true,
            read: true,
            senderId: true,
            receiverId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const processedBookings = bookings.map((booking) => {
      if (booking.listing?.images?.length) {
        booking.listing.images = toPublicUrls(booking.listing.images);
      }
      return booking;
    });

    res.status(200).json(processedBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Get booking by listing
 */
export const getBookingByListing = async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.query;

    const booking = await prisma.booking.findFirst({
      where: {
        listingId,
        OR: [{ renterId: String(userId) }, { ownerId: String(userId) }],
      },
      include: { listing: true },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.listing?.images?.length) {
      booking.listing.images = toPublicUrls(booking.listing.images);
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking by listing:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: true,
        renter: true,
        owner: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (booking.renterId !== userId && booking.ownerId !== userId)
      return res
        .status(403)
        .json({ message: "Not authorized to view this booking." });

    if (booking.listing?.images?.length) {
      booking.listing.images = toPublicUrls(booking.listing.images);
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Update booking status (owner only)
 */
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!userId)
      return res.status(401).json({ message: "User not authenticated." });
    if (!status)
      return res.status(400).json({ message: "Status is required." });

    const validStatuses = Object.values(BookingStatus);
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid booking status." });

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    // ----------------- 🔹 MODIFIED: allow any logged-in user -----------------
    // Old: if (booking.ownerId !== userId) return 403
    // New: any logged-in user can auto-update the status
    // ------------------------------------------------------------------------

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        listing: { select: { title: true, location: true } },
        renter: { select: { name: true, email: true } },
        owner: { select: { name: true, email: true } },
      },
    });

    // Emit update to renter
    emitBookingStatusUpdate(booking.renterId, updatedBooking.id, status);

    res.status(200).json({
      message: `Booking status updated to ${status}.`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
