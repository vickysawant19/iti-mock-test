import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl px-3 py-2 shadow-lg border border-white/40 dark:border-slate-800">
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</p>
      <p className="text-sm font-extrabold text-pink-600 dark:text-pink-400">
        {payload[0].value}%
      </p>
    </div>
  );
};

const AttendanceTrendChart = ({ data = [] }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-6 text-center">
        <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
          No attendance data to display yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-500" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
          Attendance Trend
        </h3>
      </div>
      <div className="p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              tick={{ fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94a3b8"
              tick={{ fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke="#ec4899"
              strokeWidth={2.5}
              fill="url(#attendanceGrad)"
              dot={{ r: 4, fill: "#ec4899", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, fill: "#ec4899" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceTrendChart;
