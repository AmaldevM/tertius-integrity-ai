import React, { useState } from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "h-10",
  variant = "dark",
  showText = true,
}) => {
  const [imgError, setImgError] = useState(false);

  // Helper to determine text size based on the height class passed
  // This is a simple heuristic: if className contains 'h-16' or 'h-20', we use larger text
  const isLarge =
    className.includes("h-16") ||
    className.includes("h-20") ||
    className.includes("h-24");

  if (imgError) {
    return (
      <div
        className={`flex items-center gap-3 ${className} h-auto select-none`}
      >
        {/* SVG Icon - Adjusted viewBox to remove empty space for better alignment */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto aspect-square flex-shrink-0"
        >
          <path d="M4 8H36V14H22V32H18V14H4V8Z" fill="#8B1E1E" />
          <path
            d="M20 32C26 32 28 20 28 20"
            stroke="#102A63"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M20 32C14 32 12 20 12 20"
            stroke="#102A63"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {showText && (
          <div
            className={`flex flex-col justify-center ${
              variant === "light" ? "text-white" : "text-slate-800"
            }`}
          >
            <span
              className={`font-bold tracking-tight leading-none font-sans ${
                isLarge ? "text-2xl" : "text-lg"
              }`}
            >
              Tertius
            </span>
            <span
              className={`font-semibold tracking-[0.2em] uppercase text-[#8B1E1E] leading-none mt-0.5 ${
                isLarge ? "text-xs" : "text-[9px]"
              }`}
            >
              Integrity AI
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src="/logo-white.png"
      alt="Tertius Life Sciences"
      className={`${className} object-contain`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        // Fallback chain
        if (target.src.includes("logo-white.png")) {
          target.src = "/tertius_logo.jpg";
        } else {
          setImgError(true);
        }
      }}
    />
  );
};
