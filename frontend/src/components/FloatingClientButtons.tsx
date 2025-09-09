"use client";

import { useAuth } from "@/app/context/AuthProvider";
import LogoutButton from "./LogoutButton";
import Link from "next/link";
import {
  HomeModernIcon,
  ListBulletIcon,
  PlusIcon,
  BuildingOfficeIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const FloatingButtons = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Only render buttons if the user is logged in
  if (!user) {
    return null;
  }

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Main floating shortcut menu container */}
      <div
        className="fixed top-6 right-6 z-50 w-14 h-14"
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        {/* Main button container */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full h-full relative cursor-pointer"
        >
          {/* Main Icon that is visible when the menu is collapsed */}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-500 rounded-full shadow-lg transition-all duration-300 transform ${
              isMenuOpen
                ? "opacity-0 scale-0 pointer-events-none"
                : "opacity-100 scale-100"
            }`}
          >
            <Squares2X2Icon className="w-8 h-8 text-white" />
          </div>

          {/* Menu of buttons that replaces the icon when expanded */}
          <div
            className={`absolute top-0 right-0 flex flex-col gap-3 transition-all duration-300 transform origin-top-right ${
              isMenuOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            {/* New Home Link for all logged-in users */}
            <Link
              href="/"
              onClick={handleLinkClick}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
            >
              Home
              <HomeModernIcon className="w-5 h-5" />
            </Link>

            {/* For both Renter & Owner */}
            <Link
              href="/booking/my-bookings"
              onClick={handleLinkClick}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
            >
              My Bookings
              <ListBulletIcon className="w-5 h-5" />
            </Link>

            {/* Only for Renter */}
            {/* {user.role === "RENTER" && (
              <Link
                href="/booking/create"
                onClick={handleLinkClick}
                className="flex items-center gap-2 px-6 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
              >
                Create Booking
                <HomeModernIcon className="w-5 h-5" />
              </Link>
            )} */}

            {/* Only for Owner */}
            {user.role === "OWNER" && (
              <>
                <Link
                  href="/my-listings"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                >
                  My Listings
                  <BuildingOfficeIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/listing/create"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                >
                  Create Listing
                  <PlusIcon className="w-5 h-5" />
                </Link>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Bottom Button: Logout */}
      <LogoutButton />
    </>
  );
};

export default FloatingButtons;
