"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getListingById, createBooking } from "@/lib/api";
import { Listing } from "@/types";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { BookingSchema } from "@/validation/booking";
import { useAuth } from "@/app/context/AuthProvider";
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";

const CreateBookingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const listingId = searchParams.get("listingId") || "";
  const [error, setError] = useState("");

  const {
    data: listing,
    isLoading,
    error: listingError,
  } = useQuery<Listing>({
    queryKey: ["listing", listingId],
    queryFn: () => getListingById(listingId),
    enabled: !!listingId,
  });

  const calculateTotal = (startDate: string, endDate: string) => {
    if (!startDate || !endDate || !listing) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights > 0 ? nights * listing.pricePerDay : 0;
  };

  const handleSubmit = async (values: {
    startDate: string;
    endDate: string;
  }) => {
    setError("");
    try {
      if (!user) {
        setError("You must be logged in to create a booking.");
        return;
      }

      await createBooking({
        listingId,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
      });

      // Redirect to the user's bookings page after creation
      router.push("/my-bookings");
    } catch (err: any) {
      console.error("Booking creation error:", err.message);
      setError("Failed to create booking. Please try again.");
    }
  };

  if (isLoading)
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-xl font-semibold text-purple-700 animate-pulse">
          Loading listing...
        </div>
      </div>
    );

  if (listingError || !listing)
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-xl font-semibold text-red-500">
          Listing not found.
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-300 via-pink-200 to-blue-200 animate-gradient-slow"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob-1 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 animate-blob-2 pointer-events-none"></div>

      <div className="w-full max-w-6xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-white/30 backdrop-blur-3xl p-8 rounded-[4rem] shadow-2xl transition-all duration-500 hover:shadow-3xl">
        {/* Left Panel: Listing Preview */}
        <div className="flex flex-col justify-between items-center text-center p-6 bg-white/20 rounded-[3rem] shadow-inner-xl transform transition-transform duration-500 hover:scale-[1.01]">
          <h2 className="text-4xl font-extrabold text-purple-900 drop-shadow-sm leading-tight mb-4">
            {listing.title}
          </h2>
          <p className="text-lg text-gray-700 mb-6">{listing.location}</p>

          <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg border-4 border-white/50">
            <Image
              src={listing.images[0] || "https://via.placeholder.com/800"}
              alt={listing.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="mt-6 text-xl font-semibold text-gray-800 flex items-center gap-2">
            <CurrencyDollarIcon className="w-6 h-6 text-pink-600" />
            <span>{listing.pricePerDay}</span>
            <span className="text-sm font-normal text-gray-500">/ night</span>
          </div>
        </div>

        {/* Right Panel: Booking Form */}
        <div className="relative flex flex-col justify-center p-8">
          <h1 className="text-3xl font-bold mb-6 text-purple-900">
            Secure Your Stay
          </h1>

          {error && (
            <p className="text-red-500 text-center font-semibold mb-4">
              {error}
            </p>
          )}

          <Formik
            initialValues={{ startDate: "", endDate: "" }}
            validationSchema={BookingSchema}
            onSubmit={handleSubmit}
          >
            {({ values }) => {
              const totalCost = calculateTotal(
                values.startDate,
                values.endDate
              );
              return (
                <Form className="space-y-6">
                  {/* Start Date */}
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      <CalendarDaysIcon className="w-5 h-5 inline-block mr-1 text-purple-500" />
                      Check-in Date:
                    </label>
                    <Field
                      type="date"
                      id="startDate"
                      name="startDate"
                      className="w-full px-5 py-3 border-2 border-transparent rounded-2xl bg-white/60 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition-all duration-300 shadow-md"
                    />
                    <ErrorMessage
                      name="startDate"
                      component="div"
                      className="text-red-500 text-xs mt-2"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      <CalendarDaysIcon className="w-5 h-5 inline-block mr-1 text-pink-500" />
                      Check-out Date:
                    </label>
                    <Field
                      type="date"
                      id="endDate"
                      name="endDate"
                      className="w-full px-5 py-3 border-2 border-transparent rounded-2xl bg-white/60 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition-all duration-300 shadow-md"
                    />
                    <ErrorMessage
                      name="endDate"
                      component="div"
                      className="text-red-500 text-xs mt-2"
                    />
                  </div>

                  {/* Total Cost Display */}
                  <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-300 mt-6">
                    <span className="text-xl font-bold text-gray-800">
                      Total:
                    </span>
                    <span className="text-2xl font-extrabold text-pink-600">
                      ${totalCost}
                    </span>
                  </div>

                  {/* Confirm Button */}
                  <button
                    type="submit"
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Confirm Booking
                  </button>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default CreateBookingPage;
