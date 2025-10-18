"use client";

import { useState, useRef } from "react";
import Image, { ImageProps } from "next/image";

interface ImageWithLoaderProps extends Omit<ImageProps, "onLoadingComplete"> {
  loaderType?: "spinner" | "skeleton";
  className?: string;
  containerClassName?: string;
}

/**
 * Responsive image with built-in loader, fallback, and smooth transitions.
 */
export default function ImageWithLoader({
  loaderType = "spinner",
  className = "",
  containerClassName = "",
  alt = "Image",
  ...props
}: ImageWithLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleError = () => setHasError(true);

  // ✅ Ensure Next.js Image gets only valid URLs
  const safeSrc =
    props.src && typeof props.src === "string" && props.src.startsWith("http")
      ? props.src
      : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/10 to-gray-900/10 backdrop-blur-md ${containerClassName}`}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Loader */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-800/10 via-gray-700/10 to-pink-800/10">
          {loaderType === "spinner" ? (
            <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-pink-700/20 to-purple-900/20 animate-pulse" />
          )}
        </div>
      )}

      {/* Image or fallback */}
      {hasError || !safeSrc ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200">
          <svg
            className="w-16 h-16 text-purple-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            role="img"
            aria-label="Broken image icon"
          >
            <rect
              width="64"
              height="64"
              rx="12"
              fill="currentColor"
              fillOpacity="0.1"
            />
            <path
              d="M16 24h32M16 32h32M16 40h32"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="16"
              y1="16"
              x2="48"
              y2="48"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="48"
              y1="16"
              x2="16"
              y2="48"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ) : (
        <Image
          {...props}
          src={safeSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`transition-opacity duration-700 ease-in-out object-cover ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          fill
          style={{ objectFit: "cover" }}
        />
      )}
    </div>
  );
}

