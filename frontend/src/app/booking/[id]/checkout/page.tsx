"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookingById, generatePaymentOtp, verifyOtp } from "@/lib/api";
import { Booking, VerifyOtpPayload, VerifyOtpResponse } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";
import OTPInput from "@/components/OTPInput";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatNumber } from "@/lib/formatNumbers";

enum PaymentStep {
  Info = 1,
  OTP,
  Complete,
}

const OTP_RESEND_DELAY = 30;

const CheckoutPage = () => {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  // Normalize bookingId to string
  const bookingId = Array.isArray(params?.id) ? params.id[0] : params?.id || "";

  const [step, setStep] = useState<PaymentStep>(PaymentStep.Info);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(OTP_RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [otpErrorShake, setOtpErrorShake] = useState(false);
  const [otpSuccessPulse, setOtpSuccessPulse] = useState(false);

  // ----------------- Fetch booking -----------------
  const {
    data: booking,
    isLoading,
    error,
  } = useQuery<Booking, Error>({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
  });

  // ----------------- OTP Query -----------------
  const {
    data: otpData,
    refetch: refetchOtp,
    isFetching: otpLoading,
  } = useQuery<{ otp: string }, Error>({
    queryKey: ["paymentOtp", bookingId],
    queryFn: async () => {
      const res = await generatePaymentOtp(bookingId);
      return res; // unwrap the { otp: string } from your API response
    },
    enabled: false, // only generate OTP when triggered
  });

  // ----------------- OTP Verification -----------------
  const verifyMutation = useMutation<
    VerifyOtpResponse,
    Error,
    VerifyOtpPayload
  >({
    mutationFn: ({ bookingId, otp }) => verifyOtp({ bookingId, otp }),
    onSuccess: () => {
      toast.success("Payment completed successfully!");
      setOtpSuccessPulse(true);
      setTimeout(() => setOtpSuccessPulse(false), 1000);
      setStep(PaymentStep.Complete);
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      setTimeout(() => router.push(`/user/bookings/${bookingId}`), 2500);
    },
    onError: (err: Error) => {
      toast.error(err?.message || "Invalid OTP.");
      setOtpErrorShake(true);
      setTimeout(() => setOtpErrorShake(false), 600);
    },
    onSettled: () => setIsProcessing(false),
  });

  // ----------------- Pre-fill user info -----------------
  useEffect(() => {
    if (booking?.renter) {
      setFullName(booking.renter.name || "");
      setEmail(booking.renter.email || "");
    }
  }, [booking?.renter]);

  // ----------------- OTP resend countdown -----------------
  useEffect(() => {
    if (step === PaymentStep.OTP) {
      setCanResend(false);
      setResendCountdown(OTP_RESEND_DELAY);
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  // ----------------- Handlers -----------------
  const handleGenerateOtp = async () => {
    if (!booking) return toast.error("Booking not found.");
    if (!fullName || !email || !phoneNumber)
      return toast.error("All fields are required.");

    setIsProcessing(true);
    try {
      const otp = await refetchOtp();

      if (otp) {
        toast.success(
          "Demo OTP generated! In reality, this would be sent to the user."
        );
        setStep(PaymentStep.OTP);
      } else {
        toast.error("Failed to receive OTP from the server.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while generating OTP.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOtp = () => {
    const finalOtp = otp || otpData?.otp || "";
    if (!finalOtp) return toast.error("Enter OTP to continue.");

    setIsProcessing(true);
    verifyMutation.mutate({ bookingId, otp: finalOtp });
  };

  const handleResendOtp = async () => {
    if (!booking) return;
    setIsProcessing(true);
    try {
      const result = await refetchOtp();
      if (result.data?.otp) {
        toast.success("OTP successfully resent (demo mode).");
      } else {
        toast.error("Failed to resend OTP.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to resend OTP.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------- Booking Summary -----------------
  const BookingSummary = useMemo(() => {
    if (!booking?.listing) return null;
    const { listing, totalPrice } = booking;
    const firstImage = listing.images?.[0];
    const checkInDate = new Date(booking.startDate).toLocaleDateString();

    return (
      <div className="sticky top-6 p-6 bg-white rounded-2xl shadow-xl space-y-6 h-fit border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-3">
          Booking Summary
        </h2>
        <div className="flex space-x-4">
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            {firstImage ? (
              <Image
                src={firstImage}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="100px"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-500 text-xs">
                No Image
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-purple-600">
              {listing.title}
            </h3>
            <p className="text-gray-500 text-sm">{listing.location}</p>
            <p className="text-gray-400 text-xs mt-1">
              Check-in: {checkInDate}
            </p>
          </div>
        </div>
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-gray-700">
            <span>Booking Fee</span>
            <span>UGX {formatNumber(totalPrice * 0.95)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Service Charge (5%)</span>
            <span>UGX {formatNumber(totalPrice * 0.05)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-200">
            <span className="text-gray-900">Total Amount</span>
            <span className="text-purple-600">
              UGX {formatNumber(totalPrice)}
            </span>
          </div>
        </div>
      </div>
    );
  }, [booking]);

  if (isLoading) return <LoadingScreen message="Fetching payment details..." />;
  if (!booking || error)
    return (
      <p className="text-center text-red-500 mt-20 p-6 bg-white max-w-lg mx-auto rounded-xl shadow">
        Error: Booking details could not be found.
      </p>
    );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-10 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="text-3xl font-extrabold text-purple-700 mb-10 border-b border-gray-200 pb-3">
          Complete Your Reservation 🔒
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 p-8 bg-white rounded-2xl shadow-xl">
            {/* Step 1: Contact Info */}
            {step === PaymentStep.Info && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  1. Your Contact Details
                </h3>
                <p className="text-gray-600">
                  {/* FIX: Replaced ' with &apos; on line 250 */}
                  We&apos;ll use this information to simulate your Mobile Money
                  payment.
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field-light"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field-light"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Money Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="input-field-light"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    onClick={() => router.push(`/booking/my-bookings`)}
                    className="secondary-button-full"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateOtp}
                    disabled={
                      isProcessing || !fullName || !email || !phoneNumber
                    }
                    className="success-button-full"
                  >
                    {otpLoading ? "Generating OTP..." : "Proceed to OTP"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {step === PaymentStep.OTP && (
              <div
                className={`space-y-6 text-center ${
                  otpErrorShake ? "animate-shake" : ""
                } ${otpSuccessPulse ? "animate-pulse-once" : ""}`}
              >
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  2. Verify Payment (Demo Mode)
                </h3>

                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-3 rounded-lg shadow-inner flex flex-col items-center">
                  <p className="font-semibold text-sm">
                    🔔 Demo OTP — No money will be charged
                  </p>
                  {otpData?.otp && (
                    <p className="text-3xl font-extrabold tracking-widest mt-1 font-mono">
                      {otpData.otp}
                    </p>
                  )}
                  <p className="text-xs text-yellow-700 mt-1">
                    {/* FIX: Replaced ' with &apos; on line 319 */}
                    In reality, this OTP would be sent to the user&apos;s email
                    or mobile money number.
                  </p>
                </div>

                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={isProcessing}
                />

                <div className="mt-4 text-sm text-gray-600">
                  {canResend ? (
                    <button
                      onClick={handleResendOtp}
                      disabled={isProcessing}
                      className="text-purple-600 font-semibold hover:underline transition"
                    >
                      {otpLoading ? "Resending..." : "Resend OTP"}
                    </button>
                  ) : (
                    <span>Resend available in {resendCountdown}s</span>
                  )}
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(PaymentStep.Info)}
                    className="secondary-button-full flex-1"
                    disabled={isProcessing}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isProcessing || (!otp && !otpData?.otp)}
                    className="success-button-full flex-1"
                  >
                    {verifyMutation.isPending
                      ? "Verifying..."
                      : "Verify & Complete"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Completion */}
            {step === PaymentStep.Complete && (
              <div className="text-center py-20 animate-popin">
                <h3 className="text-3xl font-extrabold text-gray-900 mb-3">
                  Payment Confirmed! 🚀
                </h3>
                <p className="text-gray-600 mb-8">
                  {/* FIX: Replaced ' with &apos; on line 372 */}
                  You&apos;ll be redirected to your bookings shortly.
                </p>
                <button
                  onClick={() => router.push(`/booking/my-bookings`)}
                  className="success-button-full max-w-xs mx-auto"
                >
                  View My Bookings
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">{BookingSummary}</div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
