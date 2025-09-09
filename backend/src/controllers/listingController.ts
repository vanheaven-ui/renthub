import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";
import { supabase, supabaseBucket } from "../config/supabase";

const prisma = new PrismaClient();

// Accept Multer files array OR object
interface CreateListingRequest extends AuthRequest {
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

/**
 * Create a new listing (Owner only)
 */
export const createListing = async (
  req: CreateListingRequest,
  res: Response
) => {
  try {
    const { title, description, pricePerDay, location, category } = req.body;

    // Normalize Multer files
    const images: Express.Multer.File[] = Array.isArray(req.files)
      ? req.files
      : (Object.values(req.files || {}).flat() as Express.Multer.File[]);

    if (!req.user?.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user || user.role !== "OWNER") {
      return res
        .status(403)
        .json({ message: "Only owners can create listings." });
    }

    if (images.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required." });
    }

    // Upload images to Supabase Storage (private bucket)
    const uploadedImages: string[] = [];

    for (const file of images) {
      const filePath = `${Date.now()}-${file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from(supabaseBucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError.message);
        return res.status(500).json({
          message: "Image upload failed",
          error: uploadError.message,
        });
      }

      uploadedImages.push(filePath);
    }

    // Save listing in DB
    const newListing = await prisma.listing.create({
      data: {
        title,
        description,
        pricePerDay: Number(pricePerDay),
        location,
        images: uploadedImages, // Save file paths, not signed URLs
        ownerId: req.user.userId,
        category,
      },
    });

    res.status(201).json({
      message: "Listing created successfully",
      listing: newListing,
    });
  } catch (error) {
    console.error("Error in createListing:", error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

/**
 * Get listings with optional filters
 * Generates signed URLs for private bucket images
 */
export const getListings = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, minPrice, maxPrice, location } = req.query;
    const userId = req.user?.userId;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }

    if (category) where.category = String(category);
    if (location) {
      where.location = { contains: String(location), mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      where.pricePerDay = {};
      if (minPrice) where.pricePerDay.gte = Number(minPrice);
      if (maxPrice) where.pricePerDay.lte = Number(maxPrice);
    }

    if (userId) {
      const myBookings = await prisma.booking.findMany({
        where: { renterId: userId },
        select: { listingId: true },
      });

      const bookedListingIds = myBookings.map((b) => b.listingId);

      // Filter out listings the user owns or has booked
      where.id = { notIn: bookedListingIds };
      where.ownerId = { not: userId };
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Generate signed URLs for private images
    const listingsWithUrls = await Promise.all(
      listings.map(async (listing) => {
        const signedImages = await Promise.all(
          listing.images.map(async (filePath: string) => {
            const { data, error } = await supabase.storage
              .from(supabaseBucket)
              .createSignedUrl(filePath, 60 * 60);

            if (error || !data?.signedUrl) {
              console.error("Failed to generate signed URL:", error?.message);
              return filePath; // fallback
            }

            return data.signedUrl;
          })
        );

        return {
          ...listing,
          images: signedImages,
        };
      })
    );

    res.status(200).json(listingsWithUrls);
  } catch (error) {
    console.error("Error in getListings:", error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

/**
 * Get a single listing by ID
 * Generates signed URLs for private bucket images
 */
export const getListingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Listing ID is required" });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const signedImages = await Promise.all(
      listing.images.map(async (filePath: string) => {
        const { data, error } = await supabase.storage
          .from(supabaseBucket)
          .createSignedUrl(filePath, 60 * 60);

        if (error || !data?.signedUrl) {
          console.error("Failed to generate signed URL:", error?.message);
          return filePath; // fallback
        }

        return data.signedUrl;
      })
    );

    res.status(200).json({
      ...listing,
      images: signedImages,
    });
  } catch (error) {
    console.error("Error in getListingById:", error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
