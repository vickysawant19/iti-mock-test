/* eslint-disable react/prop-types */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Flame, Target, BookOpen, Zap, Trophy, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CelebrationOverlays({
  showLevelUp,
  setShowLevelUp,
  stats = {},
  unlockedBadges = [],
}) {
  const getBadgeIcon = (iconName) => {
    switch (iconName) {
      case "Flame": return <Flame className="w-6 h-6" />;
      case "Target": return <Target className="w-6 h-6" />;
      case "BookOpen": return <BookOpen className="w-6 h-6" />;
      case "Zap": return <Zap className="w-6 h-6" />;
      case "Trophy": return <Trophy className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  return (
    <>
      {/* Level Up Overlay Celebration */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLevelUp(false)} />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-slate-900 border border-yellow-500/30 p-8 rounded-3xl text-center max-w-sm text-white shadow-2xl z-10"
            >
              <div className="w-20 h-20 bg-yellow-500/20 border border-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Sparkles className="w-10 h-10 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-black text-yellow-400 tracking-tight mb-2">LEVEL UP!</h2>
              <p className="text-sm text-slate-300 mb-6">
                Congratulations! Your hard work has paid off. You have ascended to:
              </p>
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full text-slate-950 font-black text-lg tracking-wide mb-6">
                Level {stats?.level || 1}
              </div>
              <Button onClick={() => setShowLevelUp(false)} className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl">
                Awesome!
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Badge Unlock Celebration Banner */}
      <AnimatePresence>
        {unlockedBadges.length > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm bg-slate-900 border-2 border-pink-500 rounded-2xl p-4 shadow-2xl flex items-center gap-4 text-white"
          >
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              {getBadgeIcon(unlockedBadges[0].icon)}
            </div>
            <div>
              <p className="text-[10px] font-black text-pink-500 tracking-widest uppercase">New Badge Unlocked!</p>
              <h4 className="text-sm font-black text-white">{unlockedBadges[0].title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{unlockedBadges[0].description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
