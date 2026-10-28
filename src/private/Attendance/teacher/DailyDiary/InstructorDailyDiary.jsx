import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parse, isBefore, isAfter } from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

import { useGetBatchQuery } from "@/store/api/batchApi";
import { selectProfile } from "@/store/profileSlice";
import { newAttendanceService } from "@/services/attendance/newAttendanceService";
import { highlightAbsentRow } from "../../DailyDiary/diaryAbsentHighlight";
import { Query } from "appwrite";

import holidayService from "@/services/attendance/holidaysService";
import dailyDiaryService from "@/services/attendance/dailyDiaryService";
import collegeService from "@/services/batch/collageService";
import tradeservice from "@/services/batch/tradedetails";
import Loader from "@/components/components/Loader";
import DiaryHeader from "./DiaryHeader";
import DiaryTable from "./DiaryTable";
import { parseISO } from "date-fns";
import DailyDiaryPrintTemplate from "./DailyDiaryPrintTemplate";
import PrintConfigModal, { DEFAULT_PRINT_CONFIG } from "./PrintConfigModal";
import DailyBatchAttendanceModal from "../AttendanceRegister/components/DailyBatchAttendanceModal";
import { useDailyDiaryActions } from "../../DailyDiary/hooks/useDailyDiaryActions";
import { useDailyDiaryQueryParams } from "../../DailyDiary/hooks/useDailyDiaryQueryParams";

