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

export interface SearchLocationResult {
  id: string;
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  raw?: any;
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
 * Convert lat/lng coordinates into readable address text (OpenStreetMap Reverse Geocoding)
 * Includes dual-layer fallback (Nominatim + Photon OSM)
 */
export async function reverseGeocodeAddress(
  latitude: number,
  longitude: number
): Promise<GeocodedAddress> {
  // Layer 1: OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ERCoffeeLab-MobileApp/1.0 (contact@ercoffeelab.com)',
        'Accept-Language': 'id,en',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const street = addr.road || addr.pedestrian || addr.residential || addr.suburb || 'Jl. Raya';
        const houseNum = addr.house_number ? ` No. ${addr.house_number}` : '';
        const streetFull = `${street}${houseNum}`;
        const district =
          addr.suburb || addr.city_district || addr.district || addr.county || 'Bandung';
        const city = addr.city || addr.town || addr.municipality || 'Bandung';
        const fullAddress = data.display_name;

        return {
          street: streetFull,
          district,
          city,
          fullAddress,
        };
      }
    }
  } catch {
    // Fallback to Layer 2
  }

  // Layer 2: Photon Komoot OSM Reverse Geocoder
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`;
    const photonRes = await fetch(photonUrl, {
      headers: { 'Accept-Language': 'id,en' },
    });

    if (photonRes.ok) {
      const pData = await photonRes.json();
      const feature = pData?.features?.[0];
      if (feature && feature.properties) {
        const p = feature.properties;
        const street = p.name || p.street || 'Lokasi Terpilih';
        const district = p.district || p.suburb || p.city || 'Bandung';
        const city = p.city || p.county || 'Bandung';
        const fullAddress = [p.name, p.street, p.district, p.city, p.state, p.country]
          .filter(Boolean)
          .join(', ');

        return {
          street,
          district,
          city,
          fullAddress: fullAddress || `${street}, ${city}`,
        };
      }
    }
  } catch {
    // Fallback default
  }

  return {
    street: 'Jl. Buahbatu No. 45',
    district: 'Sekejati',
    city: 'Bandung',
    fullAddress: 'Jl. Buahbatu No. 45, Sekejati, Bandung',
  };
}

/**
 * Search locations with high reliability (Dual-Layer: Nominatim + Photon OSM)
 * Eliminates empty search results and supports AbortSignal for debouncing
 */
export async function searchLocationApi(
  queryText: string,
  signal?: AbortSignal
): Promise<SearchLocationResult[]> {
  const cleanQuery = queryText.trim();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  const results: SearchLocationResult[] = [];
  const seenKeys = new Set<string>();

  // Layer 1: OpenStreetMap Nominatim Search
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=id&limit=6&addressdetails=1&q=${encodeURIComponent(
      cleanQuery
    )}`;

    const response = await fetch(url, {
      signal,
      headers: {
        'User-Agent': 'ERCoffeeLab-MobileApp/1.0 (contact@ercoffeelab.com)',
        'Accept-Language': 'id,en',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        for (const item of data) {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          if (isNaN(lat) || isNaN(lon)) continue;

          const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            const nameParts = (item.display_name || '').split(',');
            const title = item.name || nameParts[0]?.trim() || cleanQuery;
            const subtitle = nameParts.slice(1, 4).join(',').trim() || item.display_name;

            results.push({
              id: `osm-${item.place_id || Math.random()}`,
              title,
              subtitle: subtitle || item.display_name,
              latitude: lat,
              longitude: lon,
              raw: item,
            });
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
  }

  // Layer 2: Photon Komoot OSM API Fallback (if Nominatim rate-limited or yielded few results)
  if (results.length < 3) {
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        cleanQuery
      )}&limit=6&lat=-6.9147&lon=107.6098`;

      const pRes = await fetch(photonUrl, {
        signal,
        headers: { 'Accept-Language': 'id,en' },
      });

      if (pRes.ok) {
        const pData = await pRes.json();
        const features = pData?.features || [];

        for (const f of features) {
          const coords = f.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) continue;

          const lon = coords[0];
          const lat = coords[1];
          const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;

          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            const p = f.properties || {};
            const title = p.name || p.street || cleanQuery;
            const subtitle = [p.street, p.district, p.city, p.state]
              .filter(Boolean)
              .join(', ');

            results.push({
              id: `photon-${p.osm_id || Math.random()}`,
              title,
              subtitle: subtitle || p.country || 'Indonesia',
              latitude: lat,
              longitude: lon,
              raw: f,
            });
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw err;
      }
    }
  }

  return results;
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

/**
 * Forward-geocode address text into { latitude, longitude } with OpenStreetMap Nominatim + Photon Komoot fallback.
 */
export async function forwardGeocodeAddress(
  addressText: string
): Promise<UserCoordinates | null> {
  if (!addressText || addressText.trim().length < 3) return null;

  try {
    const results = await searchLocationApi(addressText.trim());
    if (results && results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
    }
  } catch (err) {
    console.warn('[location-service] forwardGeocodeAddress error:', err);
  }

  return null;
}

