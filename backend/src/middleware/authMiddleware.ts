import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "my_fallback_secret";

// Update the AuthRequest interface to include the 'lastSeen' property
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: 'ADMIN' | 'OWNER' | 'RENTER';
    lastSeen?: Date; 
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token is required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    
    req.user = decoded;

    // Use a try-catch block for the database update to prevent a failed update from
    // blocking the entire request flow
    try {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { lastSeen: new Date() },
      });
    } catch (dbError) {
      console.error("Failed to update last seen timestamp:", dbError);
      // We don't want to block the request just because the lastSeen update failed,
      // so we continue to the next middleware.
    }

    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};