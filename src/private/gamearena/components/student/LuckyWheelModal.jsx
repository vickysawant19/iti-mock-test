/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Coins, Zap, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Procedural sound synthesis using Web Audio API
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "tick") {
      // Small mechanical clicking sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === "win") {
      // Golden coin/arcade win chime
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        
        gain.gain.setValueAtTime(0.12, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
        
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    }
  } catch (e) {
    console.warn("Audio Context blocked or unsupported:", e);
  }
};

const WHEEL_REWARDS = [
  { text: "+20 Coins", type: "coins", value: 20, color: "#9c27b0" }, // Purple
  { text: "+50 XP", type: "xp", value: 50, color: "#1a153a" },      // Dark Slate
  { text: "+10 Coins", type: "coins", value: 10, color: "#ec4899" }, // Pink
  { text: "+100 XP", type: "xp", value: 100, color: "#3b82f6" },    // Blue
  { text: "+50 Coins", type: "coins", value: 50, color: "#f59e0b" }, // Gold
  { text: "+25 XP", type: "xp", value: 25, color: "#10b981" },      // Emerald
  { text: "+5 Coins", type: "coins", value: 5, color: "#6366f1" },   // Indigo
  { text: "+150 XP", type: "xp", value: 150, color: "#8b5cf6" }      // Violet
];

