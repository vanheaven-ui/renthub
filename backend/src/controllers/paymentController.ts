import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";
import Flutterwave from "flutterwave-node-v3";

const prisma = new PrismaClient();
const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY as string,
  process.env.FLUTTERWAVE_SECRET_KEY as string
);

// export const initiatePayment = async (req: AuthRequest, res: Response) => {
//   try {
//     const { bookingId, phone_number, full_name, email } = req.body;
//     const userId = req.user?.userId;

//     if (!userId) {
//       return res.status(401).json({ message: "User not authenticated." });
//     }

//     // 1. Fetch the booking and listing details
//     const booking = await prisma.booking.findUnique({
//       where: { id: bookingId },
//       include: {
//         listing: true, // Include the related listing to get its owner's email
//       },
//     });

//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found." });
//     }

//     // 2. Ensure the authenticated user is the one who made the booking
//     if (booking.renterId !== userId) {
//       return res
//         .status(403)
//         .json({ message: "You are not authorized to pay for this booking." });
//     }

//     // 3. Prepare the payment payload for Flutterwave
//     const payload = {
//       tx_ref: `rentals-ug-${Date.now()}-${booking.id}`,
//       amount: booking.totalPrice.toString(),
//       currency: "UGX", // Uganda Shillings
//       network: "MTN", // MTN is a good starting point.
//       fullname: full_name,
//       phone_number: phone_number,
//       email: email,
//       redirect_url: process.env.FLUTTERWAVE_REDIRECT_URL,
//     };

//     // 4. Initiate the mobile money payment using Flutterwave's SDK
//     const response = await flw.MobileMoney.uganda(payload);

//     if (response.status === "success") {
//       // 5. Update the booking status to pending in your database
//       await prisma.booking.update({
//         where: { id: booking.id },
//         data: {
//           paymentStatus: "PENDING",
//           transactionId: response.data.tx_ref, // Store Flutterwave's transaction reference
//         },
//       });

//       // Send a success response back to the frontend
//       return res.status(200).json({
//         message:
//           "Payment initiation successful. Please complete the transaction on your phone.",
//         data: response.data,
//       });
//     } else {
//       return res.status(400).json({
//         message: "Payment initiation failed.",
//         error: response.message,
//       });
//     }
//   } catch (error) {
//     console.error("Error initiating payment:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

export const initiatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, phone_number, full_name, email } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.renterId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to pay for this booking." });
    }

    const payload = {
      tx_ref: `rentals-ug-${Date.now()}-${booking.id}`,
      amount: booking.totalPrice.toString(),
      currency: "UGX",
      network: "MTN",
      fullname: full_name,
      phone_number: phone_number,
      email: email,
      redirect_url: process.env.FLUTTERWAVE_REDIRECT_URL,
    };

    const response = await flw.MobileMoney.uganda(payload);

    // Check for a successful redirect response
    if (
      response.status === "success" &&
      response.meta?.authorization?.redirect
    ) {
      // 1. Update the booking status to PENDING
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PENDING",
          // The transaction ID may not be immediately available here, so handle this
          // in the webhook on final confirmation
          transactionId: response.data?.flw_ref || response.data?.id,
        },
      });

      // 2. Respond to the client with the redirect URL
      return res.status(200).json({
        message: "Redirecting to payment page.",
        data: {
          link: response.meta.authorization.redirect,
        },
      });
    } else {
      // Handle cases where the top-level status is not 'success' or the redirect URL is missing
      console.error(
        "Flutterwave payment initiation failed with an unexpected response:",
        response
      );
      return res.status(400).json({
        message: "Payment initiation failed.",
        error:
          response.message ||
          "An unexpected response was received from the payment provider.",
      });
    }
  } catch (error: any) {
    console.error("Error initiating payment:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers["verif-hash"];

  if (!signature || (signature as string) !== secretHash) {
    // This request is not from Flutterwave. Reject it.
    return res
      .status(401)
      .json({ status: "error", message: "Invalid webhook signature" });
  }

  // Get the event data from the request body
  const payload = req.body;

  try {
    // Check if the transaction was successful
    if (payload.status === "successful" && payload.currency === "UGX") {
      const transactionRef = payload.txRef;

      // Use Flutterwave's verification endpoint to be sure of the transaction's status
      const response = await flw.Transaction.verify({ id: transactionRef });

      if (response.data.status === "successful") {
        const booking = await prisma.booking.findFirst({
          where: { transactionId: transactionRef },
        });

        if (booking && booking.paymentStatus !== "PAID") {
          // Update the booking status to PAID
          await prisma.booking.update({
            where: { id: booking.id },
            data: { paymentStatus: "PAID" },
          });
          console.log(`Booking ${booking.id} has been marked as PAID.`);
        }
      }
    }
    // Return a 200 OK status to Flutterwave to acknowledge receipt
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
