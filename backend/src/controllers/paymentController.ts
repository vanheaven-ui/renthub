import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Flutterwave from "flutterwave-node-v3";
import { prisma } from "../lib/prisma";
import { generateOtp } from "../lib/otp";

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY as string,
  process.env.FLUTTERWAVE_SECRET_KEY as string
);

// ----------------- Generate OTP -----------------
export const generatePaymentOtp = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user?.userId;

    if (!userId)
      return res.status(401).json({ message: "User not authenticated." });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (booking.renterId !== userId)
      return res
        .status(403)
        .json({ message: "You are not authorized to pay for this booking." });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    await prisma.paymentOtp.upsert({
      where: { bookingId },
      update: { otp, expiresAt },
      create: { bookingId, otp, expiresAt },
    });

    return res.status(200).json({
      message: "Payment OTP generated.",
      data: { otp },
    });
  } catch (error: any) {
    console.error("Error generating OTP:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ----------------- Initiate Payment -----------------
export const initiatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, phone_number, full_name, email } = req.body;
    const userId = req.user?.userId;

    if (!userId)
      return res.status(401).json({ message: "User not authenticated." });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (booking.renterId !== userId)
      return res
        .status(403)
        .json({ message: "You are not authorized to pay for this booking." });

    // Flutterwave payment payload
    const payload = {
      tx_ref: `rentals-ug-${Date.now()}-${booking.id}`,
      amount: booking.totalPrice.toString(),
      currency: "UGX",
      network: "MTN",
      fullname: full_name,
      phone_number,
      email,
      redirect_url: process.env.FLUTTERWAVE_REDIRECT_URL,
    };

    const response = await flw.MobileMoney.uganda(payload);

    if (
      response.status === "success" &&
      response.meta?.authorization?.redirect
    ) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PENDING",
          transactionId: response.data?.flw_ref || response.data?.id,
        },
      });

      return res.status(200).json({
        message: "Payment initiated. Complete on your phone.",
        data: { link: response.meta.authorization.redirect },
      });
    }

    return res
      .status(400)
      .json({ message: "Payment initiation failed.", error: response.message });
  } catch (error: any) {
    console.error("Error initiating payment:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ----------------- Verify OTP -----------------
export const verifyOtp = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, otp } = req.body;

    const record = await prisma.paymentOtp.findUnique({ where: { bookingId } });
    if (!record) return res.status(404).json({ message: "OTP not found." });

    if (record.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired." });

    if (record.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP." });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "PAID" },
    });

    await prisma.paymentOtp.delete({ where: { bookingId } });

    return res
      .status(200)
      .json({ success: true, message: "Payment verified successfully." });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
