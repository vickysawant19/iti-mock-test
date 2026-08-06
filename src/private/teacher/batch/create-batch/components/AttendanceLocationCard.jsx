import React from "react";
import { MapPin, Clock, Navigation, Map as MapIcon, Locate } from "lucide-react";
import { ClipLoader } from "react-spinners";
import LocationPicker from "../../../components/LocationPicker";

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
    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <MapPin className="text-amber-600 dark:text-amber-400" size={20} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Attendance & Location
        </h2>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              Attendance Timing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  {...register("attendanceTime.start", {})}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  {...register("attendanceTime.end", {})}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Radius */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Navigation size={16} className="text-gray-500" />
                Attendance Radius
              </h3>
              <span className="text-xs font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                {watch("circleRadius")}m
              </span>
            </div>
            <div className="pt-2">
              <input
                type="range"
                min={10}
                max={10000}
                {...register("circleRadius", {})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Allowed distance from center (10m - 10,000m)
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <MapIcon size={16} className="text-gray-500" />
              Location Coordinates
            </h3>
            <button
              type="button"
              onClick={() => setShowMaps((prev) => !prev)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                showMaps
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {showMaps ? "Hide Map" : "Show Map"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Navigation className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={watch("location.lat") || ""}
                placeholder="Latitude"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm"
                disabled
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Navigation className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={watch("location.lon") || ""}
                placeholder="Longitude"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm"
                disabled
              />
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-sm cursor-pointer"
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ClipLoader size={16} color="currentColor" />
              ) : (
                <>
                  <Locate size={16} />
                  Get Current Location
                </>
              )}
            </button>
          </div>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${
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
