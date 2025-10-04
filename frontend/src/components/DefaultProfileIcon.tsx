import React from "react";

const DefaultProfileIcon = ({ size = 56 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6B7280"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="rounded-full bg-gray-100 border border-gray-300 shadow-sm"
  >
    <circle cx="12" cy="8" r="4" fill="#E5E7EB" />
    <path
      d="M4 20c0-3.3137 3.134-6 7-6h2c3.866 0 7 2.6863 7 6"
      fill="#E5E7EB"
    />
  </svg>
);

export default DefaultProfileIcon;
