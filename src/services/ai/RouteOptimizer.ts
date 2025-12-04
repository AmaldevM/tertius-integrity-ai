
import { Customer, MonthlyTourPlan, TourPlanEntry } from '../../types';
import { getAllCustomers } from '../mockDatabase';

// Simple distance calculation (Haversine-ish or Euclidean for local grid)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

export const optimizeTourPlan = async (currentPlan: MonthlyTourPlan): Promise<{ optimizedPlan: MonthlyTourPlan, savingsKm: number }> => {
    // 1. Get all customers to find their locations
    const allCustomers = await getAllCustomers();
    const customerMap = new Map(allCustomers.map(c => [c.id, c]));

    // 2. Analyze each day's route
    // For this mock, we'll just simulate an optimization for one day
    // In a real app, this would solve TSP for each day's list of customers

    // Mock result:
    const savingsKm = 45; // Simulated savings

    // We'll just return the plan as-is but mark it as "Optimized" in metadata if we had it
    // Or we could reorder entries if they had specific customers attached (currently entries are just territory/activity based)

    return {
        optimizedPlan: currentPlan,
        savingsKm
    };
};

export const suggestNextBestAction = async (userId: string, lat: number, lng: number): Promise<Customer | null> => {
    const allCustomers = await getAllCustomers();

    // Find nearest customer who hasn't been visited recently (mock logic)
    let nearest: Customer | null = null;
    let minDist = Infinity;

    for (const c of allCustomers) {
        if (c.geoLat && c.geoLng) {
            const dist = calculateDistance(lat, lng, c.geoLat, c.geoLng);
            if (dist < minDist) {
                minDist = dist;
                nearest = c;
            }
        }
    }

    return nearest;
};
