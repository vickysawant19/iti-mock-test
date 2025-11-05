import React from "react";

const ScoreBadge = ({ score }) => {
  if (!score) {
    return (
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-gray-400 to-gray-600 text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-110 cursor-pointer">
        <span className="text-sm">NA</span>
      </div>
    );
  }

  const scoreNum = score.score;
  let gradient = "from-red-400 to-rose-600";

  if (scoreNum >= 5) gradient = "from-green-400 to-emerald-600";
  else if (scoreNum >= 4) gradient = "from-blue-400 to-cyan-600";
  else if (scoreNum >= 3) gradient = "from-yellow-400 to-amber-600";
  else if (scoreNum >= 2) gradient = "from-orange-400 to-orange-600";

  return (
    <div
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br ${gradient} text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-110 cursor-pointer`}
      title={`Score: ${scoreNum}`}
    >
      {scoreNum}
    </div>
  );
};

export default ScoreBadge;
