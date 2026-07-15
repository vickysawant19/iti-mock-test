/**
 * Clamps a number between min and max bounds.
 */
export function clamp(val, min, max) {
  if (min > max) return (min + max) / 2;
  return Math.max(min, Math.min(max, val));
}

/**
 * Calculates the bounding constraints for the map position (tx, ty) 
 * given the viewport dimensions, virtual world dimensions, and current scale.
 */
export function getCameraBounds(viewportWidth, viewportHeight, worldWidth, worldHeight, scale) {
  const scaledWidth = worldWidth * scale;
  const scaledHeight = worldHeight * scale;

  // Horizontal bounds (clamp left/right to prevent showing empty space)
  let minX, maxX;
  if (scaledWidth > viewportWidth) {
    minX = viewportWidth - scaledWidth;
    maxX = 0;
  } else {
    // If map is smaller than viewport, center it horizontally
    minX = (viewportWidth - scaledWidth) / 2;
    maxX = minX;
  }

  // Vertical bounds (clamp top/bottom to prevent showing empty space)
  let minY, maxY;
  if (scaledHeight > viewportHeight) {
    minY = viewportHeight - scaledHeight;
    maxY = 0;
  } else {
    // If map is smaller than viewport, center it vertically
    minY = (viewportHeight - scaledHeight) / 2;
    maxY = minY;
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Finds the index of the stage closest to the camera center (camX, camY) in world coordinates.
 */
export function findNearestStage(coordinates, camX, camY) {
  let nearestIndex = 0;
  let minDistance = Infinity;

  coordinates.forEach((stage, idx) => {
    const dx = stage.pixelX - camX;
    const dy = stage.pixelY - camY;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < minDistance) {
      minDistance = d;
      nearestIndex = idx;
    }
  });

  return nearestIndex;
}
