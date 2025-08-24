import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const getBookingMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    // Verify user is part of the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || (booking.renterId !== userId && booking.ownerId !== userId)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const messages = await prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};