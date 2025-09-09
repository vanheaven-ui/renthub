"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getListingById, createBooking } from "@/lib/api";
import { Listing } from "@/types";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { BookingSchema } from "@/validation/booking";
import { useAuth } from "@/app/context/AuthProvider";

const CreateBookingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const listingId = searchParams.get("listingId") || "";
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch the selected listing
  const {
    data: listing,
    isLoading,
    error: listingError,
  } = useQuery<Listing>({
    queryKey: ["listing", listingId],
    queryFn: () => getListingById(listingId),
    enabled: !!listingId, // only fetch if ID exists
  });

  if (isLoading)
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-xl font-semibold text-purple-700">
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

      setSuccess("Booking created! Redirecting to your bookings...");
      setTimeout(() => router.push("/booking/my-bookings"), 1000);
    } catch (err: any) {
      console.error("Booking error:", err.message);
      setError("Failed to create booking. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background gradients and shapes */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-300 via-pink-200 to-blue-200"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10 bg-white/40 backdrop-blur-md p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-purple-900 text-center">
          Book "{listing.title}"
        </h1>

        <Formik
          initialValues={{ startDate: "", endDate: "" }}
          validationSchema={BookingSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="space-y-4">
              {error && (
                <p className="text-red-500 text-center font-semibold">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-green-600 text-center font-semibold">
                  {success}
                </p>
              )}

              {/* Read-only listing details */}
              <div className="p-4 bg-gray-100 rounded-xl shadow-inner">
                <p className="text-sm font-semibold text-gray-700">
                  Listing Details
                </p>
                <h3 className="text-xl font-bold text-purple-800 mt-1">
                  {listing.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">{listing.location}</p>
                <p className="text-gray-900 font-bold text-lg mt-2">
                  ${listing.pricePerDay} / night
                </p>
              </div>

              {/* Booking dates */}
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Start Date:
                </label>
                <Field
                  type="date"
                  id="startDate"
                  name="startDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition"
                />
                <ErrorMessage
                  name="startDate"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  End Date:
                </label>
                <Field
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition"
                />
                <ErrorMessage
                  name="endDate"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 bg-purple-600 text-white font-semibold rounded-full shadow-lg hover:bg-purple-700 transition transform hover:scale-105"
              >
                Confirm Booking
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default CreateBookingPage;
