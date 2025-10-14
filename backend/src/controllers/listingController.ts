import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { supabase, supabaseBucket } from "../config/supabase";
import { prisma } from "../lib/prisma";

// Accept Multer files array OR object
interface CreateListingRequest extends AuthRequest {
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

// Accept Multer files array OR object
interface EditListingRequest extends AuthRequest {
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

    const images: Express.Multer.File[] = Array.isArray(req.files)
      ? req.files
      : (Object.values(req.files || {}).flat() as Express.Multer.File[]);

    if (!req.user?.userId)
      return res.status(401).json({ message: "User not authenticated" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user || user.role !== "OWNER")
      return res
        .status(403)
        .json({ message: "Only owners can create listings." });

    if (images.length === 0)
      return res
        .status(400)
        .json({ message: "At least one image is required." });

    const uploadedImages: string[] = [];

    for (const file of images) {
      const filePath = `${Date.now()}-${file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from(supabaseBucket)
        .upload(filePath, file.buffer, { contentType: file.mimetype });

      if (uploadError)
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadError.message });

      uploadedImages.push(filePath);
    }

    const newListing = await prisma.listing.create({
      data: {
        title,
        description,
        pricePerDay: Number(pricePerDay),
        location,
        images: uploadedImages,
        ownerId: req.user.userId,
        category,
      },
      include: { owner: true, bookings: true },
    });

    res
      .status(201)
      .json({ message: "Listing created successfully", listing: newListing });
  } catch (error) {
    console.error("Error in createListing:", error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

/**
 * Get all listings with optional filters and signed URLs
 */
export const getListings = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, minPrice, maxPrice, location } = req.query;
    const userId = req.user?.userId;
    const where: any = {};

    if (search)
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];

    if (category) where.category = String(category);
    if (location)
      where.location = { contains: String(location), mode: "insensitive" };
    if (minPrice || maxPrice) {
      where.pricePerDay = {};
      if (minPrice) where.pricePerDay.gte = Number(minPrice);
      if (maxPrice) where.pricePerDay.lte = Number(maxPrice);
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, profilePicture: true } },
        bookings: { select: { renterId: true, status: true } },
      },
    });

    let bookedListingIds: string[] = [];
    if (userId) {
      const myBookings = await prisma.booking.findMany({
        where: { renterId: userId, status: { in: ["CONFIRMED", "PENDING"] } },
        select: { listingId: true },
      });
      bookedListingIds = myBookings.map((b) => b.listingId);
    }

    const listingsWithFlags = await Promise.all(
      listings.map(async (listing) => {
        const signedImages = await Promise.all(
          listing.images.map(async (filePath: string) => {
            const { data } = await supabase.storage
              .from(supabaseBucket)
              .createSignedUrl(filePath, 60 * 60);
            return data?.signedUrl || filePath;
          })
        );

        return {
          ...listing,
          images: signedImages,
          alreadyBooked: bookedListingIds.includes(listing.id),
        };
      })
    );

    res.status(200).json(listingsWithFlags);
  } catch (error) {
    console.error("Error in getListings:", error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

/**
 * Get listing by ID with signed URLs and alreadyBooked flag
 */
export const getListingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!id) return res.status(400).json({ message: "Listing ID is required" });

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, profilePicture: true } },
        bookings: { select: { renterId: true, status: true } },
      },
    });

    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const alreadyBooked =
      userId &&
      listing.bookings.some(
        (b) =>
          b.renterId === userId &&
          ["CONFIRMED", "PENDING"].includes(b.status as string)
      );

    const signedImages = await Promise.all(
      listing.images.map(async (filePath: string) => {
        const { data } = await supabase.storage
          .from(supabaseBucket)
          .createSignedUrl(filePath, 60 * 60);
        return data?.signedUrl || filePath;
      })
    );

    res.status(200).json({ ...listing, images: signedImages, alreadyBooked });
  } catch (error) {
    console.error("Error in getListingById:", error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

/**
 * Get listings owned by the currently logged-in user
 */
export const getMyListings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res.status(401).json({ message: "User not authenticated" });

    const myListings = await prisma.listing.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, profilePicture: true } },
        bookings: { select: { renterId: true, status: true, createdAt: true } },
      },
    });

    const listingsWithSignedUrls = await Promise.all(
      myListings.map(async (listing) => {
        const signedImages = await Promise.all(
          listing.images.map(async (filePath: string) => {
            const { data } = await supabase.storage
              .from(supabaseBucket)
              .createSignedUrl(filePath, 60 * 60);
            return data?.signedUrl || filePath;
          })
        );
        return { ...listing, images: signedImages };
      })
    );

    res.status(200).json(listingsWithSignedUrls);
  } catch (error) {
    console.error("Error in getMyListings:", error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

/**
 * Edit a listing (Owner only)
 * Allows adding and removing images
 */
export const editListing = async (req: EditListingRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      pricePerDay,
      location,
      category,
      removeImages,
    } = req.body;

    if (!req.user?.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.ownerId !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized: Not the owner" });
    }

    // Normalize Multer files
    const images: Express.Multer.File[] = Array.isArray(req.files)
      ? req.files
      : (Object.values(req.files || {}).flat() as Express.Multer.File[]);

    // Start with existing images
    let updatedImages: string[] = [...listing.images];

    // --- Handle Image Removal ---
    if (removeImages) {
      const imagesToRemove = Array.isArray(removeImages)
        ? removeImages
        : JSON.parse(removeImages); // in case frontend sends JSON string

      for (const imgPath of imagesToRemove) {
        // Delete from Supabase
        await supabase.storage.from(supabaseBucket).remove([imgPath]);

        // Remove from DB array
        updatedImages = updatedImages.filter((img) => img !== imgPath);
      }
    }

    // --- Handle New Image Uploads ---
    if (images.length > 0) {
      for (const file of images) {
        const filePath = `${Date.now()}-${file.originalname}`;
        const { error: uploadError } = await supabase.storage
          .from(supabaseBucket)
          .upload(filePath, file.buffer, { contentType: file.mimetype });

        if (uploadError) {
          console.error("Supabase upload error:", uploadError.message);
          return res.status(500).json({
            message: "Image upload failed",
            error: uploadError.message,
          });
        }

        updatedImages.push(filePath);
      }
    }

    // --- Update Listing (Partial Update) ---
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        title: title ?? listing.title,
        description: description ?? listing.description,
        pricePerDay: pricePerDay ? Number(pricePerDay) : listing.pricePerDay,
        location: location ?? listing.location,
        category: category ?? listing.category,
        images: updatedImages,
      },
    });

    res.status(200).json({
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Error in editListing:", error);
    res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
