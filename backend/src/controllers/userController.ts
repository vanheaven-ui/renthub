import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @route GET /api/users/:userId
 * @desc Get public profile data for a specific user
 * @access Public (or protected if needed)
 */
export const getUserById = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      // Select only the public data you want to expose
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        role: true,
        lastSeen: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    console.error("Error fetching user data by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
