"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBookingById, initiatePayment } from "@/lib/api";
import { Booking, InitiatePaymentPayload, PaymentResponse } from "@/types";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useAuth } from "@/app/context/AuthProvider";
import {
  PhoneIcon,
  UserIcon,
  EnvelopeIcon,
  CreditCardIcon,
  ArrowPathIcon,
  HomeIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import LoadingScreen from "@/components/LoadingScreen";
import ImageWithLoader from "@/components/ImageWithLoader";
import { PaymentSchema } from "@/validation/payment";
import { formatNumber } from "@/lib/formatNumbers";

// Simple UGX Badge
const UgxIcon = ({ className }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded bg-purple-600 text-white px-1.5 py-0.5 text-[10px] font-bold leading-none ${className}`}
  >
    UGX
  </span>
);

const CheckoutPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const bookingId = Array.isArray(id) ? id[0] : id;
  const [isProcessing, setIsProcessing] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryHeight, setSummaryHeight] = useState<number | undefined>(
    undefined
  );

  // Fetch booking details
  const {
    data: booking,
    isLoading,
    error: bookingError,
  } = useQuery<Booking>({
    queryKey: ["booking", bookingId],
    queryFn: () => {
      if (!bookingId) throw new Error("Invalid booking ID");
      return getBookingById(bookingId);
    },
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (summaryRef.current) {
      setSummaryHeight(summaryRef.current.offsetHeight);
    }
  }, [booking, isLoading]);

  // Memoized booking info
  const formattedStartDate = useMemo(() => {
    return booking
      ? new Date(booking.startDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
  }, [booking]);

  const formattedEndDate = useMemo(() => {
    return booking
      ? new Date(booking.endDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
  }, [booking]);

  const handleSubmit = async (values: {
    full_name: string;
    email: string;
    phone_number: string;
  }) => {
    if (!user) return toast.error("You must be logged in to make a payment.");
    if (!booking) return toast.error("Booking not found. Please try again.");

    setIsProcessing(true);

    try {
      const payload: InitiatePaymentPayload = {
        bookingId: booking.id,
        amount: booking.totalPrice,
        currency: "UGX",
        full_name: values.full_name,
        email: values.email,
        phone_number: values.phone_number,
      };

      const response: PaymentResponse = await initiatePayment(payload);

      toast.success(response.message);

      if (response.data?.link) {
        window.location.href = response.data.link;
      } else {
        toast.error("Payment link not found.");
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      toast.error("Failed to initiate payment. Try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    toast("Payment cancelled.");
    router.back();
  };

  if (isLoading) return <LoadingScreen message="Loading booking details..." />;
  if (bookingError || !booking || !booking.listing)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Booking not found or an error occurred.
      </div>
    );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-10 overflow-hidden">
      {/* Animated circular shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-72 h-72 bg-purple-300/40 rounded-full blur-3xl animate-float-slow top-10 left-10" />
        <div className="absolute w-96 h-96 bg-pink-300/30 rounded-full blur-3xl animate-float-medium top-1/3 right-10" />
        <div className="absolute w-64 h-64 bg-blue-300/40 rounded-full blur-3xl animate-float-fast bottom-10 left-1/3" />
        <div className="absolute w-80 h-80 bg-yellow-200/30 rounded-full blur-3xl animate-float-slow bottom-1/4 right-1/4" />
      </div>

      <div className="relative container mx-auto max-w-6xl z-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Booking Summary */}
          <div
            ref={summaryRef}
            className="flex-1 w-full lg:w-1/2 flex flex-col bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/30"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-white/30 pb-2 flex items-center gap-2">
              <HomeIcon className="w-6 h-6 text-purple-600" /> Booking Summary
            </h2>

            <div
              className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-6 flex-shrink-0"
              style={{
                height: summaryHeight ? `${summaryHeight / 2}px` : "256px",
              }}
            >
              <ImageWithLoader
                src={
                  booking.listing.images[0]
                    ? `${booking.listing.images[0]}`
                    : "/invalid-path.png"
                }
                alt={booking.listing.title}
                fill
                className="object-cover"
                containerClassName="rounded-2xl"
                loaderType="spinner"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 rounded-2xl pointer-events-none" />
            </div>

            <div className="text-gray-900">
              <p className="text-xl font-semibold mb-1 text-purple-800">
                {booking.listing.title}
              </p>
              <p className="text-sm text-gray-700/90 mb-4">
                {booking.listing.location}
              </p>

              <div className="flex justify-between items-center text-lg font-medium mb-2">
                <span className="flex items-center gap-2 text-gray-700/90">
                  <span>Total Price:</span>
                </span>
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-1 rounded-full font-bold flex items-center gap-2">
                  <UgxIcon /> <span>{formatNumber(booking.totalPrice)}</span>
                </span>
              </div>

              <p className="text-gray-700 text-sm">
                <span className="font-semibold">From:</span>{" "}
                {formattedStartDate}
              </p>
              <p className="text-gray-700 text-sm mb-2">
                <span className="font-semibold">To:</span> {formattedEndDate}
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div
            className="flex-1 w-full lg:w-1/2 flex flex-col bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/30"
            style={{ minHeight: summaryHeight }}
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-purple-900 mb-6 drop-shadow-sm">
              Complete Your Payment
            </h1>

            <Formik
              initialValues={{
                full_name: user?.name || "",
                email: user?.email || "",
                phone_number: "",
              }}
              validationSchema={PaymentSchema}
              onSubmit={handleSubmit}
            >
              {() => (
                <Form className="space-y-6 flex flex-col justify-between h-full">
                  <div className="space-y-6">
                    {["full_name", "email", "phone_number"].map((field) => {
                      const Icon =
                        field === "full_name"
                          ? UserIcon
                          : field === "email"
                          ? EnvelopeIcon
                          : PhoneIcon;
                      const placeholder =
                        field === "phone_number"
                          ? "077..."
                          : field === "email"
                          ? "you@example.com"
                          : "Full Name";

                      return (
                        <div key={field}>
                          <label
                            htmlFor={field}
                            className="block text-sm font-medium text-gray-700"
                          >
                            {field
                              .split("_")
                              .map((w) => w[0].toUpperCase() + w.slice(1))
                              .join(" ")}
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Icon className="h-5 w-5 text-gray-400" />
                            </div>
                            <Field
                              type={field === "email" ? "email" : "text"}
                              name={field}
                              id={field}
                              placeholder={placeholder}
                              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 transition-all"
                            />
                          </div>
                          <ErrorMessage
                            name={field}
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      type="submit"
                      className="flex-1 flex justify-center items-center py-4 px-4 border border-transparent rounded-full shadow-lg text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 mr-3 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-5 w-5 mr-3" />
                          Pay with Mobile Money
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 flex justify-center items-center py-4 px-4 border border-gray-300 rounded-full shadow-lg text-lg font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300"
                    >
                      <XMarkIcon className="h-5 w-5 mr-3" />
                      Cancel
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
