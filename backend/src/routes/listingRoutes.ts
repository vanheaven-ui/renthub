import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { createListing, getListings } from "../controllers/listingController";
import multer from "multer";

const router = Router();

// Configure Multer 
const upload = multer({ dest: "uploads/" }); // files will temporarily go to ./uploads

// POST /listings
// Use Multer middleware to handle multiple images, then authenticate, then create listing
router.post(
  "/",
  authenticateToken,
  upload.array("images", 5), // 'images' is the field name from the frontend form
  createListing
);

// GET /listings
router.get("/", getListings);

export default router;
