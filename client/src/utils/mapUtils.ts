// src/utils/mapUtils.ts

// The real-world GPS bounds of the campus based on user input
export const CAMPUS_BOUNDS = {
  topLeft: { lat: 21.399430, lng: 81.888738 },
  bottomRight: { lat: 21.393184, lng: 81.892709 },
};

// The dimensions of our virtual canvas map in pixels
export const MAP_DIMENSIONS = {
  width: 1600,
  height: 2700,
};

/**
 * Maps real-world GPS coordinates to virtual 2D canvas coordinates.
 */
export const mapGpsToCanvas = (lat: number, lng: number) => {
  // Clamp values so avatars don't go flying off the map if GPS glitches slightly outside bounds
  const clampedLat = Math.min(Math.max(lat, CAMPUS_BOUNDS.bottomRight.lat), CAMPUS_BOUNDS.topLeft.lat);
  const clampedLng = Math.min(Math.max(lng, CAMPUS_BOUNDS.topLeft.lng), CAMPUS_BOUNDS.bottomRight.lng);

  // Calculate the total range of the campus in coordinates
  const latRange = CAMPUS_BOUNDS.topLeft.lat - CAMPUS_BOUNDS.bottomRight.lat;
  const lngRange = CAMPUS_BOUNDS.bottomRight.lng - CAMPUS_BOUNDS.topLeft.lng;

  // X goes left to right (Longitude)
  const xPercent = (clampedLng - CAMPUS_BOUNDS.topLeft.lng) / lngRange;
  
  // Y goes top to bottom (Latitude). Higher latitude is NORTH (Top), but Canvas Y goes DOWN.
  const yPercent = (CAMPUS_BOUNDS.topLeft.lat - clampedLat) / latRange;

  return {
    x: xPercent * MAP_DIMENSIONS.width,
    y: yPercent * MAP_DIMENSIONS.height,
  };
};
