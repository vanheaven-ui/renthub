import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

interface CreateListingRequest extends AuthRequest {
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

export const createListing = async (
  req: CreateListingRequest,
  res: Response
) => {
  try {
    const { title, description, pricePerDay, location, category } = req.body;

    const images: Express.Multer.File[] = Array.isArray(req.files)
      ? req.files
      : (Object.values(req.files || {}).flat() as Express.Multer.File[]);

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== "OWNER") {
      return res
        .status(403)
        .json({ message: "Only owners can create listings." });
    }

    if (!images || images.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required." });
    }

    const uploadedImages = await Promise.all(
      images.map((file) =>
        cloudinary.uploader.upload(file.path, {
          folder: "listings",
        })
      )
    );

    const imageUrls = uploadedImages.map((img) => img.secure_url);

    const newListing = await prisma.listing.create({
      data: {
        title,
        description,
        pricePerDay: Number(pricePerDay),
        location,
        images: imageUrls,
        ownerId: userId,
        category,
      },
    });

    res.status(201).json({
      message: "Listing created successfully",
      listing: newListing,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getListings = async (req: Request, res: Response) => {
  try {
    const { search, category, minPrice, maxPrice, location } = req.query;

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

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(listings);
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};
