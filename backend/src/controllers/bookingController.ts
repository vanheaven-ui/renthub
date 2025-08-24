import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { listingId, startDate, endDate } = req.body;
    const renterId = req.user?.userId;

    if (!renterId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    if (!listingId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "All booking fields are required." });
    }

    // 1. Fetch the listing to get its price and ownerId
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    // 2. Prevent a user from booking their own listing
    if (listing.ownerId === renterId) {
      return res
        .status(403)
        .json({ message: "You cannot book your own listing." });
    }

    // 3. Calculate total price based on the number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayCount = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const totalPrice = dayCount * listing.pricePerDay;

    // 4. Create the booking entry in the database
    const newBooking = await prisma.booking.create({
      data: {
        listingId,
        renterId,
        ownerId: listing.ownerId,
        startDate: start,
        endDate: end,
        totalPrice,
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

    res.status(201).json({
      message: "Booking created successfully. You can now proceed to payment.",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [{ renterId: userId }, { ownerId: userId }],
      },
      include: {
        listing: {
          select: {
            title: true,
            location: true,
            images: true,
          },
        },
        renter: {
          select: {
            name: true,
            email: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
