import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { createListing, getListings, getListingById } from "../controllers/listingController";
import multer from "multer";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /listings
router.post(
  "/",
  authenticateToken,
  upload.array("images", 5),
  createListing
);

// GET /listings
router.get("/", getListings);

// GET /listings/:id
router.get("/:id", getListingById);

export default router;
