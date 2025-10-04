import { Router } from "express";
import {
  askUgandaRentalExpert,
  generateListingDescription,
} from "../controllers/aiController";

// Create a new Express router instance
const router = Router();

// ------------------------------------
// AI Hubspot Routes for P2P Rental App
// ------------------------------------

// POST /ai-hubspot/ask-expert
// Purpose: Allows users to ask questions to the Uganda Rental Expert AI,
//          optionally providing a listingId for context-aware advice.
router.post("/ask-expert", askUgandaRentalExpert);

// POST /ai-hubspot/generate-description
// Purpose: A unique P2P feature that generates a professional,
//          locally-optimized listing description from basic input details.
router.post("/generate-description", generateListingDescription);

export default router;
