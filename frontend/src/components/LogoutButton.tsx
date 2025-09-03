"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";
import { logoutUser } from "@/lib/api";
import { useAuth } from "@/app/context/AuthProvider";

const LogoutButton = () => {
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      logout();
      router.push("/");
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