function InstructorDailyDiary() {
  const { currentMonth, setCurrentMonth } = useDailyDiaryQueryParams();
  const [diaryData, setDiaryData] = useState({});
  const [attendance, setAttendance] = useState(new Map());
  const [attendanceDocIds, setAttendanceDocIds] = useState(new Map());
  const [holidays, setHolidays] = useState(new Map());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [collegeName, setCollegeName] = useState("INDUSTRIAL TRAINING INSTITUTE");
  const [tradeName, setTradeName] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({ ...DEFAULT_PRINT_CONFIG });

  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector((state) => state.activeBatch.activeBatchId);
  const printRef = useRef();

  const handleTeacherAttendanceUpdate = useCallback((dateStr, newStatus) => {
    setAttendance((prev) => new Map(prev).set(dateStr, newStatus));
  }, []);

  const handleUpdateAttendanceDocId = useCallback((dateStr, docId) => {
    setAttendanceDocIds((prev) => new Map(prev).set(dateStr, docId));
  }, []);

  const {
    data: batchData,
    isLoading: isBatchLoading,
    isError,
  } = useGetBatchQuery({ batchId: activeBatchId }, { skip: !activeBatchId });

  // Clamp currentMonth so it can never be before the batch start month
  useEffect(() => {
    if (!batchData?.start_date) return;
    const rawStart = typeof batchData.start_date === "string" ? batchData.start_date.split("T")[0] : format(batchData.start_date, "yyyy-MM-dd");
    const [by, bm] = rawStart.split("-").map(Number);
    const minMonth = new Date(by, bm - 1, 1);
    if (isBefore(currentMonth, minMonth)) {
      setCurrentMonth(minMonth);
    }
  }, [batchData?.start_date, currentMonth, setCurrentMonth]);

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    let effectiveStart = monthStart;
    let effectiveEnd = monthEnd;

    if (batchData?.start_date) {
      const rawStart = typeof batchData.start_date === "string" ? batchData.start_date.split("T")[0] : format(batchData.start_date, "yyyy-MM-dd");
      const [by, bm, bd] = rawStart.split("-").map(Number);
      const batchStartDateObj = new Date(by, bm - 1, bd);

      // If selected month ends before the batch starts, no days in this month
      if (isBefore(monthEnd, batchStartDateObj)) {
        return [];
      }

      // If batch starts within this month, start from the batch start date!
      if (isAfter(batchStartDateObj, monthStart)) {
        effectiveStart = batchStartDateObj;
      }
    }

    if (batchData?.end_date) {
      const rawEnd = typeof batchData.end_date === "string" ? batchData.end_date.split("T")[0] : format(batchData.end_date, "yyyy-MM-dd");
      const [ey, em, ed] = rawEnd.split("-").map(Number);
      const batchEndDateObj = new Date(ey, em - 1, ed, 23, 59, 59);

      // If selected month starts after the batch ends, no days in this month
      if (isAfter(monthStart, batchEndDateObj)) {
        return [];
      }

      // If batch ends within this month, end at the batch end date
      if (isBefore(batchEndDateObj, monthEnd)) {
        effectiveEnd = new Date(ey, em - 1, ed);
      }
    }

    if (isAfter(effectiveStart, effectiveEnd)) {
      return [];
    }

    return eachDayOfInterval({
      start: effectiveStart,
      end: effectiveEnd,
    });
  }, [currentMonth, batchData?.start_date, batchData?.end_date]);

  // Fetch dynamic names once (cached by collegeId & tradeId key)
  const fetchedNamesKeyRef = useRef("");
  useEffect(() => {
    const cId = profile?.collegeId || batchData?.collegeId;
    const tId = profile?.tradeId || batchData?.tradeId;
    const key = `${cId || ""}_${tId || ""}`;

    if ((!cId && !tId) || fetchedNamesKeyRef.current === key) return;
    fetchedNamesKeyRef.current = key;

    Promise.all([
      cId ? collegeService.getCollege(cId).catch(() => null) : Promise.resolve(null),
      tId ? tradeservice.getTrade(tId).catch(() => null) : Promise.resolve(null),
    ]).then(([colRes, tradeRes]) => {
      if (colRes?.collageName) setCollegeName(colRes.collageName.toUpperCase());
      if (tradeRes?.tradeName) setTradeName(tradeRes.tradeName.toUpperCase());
    });
  }, [profile?.collegeId, profile?.tradeId, batchData?.collegeId, batchData?.tradeId]);

  const fetchDataForMonth = useCallback(
    async (showLoading = true) => {
      if (!profile?.userId || !activeBatchId) return;

      if (showLoading) {
        setIsLoadingData(true);
      }
      try {
        const startDate = monthDays.length > 0 ? format(monthDays[0], "yyyy-MM-dd") : format(startOfMonth(currentMonth), "yyyy-MM-dd");
        const endDate = monthDays.length > 0 ? format(monthDays[monthDays.length - 1], "yyyy-MM-dd") : format(endOfMonth(currentMonth), "yyyy-MM-dd");

        // Parallelize month attendance, holidays, and diary entries using Promise.all
        const [attendanceRes, holidayData, diaryRes] = await Promise.all([
          newAttendanceService.getTeacherAttendanceByDateRange(
            profile.userId,
            activeBatchId,
            startDate,
            endDate,
            [Query.select(["$id", "date", "status", "attendanceStatus", "leaveType"])]
          ),
          holidayService.getBatchHolidaysByDateRange(
            activeBatchId,
            startDate,
            endDate
          ),
          dailyDiaryService.getBatchInstructorDiary(
            activeBatchId,
            profile.userId,
            startDate,
            endDate
          ),
        ]);

        const attendanceMap = new Map();
        const docIdsMap = new Map();
        if (attendanceRes?.documents) {
          attendanceRes.documents.forEach((item) => {
            const rawStatus = item.leaveType
              ? item.leaveType.toLowerCase()
              : item.attendanceStatus
              ? item.attendanceStatus.toLowerCase()
              : item.status;
            attendanceMap.set(item.date, rawStatus);
            if (item.$id) docIdsMap.set(item.date, item.$id);
          });
        }
        setAttendance(attendanceMap);
        setAttendanceDocIds(docIdsMap);

        const holidayMap = new Map();
        if (holidayData) {
          holidayData.forEach((item) => holidayMap.set(item.date, item));
        }
        setHolidays(holidayMap);

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
        console.error("Error fetching data for month:", error);
        toast.error("Failed to load monthly diary data");
      } finally {
        if (showLoading) {
          setIsLoadingData(false);
        }
      }
    },
    [profile?.userId, activeBatchId, currentMonth, monthDays]
  );

  useEffect(() => {
    fetchDataForMonth();
  }, [fetchDataForMonth]);

  const handleUpdateEntry = useCallback((dateKey, updatedDoc) => {
    setDiaryData((prev) => ({
      ...prev,
      [dateKey]: updatedDoc,
    }));
  }, []);

  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Daily_Diary_${format(currentMonth, "MMM_yyyy")}`,
  });

  // Opens the column-selector modal; actual print fires after user confirms
  const handlePrint = () => setIsPrintModalOpen(true);

  const handleConfiguredPrint = (config) => {
    setPrintConfig(config);
    // Allow React to re-render the template with new config before printing
    setTimeout(() => triggerPrint(), 80);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
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

        const isTeacherPresent = attendance.get(dateKey) === "present";
        if (isHoliday && !isTeacherPresent && !entry.theoryWork) {
          theory = "Holiday: " + (holidays.get(dateKey)?.holidayText || "");
          remarks = "Holiday";
          practical = "";
          practicalNo = "";
          extraWork = "";
          hours = "";
        } else if (isAbsent && !isHoliday) {
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

  const {
    isModalOpen,
    modalDate,
    modalMode,
    students,
    existingAttendance,
    actionLoadingDates,
    openAttendanceModal,
    closeAttendanceModal,
    handleSaveAttendance,
    handleAddHoliday,
    handleRemoveHoliday,
    handleClearDayAttendance,
    handleSetTeacherAttendance,
    handleDeleteTeacherAttendance,
  } = useDailyDiaryActions({
    onRefreshData: fetchDataForMonth,
    batchData,
    attendance,
    attendanceDocIds,
    onTeacherAttendanceUpdate: handleTeacherAttendanceUpdate,
    updateAttendanceDocId: handleUpdateAttendanceDocId,
  });

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
      <PrintConfigModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onPrint={handleConfiguredPrint}
      />
      <DailyBatchAttendanceModal
        isOpen={isModalOpen}
        onClose={closeAttendanceModal}
        students={students}
        date={modalDate}
        batchId={activeBatchId}
        onSave={handleSaveAttendance}
        existingAttendance={existingAttendance}
        holidays={holidays}
        handleAddHoliday={handleAddHoliday}
        handleRemoveHoliday={(d) => handleRemoveHoliday(d, holidays)}
        handleClearDayAttendance={handleClearDayAttendance}
        initialMode={modalMode}
      />
      <DiaryHeader
        selectedMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onExport={handleExport}
        onPrint={handlePrint}
        isExporting={isExporting}
        onRefresh={fetchDataForMonth}
        batchStartDate={batchData?.start_date}
        batchEndDate={batchData?.end_date}
      />
      <DiaryTable
        monthDays={monthDays}
        diaryData={diaryData}
        holidays={holidays}
        attendance={attendance}
        isLoadingData={isLoadingData}
        actionLoadingDates={actionLoadingDates}
        batchStartDate={batchData?.start_date}
        onUpdateEntry={handleUpdateEntry}
        onOpenAttendanceModal={openAttendanceModal}
        onSetTeacherAttendance={handleSetTeacherAttendance}
        onDeleteTeacherAttendance={handleDeleteTeacherAttendance}
        onRemoveHoliday={(dateKey) => handleRemoveHoliday(dateKey, holidays)}
      />
      <DailyDiaryPrintTemplate
        ref={printRef}
        monthDays={monthDays}
        diaryData={diaryData}
        holidays={holidays}
        attendance={attendance}
        profile={profile}
        batchData={batchData}
        currentMonth={currentMonth}
        collegeName={collegeName}
        tradeName={tradeName}
        printConfig={printConfig}
      />
    </div>
  );
}

export default InstructorDailyDiary;

