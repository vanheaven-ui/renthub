// /app/checkout/page.tsx

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBookingById, initiatePayment } from "@/lib/api";
import { Booking } from "@/types";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useAuth } from "@/app/context/AuthProvider";
import {
  CurrencyDollarIcon,
  PhoneIcon,
  UserIcon,
  EnvelopeIcon,
  CreditCardIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import { PaymentSchema } from "@/validation/payment";
import toast from "react-hot-toast"; // Ensure you import toast

const CheckoutPage = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const { id } = useParams();
  const bookingId = Array.isArray(id) ? id[0] : id;

  const {
    data: booking,
    isLoading,
    error: bookingError,
  } = useQuery<Booking>({
    queryKey: ["booking", bookingId],
    queryFn: () => {
      if (typeof bookingId === "string") {
        return getBookingById(bookingId);
      }
      throw new Error("Invalid booking ID");
    },
    enabled: !!bookingId && typeof bookingId === "string",
  });

  const handleSubmit = async (values: {
    full_name: string;
    email: string;
    phone_number: string;
  }) => {
    setIsProcessing(true);

    try {
      if (!user) {
        toast.error("You must be logged in to make a payment.");
        return;
      }
      if (!booking) {
        toast.error("Booking not found. Please try again.");
        return;
      }

      const paymentResponse = await initiatePayment({
        bookingId: booking.id,
        ...values,
      });

      // Show a success message before redirecting
      toast.success(paymentResponse.message);

      // Check if the link exists before redirecting
      if (paymentResponse.data?.link) {
        window.location.href = paymentResponse.data.link;
      } else {
        // This case should be rare if the backend is working correctly
        toast.error("Payment link not found in response.");
        throw new Error("Payment link not found in response.");
      }
    } catch (err: any) {
      // The API interceptor will show the error toast for us, so we just need
      // to log the error here.
      console.error("Payment initiation error:", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-gray-500">
        Loading booking details...
      </div>
    );

  if (bookingError || !booking || !booking.listing)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Booking not found or an error occurred.
      </div>
    );

  return (
    // ... (rest of the component)
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-10 overflow-hidden">
      {/* Abstract shapes for background aesthetic */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

      <div className="relative container mx-auto max-w-5xl z-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/50 backdrop-blur-md shadow-2xl rounded-3xl p-6 md:p-10 flex flex-col lg:flex-row items-center justify-center space-y-8 lg:space-y-0 lg:space-x-12">
          {/* Booking Summary Section */}
          <div className="flex-1 w-full lg:w-1/2 p-6 bg-gray-50/70 backdrop-blur rounded-2xl shadow-inner border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              Booking Summary 💫
            </h2>
            <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 shadow-md">
              <Image
                src={
                  `/${booking.listing.images[0]}` ||
                  "https://via.placeholder.com/800"
                }
                alt={booking.listing.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            <p className="text-xl font-semibold text-gray-900 mb-2">
              {booking.listing.title}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {booking.listing.location}
            </p>
            <div className="flex justify-between items-center text-lg font-medium text-gray-700">
              <span>Total Price:</span>
              <span className="text-green-600 font-bold flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-1" />
                {booking.totalPrice}
              </span>
            </div>
          </div>

          {/* Payment Form Section */}
          <div className="flex-1 w-full lg:w-1/2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-purple-900 mb-6 drop-shadow-sm">
              Complete Your Payment
            </h1>
            {/* The centralized axios interceptor will handle error toasts */}

            <Formik
              initialValues={{
                full_name: user?.name || "",
                email: user?.email || "",
                phone_number: "",
              }}
              validationSchema={PaymentSchema}
              onSubmit={handleSubmit}
            >
              {({ values }) => (
                <Form className="space-y-6">
                  <div>
                    <label
                      htmlFor="full_name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="text"
                        name="full_name"
                        id="full_name"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <ErrorMessage
                      name="full_name"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="email"
                        name="email"
                        id="email"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone_number"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone Number (e.g., 077...)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="tel"
                        name="phone_number"
                        id="phone_number"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <ErrorMessage
                      name="phone_number"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-full shadow-lg text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
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
