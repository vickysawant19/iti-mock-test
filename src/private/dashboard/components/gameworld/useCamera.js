import { useMotionValue, animate } from "framer-motion";
import { useRef, useState, useCallback, useMemo } from "react";
import { getCameraBounds } from "./CameraUtils";

/**
 * Custom hook to control and animate the GameWorld camera.
 * Uses Framer Motion's MotionValues for performance (60 FPS rendering).
 * 
 * IMPORTANT: The returned object is memoized so that consumers can safely
 * include `camera` in useEffect/useCallback dependency arrays without
 * triggering infinite re-render loops.
 */
export default function useCamera({ worldWidth = 500, worldHeight, initialScale = 1.05 }) {
  // MotionValues for 60 FPS transform rendering
  const mapX = useMotionValue(0);
  const mapY = useMotionValue(0);
  const scale = useMotionValue(initialScale);

  // Viewport size state is kept in React to trigger re-calculation of bounds and center points on resize
  const [viewportSize, setViewportSize] = useState({ width: 500, height: 390 });
  const activeAnimationRef = useRef({ x: null, y: null, scale: null });

  const stopAnimations = useCallback(() => {
    if (activeAnimationRef.current.x) activeAnimationRef.current.x.stop();
    if (activeAnimationRef.current.y) activeAnimationRef.current.y.stop();
    if (activeAnimationRef.current.scale) activeAnimationRef.current.scale.stop();
    mapX.stop();
    mapY.stop();
    scale.stop();
    activeAnimationRef.current = { x: null, y: null, scale: null };
  }, [mapX, mapY, scale]);

  const clampAndSet = useCallback((x, y, s = scale.get()) => {
    const { minX, maxX, minY, maxY } = getCameraBounds(
      viewportSize.width,
      viewportSize.height,
      worldWidth,
      worldHeight,
      s
    );
    mapX.set(Math.max(minX, Math.min(maxX, x)));
    mapY.set(Math.max(minY, Math.min(maxY, y)));
  }, [mapX, mapY, scale, viewportSize, worldWidth, worldHeight]);

  const panCamera = useCallback((dx, dy) => {
    stopAnimations();
    const currentX = mapX.get();
    const currentY = mapY.get();
    clampAndSet(currentX + dx, currentY + dy);
  }, [mapX, mapY, stopAnimations, clampAndSet]);

  const animateTo = useCallback((targetX, targetY, targetScale, options = {}) => {
    stopAnimations();

    const { minX, maxX, minY, maxY } = getCameraBounds(
      viewportSize.width,
      viewportSize.height,
      worldWidth,
      worldHeight,
      targetScale
    );

    const clampedX = Math.max(minX, Math.min(maxX, targetX));
    const clampedY = Math.max(minY, Math.min(maxY, targetY));

    const springConfig = {
      type: "spring",
      stiffness: options.stiffness ?? 180,
      damping: options.damping ?? 22,
      restDelta: 0.5,
    };

    const animX = animate(mapX, clampedX, springConfig);
    const animY = animate(mapY, clampedY, springConfig);
    const animScale = animate(scale, targetScale, {
      type: "spring",
      stiffness: options.stiffnessScale ?? 150,
      damping: options.dampingScale ?? 20,
      restDelta: 0.005,
    });

    activeAnimationRef.current = { x: animX, y: animY, scale: animScale };
  }, [mapX, mapY, scale, stopAnimations, viewportSize, worldWidth, worldHeight]);

  const recenterOnNode = useCallback((node, targetZoom = scale.get(), options = {}) => {
    if (!node) return;
    const targetX = viewportSize.width / 2 - node.pixelX * targetZoom;
    const targetY = viewportSize.height / 2 - node.pixelY * targetZoom;
    animateTo(targetX, targetY, targetZoom, options);
  }, [viewportSize, scale, animateTo]);

  const zoomTo = useCallback((targetZoom, options) => {
    const currentScale = scale.get();
    const focusWorldX = (viewportSize.width / 2 - mapX.get()) / currentScale;
    const focusWorldY = (viewportSize.height / 2 - mapY.get()) / currentScale;

    const targetX = viewportSize.width / 2 - focusWorldX * targetZoom;
    const targetY = viewportSize.height / 2 - focusWorldY * targetZoom;

    animateTo(targetX, targetY, targetZoom, options);
  }, [mapX, mapY, scale, viewportSize, animateTo]);

  // Memoize the return object so that the reference is stable across renders.
  // It only changes when one of the constituent values/functions actually changes.
  return useMemo(() => ({
    mapX,
    mapY,
    scale,
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height,
    setViewportSize,
    panCamera,
    zoomTo,
    recenterOnNode,
    animateTo,
    clampAndSet,
    stopAnimations,
  }), [
    mapX, mapY, scale,
    viewportSize.width, viewportSize.height, setViewportSize,
    panCamera, zoomTo, recenterOnNode, animateTo, clampAndSet, stopAnimations,
  ]);
}
