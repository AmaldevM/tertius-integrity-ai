import React, { useState } from "react";
import logoFallback from "../assets/Logo.png";

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
    className.includes("h-18") ||
    className.includes("h-20") ||
    className.includes("h-24") ||
    className.includes("text-4xl");

  if (imgError) {
    return (
      <div className={`flex items-center gap-3 ${className} select-none`}>
        {/* Replaced SVG with Image as requested */}
        <img
          src={logoFallback}
          alt="Tertius Icon"
          className="h-full w-auto aspect-square object-contain"
        />

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
              TERTIUS
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
      src="/logo.png"
      alt="Tertius Life Sciences"
      className={`${className} object-contain`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        // Fallback chain: logo.png -> logo-white.png -> tertius_logo.jpg -> Fallback Component
        if (target.src.includes("logo.png")) {
          target.src = "/logo-white.png";
        } else if (target.src.includes("logo-white.png")) {
          target.src = "/tertius_logo.jpg";
        } else {
          setImgError(true);
        }
      }}
    />
  );
};
