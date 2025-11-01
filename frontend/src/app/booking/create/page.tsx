"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Image from "next/image";
import {
  CalendarDaysIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";

import { getListingById, createBooking, getMyBookings } from "@/lib/api";
import { Listing, Booking } from "@/types";
import { BookingSchema } from "@/validation/booking";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/app/context/AuthProvider";
import { formatNumber } from "@/lib/formatNumbers";

// 💰 Styled UGX Badge
const UgxBadge = ({ className }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded bg-purple-600 text-white px-1.5 py-0.5 text-[10px] font-bold leading-none ${className}`}
  >
    UGX
  </span>
);

// Force full client rendering
export const dynamic = "force-dynamic";

const BookingForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId") || "";

  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string>("");
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  useEffect(() => setIsMounted(true), []);

  // Fetch listing details
  const {
    data: listing,
    isLoading,
    error: listingError,
  } = useQuery<Listing>({
    queryKey: ["listing", listingId],
    queryFn: () => getListingById(listingId),
    enabled: !!listingId && isMounted,
  });

  // Fetch user's existing bookings for this listing
  useEffect(() => {
    if (!user || !isMounted) return;

    getMyBookings()
      .then((bookings) => {
        const filtered = bookings.filter(
          (b) => b.listingId === listingId && b.renterId === user.id
        );
        setUserBookings(filtered);
      })
      .catch((err) => console.error("Failed to fetch user bookings:", err));
  }, [user, listingId, isMounted]);

  const calculateTotal = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate || !listing) return 0;
    const nights = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return nights > 0 ? nights * listing.pricePerDay : 0;
  };

  const hasOverlap = (
    startDate: string,
    endDate: string
  ): Booking | undefined => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return userBookings.find((booking) => {
      const bStart = new Date(booking.startDate);
      const bEnd = new Date(booking.endDate);
      return start <= bEnd && end >= bStart;
    });
  };

  const handleSubmit = async (values: {
    startDate: string;
    endDate: string;
  }) => {
    setError("");
    if (!user) {
      setError("You must be logged in to create a booking.");
      return;
    }

    const overlappingBooking = hasOverlap(values.startDate, values.endDate);
    if (overlappingBooking) {
      setError(
        `⚠️ You already have a booking from ${new Date(
          overlappingBooking.startDate
        ).toLocaleDateString()} to ${new Date(
          overlappingBooking.endDate
        ).toLocaleDateString()}. Please select different dates.`
      );
      return;
    }

    try {
      await createBooking({
        listingId,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
      });
      router.push("/booking/my-bookings");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred. Please try again.");
      console.error("Booking creation failed:", err);
    }
  };

  // Show loading screen before client hydration
  if (!isMounted) return <LoadingScreen message="Initializing..." />;
  if (isLoading) return <LoadingScreen message="Loading listing details..." />;
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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-300 via-pink-200 to-blue-200 animate-gradient-slow"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob-1 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 animate-blob-2 pointer-events-none"></div>

      <div className="w-full max-w-6xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-white/30 backdrop-blur-3xl p-8 rounded-[4rem] shadow-2xl transition-all duration-500 hover:shadow-3xl">
        {/* Left Panel */}
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
            <UgxBadge />
            <span>{formatNumber(listing.pricePerDay)}</span>
            <span className="text-sm font-normal text-gray-500">/ night</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="relative flex flex-col justify-center p-8">
          <h1 className="text-3xl font-bold mb-6 text-purple-900">
            Secure Your Stay
          </h1>

          {error && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg mb-4 shadow-md animate-fadeIn">
              <p className="font-semibold">{error}</p>
            </div>
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
                      <CalendarDaysIcon className="w-5 h-5 inline-block mr-1 text-purple-500" />{" "}
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
                      <CalendarDaysIcon className="w-5 h-5 inline-block mr-1 text-pink-500" />{" "}
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

                  {/* Total Cost */}
                  <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-300 mt-6">
                    <span className="text-xl font-bold text-gray-800">
                      Total:
                    </span>
                    <span className="text-2xl font-extrabold text-pink-600 flex items-center gap-1.5">
                      <UgxBadge />
                      <span>{formatNumber(totalCost)}</span>
                    </span>
                  </div>

                  {/* Buttons */}
                  <button
                    type="submit"
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Confirm Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full py-4 px-6 mt-4 bg-gradient-to-r from-gray-300 to-gray-500 text-white font-bold rounded-full shadow-lg transform transition-all duration-500 hover:scale-105 hover:rotate-1 hover:shadow-xl hover:from-gray-400 hover:to-gray-600 active:scale-95 active:rotate-0"
                  >
                    Cancel & Go Back
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

// Main export with Suspense wrapper
const CreateBookingPage = () => {
  return (
    <Suspense
      fallback={<LoadingScreen message="Initializing booking page..." />}
    >
      <BookingForm />
    </Suspense>
  );
};

export default CreateBookingPage;
