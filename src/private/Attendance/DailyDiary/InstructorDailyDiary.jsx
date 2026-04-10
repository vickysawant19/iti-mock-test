import React, { useEffect, useMemo, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";

import { useGetBatchQuery } from "@/store/api/batchApi";
import { selectProfile } from "@/store/profileSlice";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import { highlightAbsentRow } from "./diaryAbsentHighlight";
import { Query } from "appwrite";

import holidayService from "@/appwrite/holidaysService";
import dailyDiaryService from "@/appwrite/dailyDiaryService";
import collegeService from "@/appwrite/collageService";
import tradeservice from "@/appwrite/tradedetails";
import Loader from "@/components/components/Loader";
import DiaryHeader from "./DiaryHeader";
import DiaryTable from "./DiaryTable";
import { parseISO } from "date-fns";

function InstructorDailyDiary() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [diaryData, setDiaryData] = useState({});
  const [attendance, setAttendance] = useState(new Map());
  const [holidays, setHolidays] = useState(new Map());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const profile = useSelector(selectProfile);

  const {
    data: batchData,
    isLoading: isBatchLoading,
    isError,
  } = useGetBatchQuery({ batchId: profile.batchId });

  const monthDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  const fetchDataForMonth = useCallback(async () => {
    if (!profile?.userId || !profile?.batchId) return;

    setIsLoadingData(true);
    try {
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const attendanceRes =
        await newAttendanceService.getTeacherAttendanceByDateRange(
          profile.userId,
          profile.batchId,
          startDate,
          endDate,
          [Query.select(["date", "status"])],
        );
      const attendanceMap = new Map();
      attendanceRes.documents.forEach((item) =>
        attendanceMap.set(item.date, item.status),
      );
      setAttendance(attendanceMap);

      // Fetch holidays
      const holidayData = await holidayService.getBatchHolidaysByDateRange(
        profile.batchId,
        startDate,
        endDate,
      );
      const holidayMap = new Map();
      holidayData.forEach((item) => holidayMap.set(item.date, item));
      setHolidays(holidayMap);
      // Fetch daily diary
      const diaryRes = await dailyDiaryService.getBatchInstructorDiary(
        profile.batchId,
        profile.userId,
        startDate,
        endDate,
      );

      const ownDiary =
        diaryRes?.filter((doc) => doc.instructorId === profile.userId) || [];

      const formattedDiary = {};
      if (ownDiary.length > 0) {
        ownDiary.forEach((doc) => {
          const dateKey = format(parseISO(doc.date), "yyyy-MM-dd");
          formattedDiary[dateKey] = doc;
        });
      }
      setDiaryData(formattedDiary);
    } catch (error) {
      console.error("Error fetching month data:", error);
      toast.error("Failed to load monthly data");
    } finally {
      setIsLoadingData(false);
    }
  }, [profile, currentMonth]);

  useEffect(() => {
    fetchDataForMonth();
  }, [fetchDataForMonth]);

  // Removed the useEffect that watched batchData.dailyDairy
  // as we now fetch it in fetchDataForMonth

  const handleUpdateEntry = useCallback((dateKey, updatedDoc) => {
    setDiaryData((prev) => ({
      ...prev,
      [dateKey]: updatedDoc,
    }));
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch dynamic names
      let collegeName = "INDUSTRIAL TRAINING INSTITUTE";
      let tradeName = "";

      const cId = profile?.collegeId || batchData?.collegeId;
      if (cId) {
        try {
          const colRes = await collegeService.getCollege(cId);
          if (colRes?.collageName)
            collegeName = colRes.collageName.toUpperCase();
        } catch (e) {
          console.error("Error fetching college name:", e);
        }
      }

      const tId = profile?.tradeId || batchData?.tradeId;
      if (tId) {
        try {
          const tradeRes = await tradeservice.getTrade(tId);
          if (tradeRes?.tradeName) tradeName = tradeRes.tradeName.toUpperCase();
        } catch (e) {
          console.error("Error fetching trade name:", e);
        }
      }

      // Prepare data for Excel
      const exportData = monthDays.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const entry = diaryData[dateKey] || {};
        const isHoliday = holidays.has(dateKey);
        const isAbsent = highlightAbsentRow(attendance.get(dateKey));
        const dayOfWeek = format(day, "EEEE");

        let theory = entry.theoryWork || "";
        let practical = entry.practicalWork || "";
        let practicalNo = entry.practicalNumbers
          ? entry.practicalNumbers.join(", ")
          : "";
        let extraWork = entry.extraWork || "";
        let hours = entry.hours || "";
        let remarks = entry.remarks || "";

        if (isHoliday) {
          theory = "Holiday: " + (holidays.get(dateKey)?.holidayText || "");
          remarks = "Holiday";
        } else if (isAbsent) {
          theory = "Absent";
          remarks = "Absent";
        }

        return {
          Date: format(day, "dd-MMM-yyyy"),
          Day: dayOfWeek,
          Theory: theory,
          Practical: practical,
          "Practical No.": practicalNo,
          "Extra Work": extraWork,
          Hours: hours,
          Remarks: remarks,
          "Instructor Name": profile.userName || "",
          "Instructor Sign": "",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData, { origin: "A6" });

      // Add Headers
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [collegeName],
          [`Trade: ${tradeName || "N/A"}`],
          [`Month: ${format(currentMonth, "MMMM-yyyy")}`],
          [
            `Instructor: ${profile?.userName?.toUpperCase() || ""}`,
            "",
            "",
            "",
            `Batch: ${batchData?.BatchName || ""}`,
          ],
        ],
        { origin: "A1" },
      );

      // Merge header rows for clean centering/formatting
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Merge institute title across all columns
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Merge Trade subtitle across
        { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }, // Merge month subtitle across
      ];

      // Add Footers (Signatures)
      const footerRow = 6 + exportData.length + 4; // Table header + data + spacing lines
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            "Group Instructor Sign",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "Principal Sign",
          ],
        ],
        { origin: `A${footerRow}` },
      );

      // Auto-size columns to be wider
      const wscols = [
        { wch: 15 }, // Date
        { wch: 12 }, // Day
        { wch: 30 }, // Theory
        { wch: 30 }, // Practical
        { wch: 15 }, // Practical No.
        { wch: 20 }, // Extra Work
        { wch: 8 }, // Hours
        { wch: 20 }, // Remarks
        { wch: 25 }, // Instructor Name
        { wch: 20 }, // Instructor Sign
      ];
      worksheet["!cols"] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Diary");

      const fileName = `DailyDiary_${format(currentMonth, "MMM_yyyy")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Excel exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    } finally {
      setIsExporting(false);
    }
  };

  if (isBatchLoading) {
    return <Loader isLoading={isBatchLoading} />;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 my-8 flex items-center justify-center p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900">
        Failed to load batch data.
      </div>
    );
  }

  return (
    <div className="w-full h-full animate-in fade-in duration-500">
      <DiaryHeader
        selectedMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onExport={handleExport}
        isExporting={isExporting}
        onRefresh={fetchDataForMonth}
        batchStartDate={batchData?.start_date}
      />
      <DiaryTable
        monthDays={monthDays}
        diaryData={diaryData}
        holidays={holidays}
        attendance={attendance}
        isLoadingData={isLoadingData}
        onUpdateEntry={handleUpdateEntry}
      />
    </div>
  );
}

export default InstructorDailyDiary;
