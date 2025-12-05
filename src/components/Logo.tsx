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

  // Heuristic for larger text sizes
  const isLarge =
    className.includes("h-16") ||
    className.includes("h-20") ||
    className.includes("h-24") ||
    className.includes("text-4xl"); // Added robust checks

  if (imgError) {
    return (
      <div className={`flex items-center gap-3 ${className} select-none`}>
        {/* SVG Icon - Custom "DNA T" Design */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto aspect-square flex-shrink-0"
        >
          {/* TOP BAR (Burgundy): Stylized T top */}
          <path
            d="M4 6H16L20 12L24 6H36V14H24L20 20L16 14H4V6Z"
            fill="#8B1E1E"
          />
          {/* Correction for a sharper T look similar to image */}
          <path d="M6 6H34V12H24L20 18L16 12H6V6Z" fill="#8B1E1E" />

          {/* DNA HELIX STEM (Navy Blue) */}
          {/* Left Strand */}
          <path
            d="M16 14C16 14 12 20 16 26C20 32 20 36 20 36"
            stroke="#102A63"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Right Strand */}
          <path
            d="M24 14C24 14 28 20 24 26C20 32 20 36 20 36"
            stroke="#102A63"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* DNA Rungs (Horizontal lines) */}
          <path
            d="M16 18H24"
            stroke="#102A63"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M14 22H26"
            stroke="#102A63"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M15 26H25"
            stroke="#102A63"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M18 30H22"
            stroke="#102A63"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* BOTTOM ACCENT (Burgundy) */}
          <path d="M20 36L16 38H24L20 36Z" fill="#8B1E1E" />
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
        // Fallback chain: logo-white -> tertius_logo -> SVG
        if (target.src.includes("logo-white.png")) {
          target.src = "/tertius_logo.jpg";
        } else {
          setImgError(true);
        }
      }}
    />
  );
};
