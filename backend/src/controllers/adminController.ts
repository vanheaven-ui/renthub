import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllListings = async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        owner: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateListingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate that the status is a valid enum value
    if (!["PENDING", "APPROVED", "SUSPENDED"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid listing status provided." });
    }

    const updatedListing = await prisma.listing.update({
      where: { id: id },
      data: { status: status },
    });

    res.status(200).json({
      message: "Listing status updated successfully.",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Error updating listing status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete the listing and all its dependent data (bookings, reviews, etc.)
    await prisma.listing.delete({
      where: { id: id },
    });

    res.status(200).json({ message: "Listing deleted successfully." });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        listings: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
