import * as Location from 'expo-location';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedAddress {
  street: string;
  district: string;
  city: string;
  fullAddress: string;
}

// Default fallback coordinates (Bandung City Center)
export const DEFAULT_COORDINATES: UserCoordinates = {
  latitude: -6.9147,
  longitude: 107.6098,
};

/**
 * Request foreground GPS permission from the user
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get current real-time GPS location of user
 */
export async function getCurrentUserLocation(): Promise<UserCoordinates> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      return DEFAULT_COORDINATES;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return DEFAULT_COORDINATES;
  }
}

/**
 * Convert lat/lng coordinates into readable address text (Modern Web API Reverse Geocoding)
 * Replaces deprecated Expo Location.reverseGeocodeAsync with OpenStreetMap Nominatim REST Web API
 */
export async function reverseGeocodeAddress(
  latitude: number,
  longitude: number
): Promise<GeocodedAddress> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ERCoffeeLabApp/1.0',
      },
    });

    const data = await response.json();

    if (data && data.display_name) {
      const addr = data.address || {};
      const street = addr.road || addr.pedestrian || addr.suburb || 'Jl. Raya';
      const houseNum = addr.house_number ? ` No. ${addr.house_number}` : '';
      const streetFull = `${street}${houseNum}`;
      const district = addr.suburb || addr.city_district || addr.district || addr.county || 'Bandung';
      const city = addr.city || addr.town || addr.municipality || 'Bandung';
      const fullAddress = data.display_name;

      return {
        street: streetFull,
        district,
        city,
        fullAddress,
      };
    }
  } catch {
    // Graceful fallback if geocoding fails or offline
  }

  return {
    street: 'Jl. Summarecon Raya No. 10',
    district: 'Gedebage',
    city: 'Bandung',
    fullAddress: 'Jl. Summarecon Raya No. 10, Gedebage, Bandung',
  };
}

/**
 * Search locations by query string (Modern Web API Forward Geocoding)
 */
export async function searchLocationApi(queryText: string): Promise<any[]> {
  if (!queryText || queryText.trim().length < 3) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=id&limit=5&q=${encodeURIComponent(
      queryText
    )}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ERCoffeeLabApp/1.0',
      },
    });

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Calculate distance in kilometers between two lat/lng coordinates (Haversine Formula)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

/**
 * Find nearest outlet from a list of outlets given user coordinates
 */
export function findNearestOutlet<T extends { latitude?: number | null; longitude?: number | null }>(
  outlets: T[],
  userLat: number,
  userLng: number
): { outlet: T; distanceKm: number } | null {
  if (!outlets || outlets.length === 0) return null;

  let closestOutlet: T = outlets[0];
  let minDistance = Infinity;

  for (const outlet of outlets) {
    const oLat = outlet.latitude ?? DEFAULT_COORDINATES.latitude;
    const oLng = outlet.longitude ?? DEFAULT_COORDINATES.longitude;
    const dist = calculateHaversineDistance(userLat, userLng, oLat, oLng);

    if (dist < minDistance) {
      minDistance = dist;
      closestOutlet = outlet;
    }
  }

  return { outlet: closestOutlet, distanceKm: minDistance };
}
