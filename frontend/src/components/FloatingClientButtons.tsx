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
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import HubScoutWidget from "./HubScoutWidget";

const FloatingClientButtons = () => {
  const { user } = useAuth();
  const [isHovering, setIsHovering] = useState(false);
  const [isAutomatedOpen, setIsAutomatedOpen] = useState(false);

  // Determine the final menu state: open if hovering OR if automated
  const isMenuOpen = isHovering || isAutomatedOpen;

  // Handles closing the menu when a link is clicked
  const handleLinkClick = () => {
    setIsHovering(false);
    setIsAutomatedOpen(false);
  };

  // Automated expand/collapse effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Only toggle if the user is not actively hovering
      if (!isHovering) {
        setIsAutomatedOpen((prev) => !prev);
      }
    }, 5000); // Toggles every 5 seconds

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, [isHovering]); // Re-run effect if isHovering changes

  // If the user starts hovering, stop the automated effect
  const handleMouseEnter = () => {
    setIsHovering(true);
    // Note: No need to explicitly set setIsAutomatedOpen(false) here,
    // as the useEffect dependency array handles pausing the toggle loop.
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <>
      <HubScoutWidget />

      <div
        className="fixed top-6 right-6 z-50 w-14 h-14"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Main button container */}
        <button
          onClick={() => setIsHovering((prev) => !prev)}
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
            {user ? (
              // Links for LOGGED-IN users
              <>
                <Link
                  href="/"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                >
                  Home
                  <HomeModernIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/booking/my-bookings"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                >
                  My Bookings
                  <ListBulletIcon className="w-5 h-5" />
                </Link>
                {user.role === "OWNER" && (
                  <>
                    <Link
                      href="/listing/my-listings"
                      onClick={handleLinkClick}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                    >
                      My Listings
                      <BuildingOfficeIcon className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/listing/create"
                      onClick={handleLinkClick}
                      className="flex items-center gap-2 px-6 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                    >
                      Create Listing
                      <PlusIcon className="w-5 h-5" />
                    </Link>
                  </>
                )}
              </>
            ) : (
              // Links for LOGGED-OUT users
              <>
                <Link
                  href="/"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                >
                  Home
                  <HomeModernIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                >
                  Log In
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/register"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                >
                  Register
                  <UserPlusIcon className="w-5 h-5" />
                </Link>
              </>
            )}
          </div>
        </button>
      </div>

      {/* 3. Logout Button - Assumed to be bottom-RIGHT (this component needs to be updated if LogoutButton is fixed bottom-right, otherwise it will still overlap HubScout) */}
      {user && <LogoutButton />}
    </>
  );
};

export default FloatingClientButtons;
