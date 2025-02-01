import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { X, Loader2 } from "lucide-react";
import CustomCalendar from "./Calender";
import { selectProfile } from "../../../../store/profileSlice";
import batchService from "../../../../appwrite/batchService";

const MarkHolidays = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceHolidays, setAttendanceHolidays] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profile = useSelector(selectProfile);

  const fetchBatchData = async () => {
    setIsLoading(true);
    try {
      const data = await batchService.getBatch(profile.batchId);
      setAttendanceHolidays(
        data?.attendanceHolidays.map((item) => JSON.parse(item)) || []
      );
    } catch (error) {
      console.error("Error fetching batch data:", error);
      toast.error("Failed to load holiday data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.batchId) {
      fetchBatchData();
    }
  }, [profile]);

  const saveModalData = (e) => {
    e.preventDefault();
    if (!modalData.holidayText?.trim()) {
      toast.error("Please enter a holiday description");
      return;
    }

    setAttendanceHolidays((prev) => [
      ...prev.filter(
        (holiday) => holiday.date !== format(selectedDate, "yyyy-MM-dd")
      ),
      {
        ...modalData,
        holidayText: modalData.holidayText.trim(),
      },
    ]);
    setModalData({});
    setShowModal(false);
    toast.success("Holiday added successfully");
  };

  const openModal = (date) => {
    const existingData = attendanceHolidays.find(
      (holiday) => holiday.date === date
    );
    setModalData(
      existingData || {
        date,
        isHoliday: true,
        holidayText: "",
      }
    );
    setShowModal(true);
  };

  const removeModalData = () => {
    setAttendanceHolidays((prev) =>
      prev.filter(
        (holiday) => holiday.date !== format(selectedDate, "yyyy-MM-dd")
      )
    );
    setShowModal(false);
    toast.success("Holiday removed successfully");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const stringifyData = attendanceHolidays.map((item) =>
        JSON.stringify(item)
      );
      const data = await batchService.updateBatch(profile.batchId, {
        attendanceHolidays: stringifyData,
      });
      setAttendanceHolidays(
        data.attendanceHolidays.map((item) => JSON.parse(item))
      );
      toast.success("Holidays saved successfully");
    } catch (error) {
      console.error("Error submitting holidays:", error);
      toast.error("Failed to save holidays. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;

    const formattedDate = format(date, "yyyy-MM-dd");
    const holiday = attendanceHolidays.find(
      (holiday) => holiday.date === formattedDate
    );

    return (
      <div
        onDoubleClick={() => openModal(formattedDate)}
        className="w-full h-full min-h-[60px] p-1  cursor-pointer"
      >
        {holiday && (
          <div className="bg-red-100 p-1 rounded text-xs text-red-800 break-words">
            {holiday.holidayText}
          </div>
        )}
      </div>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const formattedDate = format(date, "yyyy-MM-dd");
    const holiday = attendanceHolidays.find(
      (holiday) => holiday.date === formattedDate
    );

    return `relative ${holiday ? "holiday-tile" : null}`;
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Mark Holidays</h1>
        <button
          onClick={handleSubmit}
          disabled={isLoading || isSubmitting}
          className="w-full sm:w-auto px-6 py-2 bg-blue-500 text-white rounded-md shadow-sm
            hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Saving...
            </span>
          ) : (
            "Save Holidays"
          )}
        </button>
      </div>

      <CustomCalendar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        enableNextTiles={true}
        tileContent={tileContent}
        tileClassName={tileClassName}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    {modalData.holidayText ? "Edit Holiday" : "Add Holiday"}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-full p-1 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="holidayText"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Holiday Description
                  </label>
                  <input
                    value={modalData.holidayText}
                    onChange={(e) =>
                      setModalData((prev) => ({
                        ...prev,
                        holidayText: e.target.value,
                        isHoliday: true,
                        date: format(selectedDate, "yyyy-MM-dd"),
                      }))
                    }
                    type="text"
                    id="holidayText"
                    placeholder="Enter holiday description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                      placeholder:text-gray-400 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm 
                      font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 
                      hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {modalData.holidayText && (
                    <button
                      onClick={removeModalData}
                      className="inline-flex justify-center rounded-md bg-red-600 px-3 py-2 
                        text-sm font-semibold text-white shadow-sm hover:bg-red-700 
                        focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Remove Holiday
                    </button>
                  )}
                  <button
                    onClick={saveModalData}
                    className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 
                      text-sm font-semibold text-white shadow-sm hover:bg-blue-700 
                      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {modalData.holidayText ? "Update" : "Add"} Holiday
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkHolidays;
