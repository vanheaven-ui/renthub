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
// Import Heroicons for better visuals (Assuming these are available in your environment)
import {
  ShieldCheckIcon,
  CreditCardIcon,
  ArrowLongLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  UserIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";

enum PaymentStep {
  Info = 1,
  OTP,
  Complete,
}

const OTP_RESEND_DELAY = 30;

// --- Helper Components for the Stepper (New UI Element) ---
const StepIndicator = ({
  step,
  currentStep,
  title,
}: {
  step: PaymentStep;
  currentStep: PaymentStep;
  title: string;
}) => {
  const isComplete = step < currentStep;
  const isActive = step === currentStep;

  const baseClasses =
    "flex items-center space-x-3 transition-all duration-300 relative";
  const iconClasses = `w-8 h-8 flex items-center justify-center rounded-full text-white font-bold ring-4 flex-shrink-0 ${
    isComplete
      ? "bg-green-500 ring-green-200"
      : isActive
      ? "bg-purple-600 ring-purple-200 shadow-lg"
      : "bg-gray-300 ring-gray-100"
  }`;
  const textClasses = `text-sm font-semibold whitespace-nowrap ${
    isComplete
      ? "text-gray-500"
      : isActive
      ? "text-purple-700"
      : "text-gray-400"
  }`;

  return (
    <div className={baseClasses}>
      <div className={iconClasses}>
        {isComplete ? <CheckCircleIcon className="w-4 h-4" /> : step}
      </div>
      <span className={textClasses}>{title}</span>
    </div>
  );
};

const StepSeparator = ({
  step,
  currentStep,
}: {
  step: PaymentStep;
  currentStep: PaymentStep;
}) => {
  const isComplete = step < currentStep;
  const lineClasses = `h-0.5 w-full transition-colors duration-500 ${
    isComplete ? "bg-green-500" : "bg-gray-300"
  }`;
  return <div className={lineClasses}></div>;
};

// ----------------- Main Component -----------------

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
      setTimeout(() => router.push(`/booking/${bookingId}`), 2500);
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
    const checkInDate = new Date(booking.startDate).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

    return (
      <div className="sticky top-6 p-6 bg-white rounded-3xl shadow-2xl space-y-6 h-fit border border-purple-100 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
          Your Order
        </h2>
        <div className="flex space-x-4">
          <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-md">
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {listing.title}
            </h3>
            <p className="text-gray-500 text-sm flex items-center mt-1">
              <ShieldCheckIcon className="w-4 h-4 mr-1 text-green-500" />
              Secured Reservation
            </p>
            <p className="text-purple-500 text-xs mt-2 font-semibold">
              Check-in: {checkInDate}
            </p>
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Booking Fee</span>
            <span className="font-medium">
              UGX {formatNumber(totalPrice * 0.95)}
            </span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Service Charge (5%)</span>
            <span className="font-medium">
              UGX {formatNumber(totalPrice * 0.05)}
            </span>
          </div>
          <div className="flex justify-between text-2xl font-extrabold pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-gray-900 dark:text-white">Total Due</span>
            <span className="text-pink-600 dark:text-pink-400">
              UGX {formatNumber(totalPrice)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center pt-4 text-sm text-gray-400">
          <CreditCardIcon className="w-5 h-5 mr-1.5 text-gray-400" />
          Secure payment via Mobile Money
        </div>
      </div>
    );
  }, [booking]);

  // ----------------- Loading and Error States -----------------

  if (isLoading) return <LoadingScreen message="Fetching payment details..." />;
  if (!booking || error)
    return (
      <div className="text-center text-red-600 mt-20 p-8 bg-white max-w-lg mx-auto rounded-2xl shadow-xl">
        <h2 className="text-3xl font-extrabold mb-3">Booking Not Found 😢</h2>
        <p className="text-lg">
          Error: Booking details could not be found or loaded.
        </p>
        <button
          onClick={() => router.push(`/booking/my-bookings`)}
          className="mt-6 primary-button"
        >
          Go to My Bookings
        </button>
      </div>
    );

  // ----------------- Main Render -----------------

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-10 overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none dark:from-purple-800/10" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Finalize Your Payment
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 flex items-center justify-center mt-2">
            <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-500" />
            Secured Checkout for Booking #{bookingId.substring(0, 8)}
          </p>
        </header>

        {/* Stepper Navigation */}
        <div className="max-w-3xl mx-auto mb-10 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center w-full">
            <StepIndicator
              step={PaymentStep.Info}
              currentStep={step}
              title="Contact"
            />
            <StepSeparator step={PaymentStep.Info} currentStep={step} />
            <StepIndicator
              step={PaymentStep.OTP}
              currentStep={step}
              title="Verification"
            />
            <StepSeparator step={PaymentStep.OTP} currentStep={step} />
            <StepIndicator
              step={PaymentStep.Complete}
              currentStep={step}
              title="Confirmation"
            />
          </div>
        </div>

        {/* Grid Layout: Payment Form (Left) and Summary (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Payment Form / OTP / Complete Section */}
          <div className="lg:col-span-2 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
            {/* Step 1: Contact Info */}
            {step === PaymentStep.Info && (
              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center">
                  <UserIcon className="w-6 h-6 mr-2" />
                  1. Contact & Payment Method
                </h3>
                <p className="text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-4">
                  Please confirm your details and provide the Mobile Money
                  number for payment processing.
                </p>
                <div className="space-y-5">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition shadow-inner dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition shadow-inner dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Money Number (e.g., +256 770 123456)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-5 py-3 border-2 border-purple-400 rounded-xl focus:ring-4 focus:ring-pink-300 focus:border-pink-500 transition shadow-md dark:bg-gray-700 dark:text-white dark:border-purple-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-between items-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => router.push(`/booking/my-bookings`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    disabled={isProcessing}
                  >
                    <ArrowLongLeftIcon className="w-5 h-5" />
                    Back to Bookings
                  </button>
                  <button
                    onClick={handleGenerateOtp}
                    disabled={
                      isProcessing || !fullName || !email || !phoneNumber
                    }
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full font-bold shadow-lg shadow-purple-300/50 transition transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Generating OTP...
                      </>
                    ) : (
                      <>
                        Proceed to Verification
                        <ArrowRightIcon className="w-5 h-5 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {step === PaymentStep.OTP && (
              <div
                className={`space-y-8 text-center transition-all ${
                  otpErrorShake ? "animate-shake" : ""
                } ${otpSuccessPulse ? "animate-pulse-once" : ""}`}
              >
                <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  2. Enter Verification Code
                </h3>

                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl shadow-inner flex flex-col items-center">
                  <p className="font-semibold text-base flex items-center">
                    🔔 Demo Mode: OTP Displayed Below
                  </p>
                  {otpData?.otp && (
                    <p className="text-4xl font-extrabold tracking-[0.5em] mt-2 font-mono p-2 bg-yellow-200 dark:bg-yellow-800 rounded-lg shadow-md">
                      {otpData.otp}
                    </p>
                  )}
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                    In a real scenario, the code would be sent to {phoneNumber}.
                  </p>
                </div>

                <div className="flex justify-center">
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    disabled={isProcessing}
                  />
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {canResend ? (
                    <button
                      onClick={handleResendOtp}
                      disabled={isProcessing}
                      className="text-purple-600 font-semibold hover:text-pink-600 transition"
                    >
                      {otpLoading ? "Resending..." : "Resend Code"}
                    </button>
                  ) : (
                    <span>
                      Resend available in{" "}
                      <span className="font-bold text-purple-700 dark:text-purple-400">
                        {resendCountdown}s
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setStep(PaymentStep.Info)}
                    className="secondary-button-full flex-1"
                    disabled={isProcessing}
                  >
                    Change Details
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isProcessing || (!otp && !otpData?.otp)}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-600 to-red-500 text-white rounded-full font-bold shadow-lg shadow-red-300/50 transition transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="w-5 h-5" />
                        Verify & Pay
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Completion */}
            {step === PaymentStep.Complete && (
              <div className="text-center py-20 bg-green-50 dark:bg-green-900 rounded-2xl shadow-inner border-4 border-green-300 animate-popin">
                <CheckCircleIcon className="w-20 h-20 text-green-600 dark:text-green-400 mx-auto mb-4 animate-bounce-once" />
                <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                  Payment Confirmed! 🎉
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
                  Your reservation is secured. We&apos;re redirecting you now...
                </p>
                <button
                  onClick={() => router.push(`/booking/${bookingId}`)}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-extrabold text-lg shadow-xl shadow-green-300/50 transition transform hover:scale-105"
                >
                  View Booking Details
                </button>
              </div>
            )}
          </div>

          {/* Booking Summary Card */}
          <div className="lg:col-span-1">{BookingSummary}</div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
