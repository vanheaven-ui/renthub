import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { createListing, getListings } from "../controllers/listingController";
import multer from "multer";

const router = Router();

// Use Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /listings
router.post(
  "/",
  authenticateToken,
  upload.array("images", 5), // 'images' is the field name from the frontend
  createListing
);

// GET /listings
router.get("/", getListings);

export default router;
