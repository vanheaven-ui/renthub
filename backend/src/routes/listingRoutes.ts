import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  createListing,
  getListings,
  getListingById,
  getMyListings,
  editListing, 
} from "../controllers/listingController";
import multer from "multer";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /listings
router.post("/", authenticateToken, upload.array("images", 5), createListing);

// PATCH /listings/:id <-- new route for editing
router.patch("/:id", authenticateToken, upload.array("images", 5), editListing);

// GET /listings
router.get("/", getListings);

// GET /listings/my-listings
router.get("/my-listings", authenticateToken, getMyListings);

// GET /listings/:id
router.get("/:id", getListingById);

export default router;