export default function LuckyWheelModal({ isOpen, onClose, canSpin, spinLuckyWheel, stats }) {
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reward, setReward] = useState(null);
  const [cooldown, setCooldown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [eligibility, setEligibility] = useState(false);
  
  // Physics refs
  const angleRef = useRef(0);
  const speedRef = useRef(0);
  const pointerOffsetRef = useRef(0); // For pointer wiggle animation

  // Check spin eligibility and maintain cooldown ticker
  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = () => {
      const allowed = canSpin();
      setEligibility(allowed);

      // Cooldown timer calculation
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setCooldown({ hours, minutes, seconds });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [isOpen, canSpin]);

  // Initial draw of the canvas wheel
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawWheel(angleRef.current);
    }
  }, [isOpen]);

  const drawWheel = (angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2 - 12;

    ctx.clearRect(0, 0, width, height);

    const numSlices = WHEEL_REWARDS.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    WHEEL_REWARDS.forEach((reward, i) => {
      const startAngle = i * sliceAngle + angle;
      const endAngle = startAngle + sliceAngle;

      // Draw Slice background
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = reward.color;
      ctx.fill();

      // Thin borders
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Text label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = "black 10px Inter, sans-serif";
      
      // Position text outwards from center
      ctx.fillText(reward.text, radius - 15, 0);
      ctx.restore();
    });

    // Outer premium Gold Rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#fbbf24"; // Gold color
    ctx.lineWidth = 6;
    ctx.stroke();

    // Draw little gold circles along outer rim
    for (let i = 0; i < 24; i++) {
      const a = (i * 2 * Math.PI) / 24 + angle;
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    // Draw Inner Center cap
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e1b4b"; // Dark Indigo center
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();

    // Draw center star or glow icon
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText("🌟", cx, cy);
  };

  const spin = () => {
    if (isSpinning || !eligibility) return;

    setIsSpinning(true);
    setReward(null);

    // Initial spin configuration
    // Minimum 4 rotations + random angle
    const minRotations = 5;
    const targetAngle = minRotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const duration = 4000; // 4 seconds duration
    const startTime = performance.now();
    const initialAngle = angleRef.current;

    // Tracker to trigger tick sounds as boundaries cross
    const numSlices = WHEEL_REWARDS.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    let lastTickSlice = -1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic deceleration easing curve
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentRotation = initialAngle + targetAngle * easeOutCubic;
      angleRef.current = currentRotation;

      drawWheel(currentRotation);

      // Physics sound tick logic
      // Check which slice boundary is currently crossing the top (270 degrees = 3/2 * Math.PI)
      const topOffset = (3 / 2) * Math.PI;
      const normalizedAngle = (currentRotation - topOffset) % (2 * Math.PI);
      const relativeAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
      // Index pointing at top is inverted from angle direction
      const currentSliceIdx = Math.floor(((2 * Math.PI - relativeAngle) % (2 * Math.PI)) / sliceAngle);

      if (currentSliceIdx !== lastTickSlice) {
        playSound("tick");
        lastTickSlice = currentSliceIdx;
        // Wiggle the physical pointer
        pointerOffsetRef.current = -15;
      } else {
        pointerOffsetRef.current *= 0.85; // Decelerate pointer wiggle
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Spin finished
        setIsSpinning(false);
        const finalReward = WHEEL_REWARDS[currentSliceIdx];
        
        // Save spin in database
        const xpGained = finalReward.type === "xp" ? finalReward.value : 0;
        const coinsGained = finalReward.type === "coins" ? finalReward.value : 0;
        
        spinLuckyWheel(xpGained, coinsGained).then(() => {
          setReward(finalReward);
          playSound("win");
        });
      }
    };

    requestAnimationFrame(animate);
  };

  // Confetti burst for correct answers
  const renderConfetti = () => {
    const colors = ["#fbbf24", "#fb7185", "#c084fc", "#60a5fa", "#34d399"];
    return Array.from({ length: 45 }).map((_, i) => {
      const color = colors[i % colors.length];
      const randomX = Math.random() * 320 - 160;
      const randomY = Math.random() * -320 - 100;
      return (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: randomX, y: randomY, scale: [0, 1, 0.7, 0], rotate: Math.random() * 360 }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: "6px",
            height: "6px",
            borderRadius: i % 2 === 0 ? "50%" : "2px",
            backgroundColor: color,
            zIndex: 100,
          }}
        />
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={() => !isSpinning && onClose()}
      />

      {/* Card container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 text-center text-white shadow-2xl backdrop-blur-xl"
      >
        {reward && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-50">
            {renderConfetti()}
          </div>
        )}

        {/* Close Button */}
        {!isSpinning && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="mb-4">
          <h2 className="flex items-center justify-center gap-2 font-poppins text-lg font-black uppercase tracking-wider text-amber-400">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-400" />
            LUCKY SPIN
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Test your luck once every day!
          </p>
        </div>

        {/* Wheel Canvas Container */}
        <div className="relative mx-auto my-6 flex h-[280px] w-[280px] items-center justify-center rounded-full bg-slate-900/60 p-2 shadow-inner">
          <canvas
            ref={canvasRef}
            width={264}
            height={264}
            className="h-full w-full rounded-full"
          />

          {/* Physical pointer arrow */}
          <div 
            className="absolute top-[-2px] left-1/2 -translate-x-1/2 z-20 transition-transform duration-75"
            style={{
              transform: `translateX(-50%) rotate(${pointerOffsetRef.current}deg)`,
              transformOrigin: "top center"
            }}
          >
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        {/* Spin Actions / Rewards Display */}
        <div className="mt-4 space-y-4">
          <AnimatePresence mode="wait">
            {reward ? (
              <motion.div
                key="reward"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-center"
              >
                <p className="text-[10px] font-black tracking-widest text-amber-500 uppercase">You Unlocked</p>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  {reward.type === "coins" ? (
                    <Coins className="h-6 w-6 text-yellow-400 animate-bounce" />
                  ) : (
                    <Zap className="h-6 w-6 text-pink-500 animate-bounce" />
                  )}
                  <span className="text-2xl font-black text-white tracking-wide">
                    {reward.text}
                  </span>
                </div>
                <Button 
                  onClick={onClose}
                  className="w-full mt-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-10"
                >
                  Awesome!
                </Button>
              </motion.div>
            ) : eligibility ? (
              <motion.div key="spin-btn">
                <Button
                  onClick={spin}
                  disabled={isSpinning}
                  className="w-full relative overflow-hidden h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:from-amber-350 hover:to-amber-500 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSpinning ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      SPINNING...
                    </span>
                  ) : (
                    "SPIN NOW!"
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="cooldown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-slate-900/50 border border-slate-800 p-3.5 text-center"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Spin Unlocks In</p>
                <div className="flex items-center justify-center gap-1.5 mt-2 font-mono text-lg font-black text-slate-200">
                  <span className="bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-850">{String(cooldown.hours).padStart(2, "0")}h</span>
                  <span>:</span>
                  <span className="bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-850">{String(cooldown.minutes).padStart(2, "0")}m</span>
                  <span>:</span>
                  <span className="bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-850 text-pink-500">{String(cooldown.seconds).padStart(2, "0")}s</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
