import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "../lib/prisma"; 

const ai = new GoogleGenAI({});

// -----------------------------
// Helper Function: Call Gemini API (Modified)
// -----------------------------

/**
 * Sends a query to the Gemini model with a specific system instruction
 * and optional context from the P2P application.
 * @param query The user's question.
 * @param context Optional additional information (e.g., specific listing details).
 * @returns The AI's generated text response.
 */
async function getUgandaRentalExpertResponse(
  query: string,
  context?: string
): Promise<string> {
  const systemInstruction = `
        You are an **Uganda Rental Business Expert AI** for a Peer-to-Peer Rental platform.
        Your function is to provide comprehensive, exhaustive, and detailed responses specific to the
        Ugandan rental context (laws, market trends, investment).
        
        ${
          context
            ? `
        **IMPORTANT CONTEXT:** The user is currently interacting with the platform regarding the following information:
        ---
        ${context}
        ---
        Use this context to tailor your advice, but do not hallucinate information not present in the context.
        `
            : ""
        }

        Ensure your responses are highly informative, professional, and specific to the Ugandan context.
    `;

  try {
    const fullQuery = context
      ? `Question based on the context: ${query}`
      : query;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullQuery,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    return response.text ?? "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from AI expert.");
  }
}

// -----------------------------
// POST /ai-hubspot/ask-expert
// -----------------------------

/**
 * Handles user questions, potentially including context from a specific booking or listing.
 * Expected Request Body: { question: string, listingId?: string }
 */
export const askUgandaRentalExpert = async (req: Request, res: Response) => {
  const { question, listingId } = req.body;
  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "A valid question is required." });
  }

  let context: string | undefined;

  // **NEW P2P LOGIC:** Fetch specific listing details if provided
  if (listingId) {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          title: true,
          description: true,
          location: true,
          pricePerDay: true,
          rules: true,
        },
      });

      if (listing) {
        context = `Listing ID: ${listingId}, Title: ${listing.title}, Location: ${listing.location}, Price: ${listing.pricePerDay} UGX, Description: ${listing.description}, Rules: ${listing.rules}`;
      }
    } catch (dbError) {
      console.warn(
        "Could not fetch listing context. Proceeding without context.",
        dbError
      );
      // Non-fatal: continue without context
    }
  }

  try {
    const aiResponse = await getUgandaRentalExpertResponse(question, context);

    res.status(200).json({
      success: true,
      question,
      answer: aiResponse,
      source: "Uganda Rental Business Expert AI (Gemini 2.5 Flash)",
      contextUsed: !!context,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred on the server.";
    console.error("Controller Error:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
};

// -----------------------------------------------
// NEW AI HELPER: AI-Powered Listing Description
// -----------------------------------------------
export const generateListingDescription = async (
  req: Request,
  res: Response
) => {
  const { basicDetails } = req.body;

  if (!basicDetails) {
    return res
      .status(400)
      .json({ error: "Basic details are required to generate a description." });
  }

  const prompt = `
        As the Uganda Rental Business Expert AI, generate a highly compelling, professional, and SEO-friendly 
        listing description for a P2P rental platform based on the following raw details: 
        
        Details: "${basicDetails}". 
        
        The description must be exhaustive, organized into sections (e.g., Highlights, Location, Why Choose This Property), 
        and specifically appealing to the **Ugandan rental market**. The output should only be the description text.
    `;

  try {
    const response = await getUgandaRentalExpertResponse(prompt);

    res.status(200).json({
      success: true,
      generatedDescription: response,
    });
  } catch (error) {
    console.error("Error generating listing description:", error);
    res.status(500).json({ error: "Failed to generate listing description." });
  }
};
