export const haversineDistance = (coords1, coords2) => {
  if (!coords1?.lat || !coords1?.lon || !coords2?.lat || !coords2?.lon) {
    return 0; // Return 0 if coordinates are invalid
  }
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3; // Earth's radius in meters
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);
    const deltaLat = toRad(coords2.lat - coords1.lat);
    const deltaLon = toRad(coords2.lon - coords1.lon);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };