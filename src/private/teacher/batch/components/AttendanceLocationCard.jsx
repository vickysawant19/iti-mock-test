import React from "react";
import { MapPin, Clock, Navigation, Map as MapIcon, Locate } from "lucide-react";
import { ClipLoader } from "react-spinners";
import LocationPicker from "@/private/teacher/components/LocationPicker";

const AttendanceLocationCard = ({
  register,
  watch,
  setValue,
  batchData,
  showMaps,
  setShowMaps,
  locationLoading,
  handleGetLocation,
}) => {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <MapPin className="text-amber-600 dark:text-amber-400" size={20} />
        </div>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          Attendance & Location
        </h2>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Time */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              Daily Attendance Time Window
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  {...register("attendanceTime.start", {})}
                  className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  {...register("attendanceTime.end", {})}
                  className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Radius */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Navigation size={16} className="text-slate-400" />
                Geofence Radius
              </h3>
              <span className="text-xs font-black px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg">
                {watch("circleRadius")}m
              </span>
            </div>
            <div className="pt-2">
              <input
                type="range"
                min={10}
                max={10000}
                {...register("circleRadius", {})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                Allowed distance threshold from campus location (10m - 10,000m)
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MapIcon size={16} className="text-slate-400" />
              Location Coordinates
            </h3>
            <button
              type="button"
              onClick={() => setShowMaps((prev) => !prev)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                showMaps
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {showMaps ? "Hide Interactive Map" : "Show Interactive Map"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Navigation className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={watch("location.lat") || ""}
                placeholder="Latitude"
                className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs font-bold"
                disabled
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Navigation className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={watch("location.lon") || ""}
                placeholder="Longitude"
                className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs font-bold"
                disabled
              />
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-xs cursor-pointer shadow-2xs"
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ClipLoader size={16} color="currentColor" />
              ) : (
                <>
                  <Locate size={16} className="text-indigo-500" />
                  Capture Current GPS Location
                </>
              )}
            </button>
          </div>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 ${
              showMaps ? "h-80 opacity-100" : "h-0 opacity-0 border-0"
            }`}
          >
            {showMaps && (
              <LocationPicker
                batchLocation={batchData?.location || undefined}
                deviceLocation={watch("location")}
                setValue={setValue}
                circleRadius={watch("circleRadius")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceLocationCard;
