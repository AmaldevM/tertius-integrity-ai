import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    // Optional: Show a brief "Back Online" message, or nothing if stable
    return null; 
  }

  return (
    <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-center gap-2 sticky top-0 z-50 animate-in slide-in-from-top-1">
      <WifiOff size={16} />
      <span className="font-semibold">You are Offline.</span>
      <span>You can continue working. Data will sync when you reconnect.</span>
    </div>
  );
};
