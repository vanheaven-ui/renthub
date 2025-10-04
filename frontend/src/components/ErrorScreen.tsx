"use client";

import { FC } from "react";

export interface GenericError {
  message?: string;
  status?: number;
  code?: string;
}

interface ErrorScreenProps {
  error?: GenericError;
  message?: string; 
  fullScreen?: boolean;
  retry?: () => void;
}

const ErrorScreen: FC<ErrorScreenProps> = ({
  error,
  message = "Something went wrong.",
  fullScreen = true,
  retry,
}) => {
  const getErrorMessage = (): string => {
    if (!error) return message;

    switch (error.status) {
      case 404:
        return "Resource not found.";
      case 401:
        return "You are not authorized to view this content.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.message || message;
    }
  };

  return (
    <div
      className={`${
        fullScreen
          ? "h-screen flex justify-center items-center"
          : "flex justify-center items-center"
      }`}
    >
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-md text-red-700 max-w-md text-center">
        <p className="text-lg font-semibold">{getErrorMessage()}</p>
        {retry && (
          <button
            onClick={retry}
            className="mt-4 px-6 py-2 bg-red-500 text-white font-bold rounded-full shadow hover:bg-red-600 transition"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorScreen;
