import React, { useState } from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export const Logo: React.FC<LogoProps> = ({
  className = "h-12",
  variant = "dark",
}) => {
  const [imgError, setImgError] = useState(false);

  // Fallback SVG Logo if image fails - Updated to match new Burgundy/Navy Palette
  if (imgError) {
    return (
      <div className={`flex items-center gap-2 ${className} h-auto`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto aspect-square"
        >
          {/* Burgundy "T" Top */}
          <path d="M4 8H36V14H22V32H18V14H4V8Z" fill="#8B1E1E" />
          {/* Navy Blue Helix/Curve accent */}
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
        <div
          className={`font-bold leading-none ${
            variant === "light" ? "text-white" : "text-slate-800"
          }`}
        >
          <div className="text-lg tracking-tight font-sans">Tertius</div>
          <div className="text-[12px] text-[#8B1E1E] tracking-widest uppercase">
            Integrity AI
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      // Using the uploaded logo-white.png if available, otherwise falls back to your original path
      src="/logo-white.png"
      alt="Tertius Life Sciences"
      className={`${className} object-contain`}
      onError={(e) => {
        // Try the original path if the new one fails, or switch to SVG
        const target = e.target as HTMLImageElement;
        if (target.src.includes("logo-white.png")) {
          target.src = "/tertius_logo.jpg";
        } else {
          setImgError(true);
        }
      }}
    />
  );
};
