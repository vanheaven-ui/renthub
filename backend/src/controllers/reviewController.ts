import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, rating, comment } = req.body;
    const reviewerId = req.user?.userId;

    if (!reviewerId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!listingId || !rating || !comment) {
      return res.status(400).json({ message: 'Please provide a listingId, rating, and comment.' });
    }

    // 1. Check if the user has a completed booking for this listing
    const completedBooking = await prisma.booking.findFirst({
      where: {
        renterId: reviewerId,
        listingId: listingId,
        paymentStatus: 'PAID', 
      },
    });

    if (!completedBooking) {
      return res.status(403).json({
        message: 'You can only review listings you have successfully rented.',
      });
    }

    // 2. Check if the user has already reviewed this listing
    const existingReview = await prisma.review.findFirst({
      where: {
        authorId: reviewerId,
        listingId: listingId,
      },
    });

    if (existingReview) {
      return res.status(409).json({
        message: 'You have already reviewed this listing.',
      });
    }

    // 3. Create the new review in the database
    const newReview = await prisma.review.create({
      data: {
        listingId: listingId,
        rating: Number(rating),
        comment: comment,
        authorId: reviewerId,
      },
    });

    res.status(201).json({
      message: 'Review submitted successfully.',
      review: newReview,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getListingReviews = async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;

    const reviews = await prisma.review.findMany({
      where: {
        listingId: listingId,
      },
      // You can also include the reviewer's name
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};