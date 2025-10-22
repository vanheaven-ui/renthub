"use client";

import React, {
  useRef,
  useState,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
  FocusEvent,
  useEffect,
} from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  ariaLabel?: string;
  error?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  ariaLabel = "One-Time Password",
  error = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Auto-focus the first input when enabled
    if (!disabled) inputRefs.current[0]?.focus();
  }, [disabled]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value;
    if (/[^0-9]/.test(newValue)) return;

    const otpArray = value.split("");
    otpArray[index] = newValue.slice(-1);
    onChange(otpArray.join(""));

    // Move focus to next input
    if (newValue && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const otpArray = value.split("");
      if (otpArray[index]) {
        otpArray[index] = "";
        onChange(otpArray.join(""));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (!/^[0-9]+$/.test(pasted)) return;

    const trimmed = pasted.slice(0, length);
    onChange(trimmed);
    inputRefs.current[Math.min(trimmed.length - 1, length - 1)]?.focus();
  };

  const handleFocus = (index: number) => (e: FocusEvent<HTMLInputElement>) => {
    e.target.select();
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const setRef = (index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  };

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-gray-600 text-center text-sm md:text-base">
        Enter the {length}-digit code sent to your phone
      </p>

      <div className="flex justify-center gap-3 md:gap-4">
        {Array.from({ length }, (_, index) => {
          const isFilled = !!value[index];
          const isFocused = focusedIndex === index;

          return (
            <input
              key={index}
              ref={setRef(index)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={1}
              autoFocus={index === 0}
              value={value[index] ?? ""}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              onFocus={handleFocus(index)}
              onBlur={handleBlur}
              disabled={disabled}
              aria-label={`${ariaLabel} digit ${index + 1}`}
              className={`w-12 h-14 md:w-14 md:h-16 text-2xl md:text-3xl font-bold text-center rounded-xl border-2 transition-all duration-200 outline-none
                ${
                  disabled
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                    : error
                    ? "border-red-500 text-red-700 bg-white shadow-inner animate-shake"
                    : isFocused
                    ? "bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-purple-500 text-purple-900 shadow-md focus:ring-2 focus:ring-purple-300 animate-pulse"
                    : isFilled
                    ? "bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-purple-500 text-purple-900 shadow-md focus:ring-2 focus:ring-purple-300"
                    : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-200"
                }`}
            />
          );
        })}
      </div>

      {error && (
        <p className="mt-2 text-red-500 text-sm md:text-base">
          Invalid code. Please try again.
        </p>
      )}
    </div>
  );
};

export default OTPInput;
