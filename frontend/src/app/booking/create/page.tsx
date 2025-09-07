"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getListingById, createBooking } from "@/lib/api";
import { Listing } from "@/types";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { BookingSchema } from "@/validation/booking";

const CreateBookingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    enabled: !!listingId,
  });

  if (isLoading) return <div>Loading listing...</div>;
  if (listingError || !listing) return <div>Listing not found.</div>;

  const handleSubmit = async (values: {
    startDate: string;
    endDate: string;
  }) => {
    setError("");
    try {
      await createBooking({
        listingId,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
      });
      setSuccess("Booking created! Redirecting to your bookings...");
      setTimeout(() => router.push("/my-bookings"), 1500);
    } catch (err) {
      setError("Failed to create booking. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4">
      <div className="w-full max-w-lg bg-white/40 backdrop-blur-md p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-purple-900 text-center">
          Book a Listing
        </h1>

        <Formik
          initialValues={{ startDate: "", endDate: "" }}
          validationSchema={BookingSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="space-y-4">
              {error && <p className="text-red-500 text-center">{error}</p>}
              {success && (
                <p className="text-green-600 text-center">{success}</p>
              )}

              {/* Read-only dropdown for the clicked listing */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Listing:
                </label>
                <Field
                  as="select"
                  name="listingId"
                  value={listing.id}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 outline-none cursor-not-allowed"
                >
                  <option value={listing.id}>{listing.title}</option>
                </Field>
              </div>

              {/* Booking dates */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Date:
                </label>
                <Field
                  type="date"
                  name="startDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                />
                <ErrorMessage
                  name="startDate"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  End Date:
                </label>
                <Field
                  type="date"
                  name="endDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
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
