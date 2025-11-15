import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { X, Loader2, CalendarDays } from "lucide-react";
import CustomCalendar from "./Calender";
import { selectProfile } from "../../../../store/profileSlice";
import Loader from "@/components/components/Loader";
import holidayService from "@/appwrite/holidaysService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MarkHolidays = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceHolidays, setAttendanceHolidays] = useState(new Map());
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const profile = useSelector(selectProfile);

  const fetchBatchHolidays = async () => {
    setIsLoading(true);
    try {
      const data = await holidayService.getBatchHolidays(profile.batchId);
      const newMap = new Map();
      data.forEach((item) => newMap.set(item.date, item));
      setAttendanceHolidays(newMap);
    } catch (error) {
      console.error("Error fetching batch data:", error);
      toast.error("Failed to load holiday data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.batchId) {
      fetchBatchHolidays();
    }
  }, [profile?.batchId]);

  const openModal = (date) => {
    const existingData = attendanceHolidays.get(date);
    setModalData(
      existingData || {
        date,
        holidayText: "",
      }
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData({});
  };

  const saveModalData = async () => {
    if (!modalData.holidayText?.trim()) {
      toast.error("Please enter a holiday description");
      return;
    }

    setIsSaving(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const existingHoliday = attendanceHolidays.get(dateStr);

      if (existingHoliday) {
        const updatedHoliday = await holidayService.updateHoliday(
          existingHoliday.$id,
          {
            holidayText: modalData.holidayText.trim(),
          }
        );
        setAttendanceHolidays((prev) => {
          const updatedMap = new Map(prev);
          updatedMap.set(dateStr, updatedHoliday);
          return updatedMap;
        });
        toast.success("Holiday updated successfully!");
      } else {
        const newHoliday = await holidayService.addHoliday({
          batchId: profile.batchId,
          date: dateStr,
          holidayText: modalData.holidayText.trim(),
        });
        setAttendanceHolidays((prev) => {
          const updatedMap = new Map(prev);
          updatedMap.set(dateStr, newHoliday);
          return updatedMap;
        });
        toast.success("Holiday added successfully!");
      }
      closeModal();
    } catch (error) {
      console.error("Error saving holiday:", error);
      toast.error("Failed to save holiday. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeModalData = async () => {
    if (!modalData.$id) {
      toast.error("No holiday to remove");
      return;
    }

    setIsRemoving(true);
    try {
      await holidayService.removeHoliday(modalData.$id);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setAttendanceHolidays((prev) => {
        const updatedMap = new Map(prev);
        updatedMap.delete(dateStr);
        return updatedMap;
      });
      toast.success("Holiday removed successfully!");
      closeModal();
    } catch (error) {
      console.error("Error removing holiday:", error);
      toast.error("Failed to remove holiday. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;

    const formattedDate = format(date, "yyyy-MM-dd");
    const holiday = attendanceHolidays.get(formattedDate);

    return (
      <div
        onDoubleClick={() => openModal(formattedDate)}
        className="w-full h-full min-h-[60px] p-1 cursor-pointer"
      >
        {holiday && (
          <Badge
            variant="destructive"
            className="text-[10px] sm:text-xs w-full justify-center break-words whitespace-normal h-auto py-1"
          >
            {holiday.holidayText}
          </Badge>
        )}
      </div>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const formattedDate = format(date, "yyyy-MM-dd");
    const holiday = attendanceHolidays.has(formattedDate);

    return `relative ${holiday ? "holiday-tile" : ""}`;
  };

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto max-w-6xl space-y-4 sm:space-y-6">
        {/* Header Card */}
        <Card className="border-none shadow-sm rounded-none">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
                  Holiday Management
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Double-click on any date to add or edit holidays
                </CardDescription>
              </div>
              <Badge variant="outline" className="self-start sm:self-center">
                {attendanceHolidays.size}{" "}
                {attendanceHolidays.size === 1 ? "Holiday" : "Holidays"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar Card */}
        <Card className="border-none shadow-sm rounded-none">
          <CardContent className="p-0">
            <CustomCalendar
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              enableNextTiles={true}
              tileContent={tileContent}
              tileClassName={tileClassName}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modal using shadcn Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {modalData.$id ? "Edit Holiday" : "Add Holiday"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="holidayText" className="text-sm sm:text-base">
                Holiday Description
              </Label>
              <Input
                id="holidayText"
                value={modalData.holidayText || ""}
                onChange={(e) =>
                  setModalData((prev) => ({
                    ...prev,
                    holidayText: e.target.value,
                    date: format(selectedDate, "yyyy-MM-dd"),
                  }))
                }
                placeholder="e.g., National Holiday, Diwali"
                className="text-sm sm:text-base"
                disabled={isSaving || isRemoving}
                autoFocus
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSaving || isRemoving}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                {modalData.$id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={removeModalData}
                    disabled={isSaving || isRemoving}
                    className="w-full sm:w-auto"
                  >
                    {isRemoving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      "Remove Holiday"
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={saveModalData}
                  disabled={isSaving || isRemoving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{modalData.$id ? "Update" : "Add"} Holiday</>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarkHolidays;
