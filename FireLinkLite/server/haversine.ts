/**
 * Calculate the great circle distance between two points on Earth
 * using the Haversine formula
 * 
 * @param lat1 Latitude of first point in degrees
 * @param lng1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lng2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert latitude and longitude from degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find all points within a given radius of a center point
 * 
 * @param centerLat Center point latitude
 * @param centerLng Center point longitude
 * @param points Array of points with lat/lng properties
 * @param radiusKm Radius in kilometers
 * @returns Array of points within the radius
 */
export function findPointsWithinRadius<T extends { lat: number; lng: number }>(
  centerLat: number,
  centerLng: number,
  points: T[],
  radiusKm: number
): T[] {
  return points.filter(point => {
    const distance = calculateDistance(centerLat, centerLng, point.lat, point.lng);
    return distance <= radiusKm;
  });
}

/**
 * Calculate bounding box coordinates for a given center point and radius
 * Useful for database queries to pre-filter results before applying Haversine
 * 
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(centerLat: number, centerLng: number, radiusKm: number) {
  const latDelta = (radiusKm / 111.32); // 1 degree of latitude ≈ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos(toRadians(centerLat)));
  
  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLng: centerLng - lngDelta,
    maxLng: centerLng + lngDelta,
  };
}
