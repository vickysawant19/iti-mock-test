import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { useReactToPrint } from "react-to-print";

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
import DailyDiaryPrintTemplate from "./DailyDiaryPrintTemplate";
import PrintConfigModal, { DEFAULT_PRINT_CONFIG } from "./PrintConfigModal";
import MarkAttendanceModal from "@/private/Attendance/AttendanceRegister/components/MarkAttendanceModal";
import { useDailyDiaryActions } from "./hooks/useDailyDiaryActions";

function InstructorDailyDiary() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  const monthDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

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
        const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
        const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

        // Parallelize month attendance, holidays, and diary entries using Promise.all
        const [attendanceRes, holidayData, diaryRes] = await Promise.all([
          newAttendanceService.getTeacherAttendanceByDateRange(
            profile.userId,
            activeBatchId,
            startDate,
            endDate,
            [Query.select(["$id", "date", "status"])]
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
            attendanceMap.set(item.date, item.status);
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
    [profile?.userId, activeBatchId, currentMonth]
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
    handleSetTeacherAttendance,
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
      <MarkAttendanceModal
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

