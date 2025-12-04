
import { UserProfile } from './types';

export const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // Distance in meters
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    }
  });
};

export const getMonthName = (monthIndex: number) => {
  return new Date(2025, monthIndex, 1).toLocaleString('default', { month: 'long' });
};

// --- HIERARCHY HELPER ---
// Recursively finds all user IDs that report to a given manager (directly or indirectly)
export const getDownstreamUserIds = (rootUserId: string, allUsers: UserProfile[]): string[] => {
  // 1. Find direct reports
  const directReports = allUsers.filter(u => u.reportingManagerId === rootUserId);
  
  let allIds = directReports.map(u => u.uid);

  // 2. Recursively find their reports
  directReports.forEach(sub => {
     const subIds = getDownstreamUserIds(sub.uid, allUsers);
     allIds = [...allIds, ...subIds];
  });

  return allIds;
};
