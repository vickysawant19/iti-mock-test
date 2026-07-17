import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { clamp, getCameraBounds, findNearestStage } from "./CameraUtils";

export default function GameViewport({
  camera,
  worldWidth = 500,
  worldHeight,
  coordinates = [],
  onFocusStageChange,
  children,
}) {
  const viewportRef = useRef(null);
  const dragStartRef = useRef(null);
  const velocityRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const {
    mapX,
    mapY,
    scale,
    viewportWidth,
    viewportHeight,
    setViewportSize,
    panCamera,
    animateTo,
    stopAnimations,
  } = camera;

  // Observe viewport element size changes to update camera bounds
  useEffect(() => {
    if (!viewportRef.current) return;
    const updateSize = () => {
      if (viewportRef.current) {
        setViewportSize({
          width: viewportRef.current.clientWidth,
          height: viewportRef.current.clientHeight,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewportRef.current);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [setViewportSize]);

  const DRAG_THRESHOLD = 5; // pixels — pointer must move this far to start dragging
  const hasDraggedRef = useRef(false);

  // Pointer drag gestures
  const handlePointerDown = (e) => {
    // Only drag with left mouse button / single touch
    if (e.button !== 0 && e.pointerType === "mouse") return;

    // Prevent map drag if the target is interactive
    const target = e.target;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest(".pointer-events-auto")
    ) {
      return;
    }

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      mapX: mapX.get(),
      mapY: mapY.get(),
      time: performance.now(),
    };
    velocityRef.current = { x: 0, y: 0 };
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;

    const start = dragStartRef.current;
    const dx = e.clientX - start.pointerX;
    const dy = e.clientY - start.pointerY;

    // Don't start actual dragging until past threshold
    if (!hasDraggedRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      // Past threshold — now capture the pointer and start dragging
      hasDraggedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      stopAnimations();
    }

    let targetX = start.mapX + dx;
    let targetY = start.mapY + dy;

    // Apply rubber banding at edges
    const currentScale = scale.get();
    const { minX, maxX, minY, maxY } = getCameraBounds(
      viewportWidth,
      viewportHeight,
      worldWidth,
      worldHeight,
      currentScale
    );

    if (targetX > maxX) {
      targetX = maxX + (targetX - maxX) * 0.3;
    } else if (targetX < minX) {
      targetX = minX + (targetX - minX) * 0.3;
    }

    if (targetY > maxY) {
      targetY = maxY + (targetY - maxY) * 0.3;
    } else if (targetY < minY) {
      targetY = minY + (targetY - minY) * 0.3;
    }

    // Track velocity BEFORE setting (so we measure from last frame)
    const prevX = mapX.get();
    const prevY = mapY.get();

    mapX.set(targetX);
    mapY.set(targetY);

    // Track instantaneous drag velocity
    const now = performance.now();
    const dt = now - start.time;
    if (dt > 10) {
      velocityRef.current = {
        x: (targetX - prevX) / dt,
        y: (targetY - prevY) / dt,
      };
      dragStartRef.current.time = now;
      dragStartRef.current.mapX = targetX;
      dragStartRef.current.mapY = targetY;
      dragStartRef.current.pointerX = e.clientX;
      dragStartRef.current.pointerY = e.clientY;
    }
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // If the pointer didn't move past threshold, this was a tap/click — let it through
    if (!hasDraggedRef.current) {
      dragStartRef.current = null;
      return;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) { /* already released */ }

    const currentScale = scale.get();
    const currentX = mapX.get();
    const currentY = mapY.get();

    // 1. Calculate momentum projected target
    const vy = velocityRef.current.y;
    const vx = velocityRef.current.x;
    
    // Apply velocity only if fast enough (to avoid minor tremors)
    const momentumMultiplier = 150; // controls gliding distance
    const projectedX = currentX + (Math.abs(vx) > 0.05 ? vx * momentumMultiplier : 0);
    const projectedY = currentY + (Math.abs(vy) > 0.05 ? vy * momentumMultiplier : 0);

    // 2. Glide camera to projected position (free panning with inertia)
    animateTo(projectedX, projectedY, currentScale, {
      stiffness: 140,
      damping: 24,
    });

    // 3. Find the nearest stage to that projected focus to update highlights
    const projCamWorldX = (viewportWidth / 2 - projectedX) / currentScale;
    const projCamWorldY = (viewportHeight / 2 - projectedY) / currentScale;
    const nearestIndex = findNearestStage(coordinates, projCamWorldX, projCamWorldY);
    const nearestNode = coordinates[nearestIndex];

    if (nearestNode) {
      if (onFocusStageChange) {
        onFocusStageChange(nearestIndex);
      }
    }
  };

  return (
    <div
      ref={viewportRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative h-full w-full select-none overflow-hidden bg-slate-950/20 border-b border-indigo-500/10 shadow-inner touch-manipulation"
      style={{ perspective: 1000, touchAction: "none" }}
    >
      <div 
        className="absolute inset-0"
        style={{
          transformOrigin: "center center",
          transform: "rotateX(12deg)",
          transformStyle: "preserve-3d"
        }}
      >
        <motion.div
          style={{
            x: mapX,
            y: mapY,
            scale,
            transformOrigin: "0px 0px",
            transformStyle: "preserve-3d",
            height: worldHeight,
            width: worldWidth,
          }}
        className="absolute origin-top-left cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
      </div>
    </div>
  );
}
