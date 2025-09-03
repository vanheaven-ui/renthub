// frontend/app/create-booking/page.tsx
"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { createBooking, getListings } from "@/lib/api";
import { Booking, Listing } from "@/types";
import { BookingSchema } from "@/validation/booking";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthProvider";

const CreateBookingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [pricePerDay, setPricePerDay] = useState<number>(0);

  // Fetch available listings, assuming the user is a RENTER
  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: getListings,
  });

  const mutation = useMutation({
    mutationFn: async (
      payload: Omit<Booking, "id" | "createdAt" | "updatedAt">
    ) => {
      // convert dates from string → Date before sending
      return createBooking({
        ...payload,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
      });
    },
    onSuccess: () => {
      alert("🎉 Booking created successfully!");
      router.push("/my-bookings");
    },
    onError: () => {
      alert("❌ Failed to create booking. Please try again.");
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <p className="text-xl text-purple-700 animate-pulse">
          Loading listings...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 overflow-x-hidden">
      {/* Abstract background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-6 text-purple-700">
            Create a Booking
          </h1>

          <Formik
            initialValues={{
              listingId: "",
              renterId: user?.id || "",
              ownerId: "",
              startDate: "",
              endDate: "",
              totalPrice: 0,
            }}
            validationSchema={BookingSchema}
            onSubmit={(values: any) => mutation.mutate(values)}
          >
            {({ values, setFieldValue }) => {
              // Update pricePerDay when listing changes
              useEffect(() => {
                const selected = listings?.find(
                  (l) => l.id === values.listingId
                );
                if (selected) {
                  setPricePerDay(selected.pricePerDay);
                  // Auto-fill ownerId from listing
                  setFieldValue("ownerId", selected.ownerId);
                }
              }, [values.listingId, listings, setFieldValue]);

              // Calculate totalPrice
              useEffect(() => {
                if (values.startDate && values.endDate && pricePerDay > 0) {
                  const start = new Date(values.startDate);
                  const end = new Date(values.endDate);
                  const days =
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) +
                    1;

                  if (days > 0) {
                    setFieldValue("totalPrice", days * pricePerDay);
                  } else {
                    setFieldValue("totalPrice", 0);
                  }
                }
              }, [
                values.startDate,
                values.endDate,
                pricePerDay,
                setFieldValue,
              ]);

              return (
                <Form className="space-y-5">
                  {/* Listing Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Select Listing
                    </label>
                    <Field
                      as="select"
                      name="listingId"
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">-- Choose a listing --</option>
                      {listings?.map((listing) => (
                        <option key={listing.id} value={listing.id}>
                          {listing.title} (${listing.pricePerDay}/day)
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="listingId"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  {/* Renter ID (hidden because auto-filled) */}
                  <Field type="hidden" name="renterId" />

                  {/* Dates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <Field
                      name="startDate"
                      type="date"
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                    <ErrorMessage
                      name="startDate"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <Field
                      name="endDate"
                      type="date"
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                    <ErrorMessage
                      name="endDate"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  {/* Total Price (auto-calculated) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Total Price
                    </label>
                    <Field
                      name="totalPrice"
                      type="number"
                      readOnly
                      className="mt-1 block w-full bg-gray-100 text-gray-700 rounded-lg border-gray-300 shadow-sm"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50"
                  >
                    {mutation.isPending ? "Creating booking..." : "Book Now"}
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
