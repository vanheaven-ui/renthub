"use client";

import { useState } from "react";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/app/context/AuthProvider";

const LogoutButton = () => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout(); // handles backend + local cleanup + redirect
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-lg hover:bg-pink-600 transition transform hover:scale-105"
    >
      {isLoggingOut ? "Logging out..." : "Logout"}
      <ArrowRightEndOnRectangleIcon className="w-5 h-5" />
    </button>
  );
};

export default LogoutButton;
