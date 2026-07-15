const getCurvedPath = (points) => {
  if (points.length === 0) return "";

  const controlPoint = (current, previous, next, reverse) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.16;

    const lengthX = n.pixelX - p.pixelX;
    const lengthY = n.pixelY - p.pixelY;

    const speed = Math.sqrt(lengthX * lengthX + lengthY * lengthY);
    const angle = Math.atan2(lengthY, lengthX) + (reverse ? Math.PI : 0);
    const length = speed * smoothing;

    return [current.pixelX + Math.cos(angle) * length, current.pixelY + Math.sin(angle) * length];
  };

  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.pixelX} ${point.pixelY}`;
    const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
    const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
    return `${acc} C ${cpsX.toFixed(2)} ${cpsY.toFixed(2)}, ${cpeX.toFixed(2)} ${cpeY.toFixed(2)}, ${point.pixelX} ${point.pixelY}`;
  }, "");
};

const BASE_COORDINATES = [
  { x: 50, y: 88, type: "start" },
  { x: 30, y: 79, type: "question" },
  { x: 22, y: 68, type: "question" },
  { x: 42, y: 60, type: "bonus" },
  { x: 70, y: 56, type: "question" },
  { x: 78, y: 44, type: "question" },
  { x: 55, y: 36, type: "bonus" },
  { x: 30, y: 30, type: "question" },
  { x: 38, y: 18, type: "question" },
  { x: 50, y: 10, type: "boss" },
];

const getLeague = (wins = 0) => {
  if (wins < 5) return { name: "Bronze League", ring: "border-amber-500/30 bg-amber-500/10", text: "text-amber-300", icon: "text-amber-400", next: 5 };
  if (wins < 15) return { name: "Silver League", ring: "border-slate-400/30 bg-slate-400/10", text: "text-slate-200", icon: "text-slate-200", next: 15 };
  if (wins < 30) return { name: "Gold League", ring: "border-yellow-400/30 bg-yellow-400/10", text: "text-yellow-300", icon: "text-yellow-300", next: 30 };
  return { name: "Diamond League", ring: "border-cyan-400/30 bg-cyan-400/10", text: "text-cyan-300", icon: "text-cyan-300", next: null };
};

export { getCurvedPath, BASE_COORDINATES, getLeague };
