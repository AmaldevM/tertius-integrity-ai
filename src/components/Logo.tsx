
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10", variant = 'dark' }) => {
  const [imgError, setImgError] = useState(false);

  // Fallback SVG Logo if image fails
  if (imgError) {
    return (
      <div className={`flex items-center gap-2 ${className} h-auto`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
          <rect width="40" height="40" rx="8" fill="#2563EB" />
          <path d="M12 28V12H28M20 12V28M16 20H24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className={`font-bold leading-none ${variant === 'light' ? 'text-white' : 'text-slate-800'}`}>
          <div className="text-lg tracking-tight">Tertius</div>
          <div className="text-[10px] text-blue-500 tracking-widest uppercase">Integrity AI</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src="/tertius_logo.jpg"
      alt="Tertius Life Sciences"
      className={`${className} object-contain`}
      onError={() => setImgError(true)}
    />
  );
};
