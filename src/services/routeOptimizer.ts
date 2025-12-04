import { Customer, CustomerCategory } from '../types';

interface GeoPoint {
    lat: number;
    lng: number;
}

// Haversine formula to calculate distance between two points in km
function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(point2.lat - point1.lat);
    const dLng = deg2rad(point2.lng - point1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(point1.lat)) * Math.cos(deg2rad(point2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Optimizes the route for a list of customers starting from a given location.
 * Uses a greedy Nearest Neighbor approach weighted by customer priority.
 */
export const optimizeRoute = (
    customers: Customer[],
    startLocation: GeoPoint
): Customer[] => {
    if (customers.length === 0) return [];

    // Filter out customers without location data
    const validCustomers = customers.filter(c => c.geoLat !== undefined && c.geoLng !== undefined);
    const invalidCustomers = customers.filter(c => c.geoLat === undefined || c.geoLng === undefined);

    const optimizedRoute: Customer[] = [];
    let currentLocation = startLocation;
    const remainingCustomers = [...validCustomers];

    while (remainingCustomers.length > 0) {
        let bestScore = -Infinity;
        let bestCustomerIndex = -1;

        for (let i = 0; i < remainingCustomers.length; i++) {
            const customer = remainingCustomers[i];
            const dist = calculateDistance(currentLocation, { lat: customer.geoLat!, lng: customer.geoLng! });

            // Priority weights: A=3, B=2, C=1
            let priorityWeight = 1;
            if (customer.category === CustomerCategory.A) priorityWeight = 3;
            else if (customer.category === CustomerCategory.B) priorityWeight = 2;

            // Score: Higher is better. 
            // We want to minimize distance and maximize priority.
            // Formula: (Priority * 10) - Distance
            // This means we are willing to travel ~10km extra for a higher priority category
            const score = (priorityWeight * 10) - dist;

            if (score > bestScore) {
                bestScore = score;
                bestCustomerIndex = i;
            }
        }

        if (bestCustomerIndex !== -1) {
            const nextCustomer = remainingCustomers[bestCustomerIndex];
            optimizedRoute.push(nextCustomer);
            currentLocation = { lat: nextCustomer.geoLat!, lng: nextCustomer.geoLng! };
            remainingCustomers.splice(bestCustomerIndex, 1);
        } else {
            // Should not happen if list is not empty
            break;
        }
    }

    // Append customers without location at the end
    return [...optimizedRoute, ...invalidCustomers];
};
