import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSelector } from "react-redux";
import batchService from "@/appwrite/batchService";
import batchStudentService from "@/appwrite/batchStudentService";
import { Query } from "appwrite";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import { selectActiveBatchId } from "@/store/activeBatchSlice";
import userProfileService from "@/appwrite/userProfileService";
import AttendanceHeader from "./components/AttendanceHeader";
import AttendanceTable from "./components/AttendanceTable";
import LoadingSpinner from "./components/LoadingSpinner";
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";
import {
  format,
  getDaysInMonth,
  addMonths,
  subMonths,
  endOfMonth,
} from "date-fns";
import DailyBatchAttendanceModal from "./components/DailyBatchAttendanceModal";
import StudentMonthlyAttendanceModal from "./components/StudentMonthlyAttendanceModal";
import StudentManagementModal from "@/private/teacher/batch/view-batch/tabs/profiles/components/StudentManagementModal";
import StatsDiscrepancyModal from "./components/StatsDiscrepancyModal";
import { AlertTriangle } from "lucide-react";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";
import { attendanceTrackingService } from "@/services/attendanceTrackingService";

import { useAttendanceRealtime } from "./hooks/useAttendanceRealtime";
import { toast } from "react-toastify";
import { DEFAULT_VISIBILITY } from "./components/ColumnGroupConfig";


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a local-midnight Date from a "yyyy-MM-dd" or ISO string. */
const toLocalDate = (iso) => {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/** Return the first-of-month local Date for any date value. */
const toMonthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Stable cache key for batch+month combinations. */
const cacheKey = (batchId, month) =>
  `${batchId}-${month.getFullYear()}-${month.getMonth()}`;

// ─────────────────────────────────────────────────────────────────────────────
// Initial loading state
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_LOADING = {
  initial: true,
  students: false,
  attendance: false,
  stats: false,
  holiday: false, // FIX: was missing — caused string-key bug in original code
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const AttendanceRegister = () => {
  const profile = useSelector(selectProfile);
  const user    = useSelector(selectUser);
  const activeBatchId = useSelector(selectActiveBatchId);

  // ── Refs ────────────────────────────────────────────────────────────────
  // FIX: Don't reset in cleanup — that caused double-fetch in React StrictMode.
  const batchFetchedRef        = useRef(false);
  const abortControllerRef     = useRef(null);
  // FIX: Store cache keys in a single ref object to avoid stale-closure issues.
  const fetchCacheRef          = useRef({ attendance: null, stats: null });

  // ── Core state ───────────────────────────────────────────────────────────
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_VISIBILITY);
  const [batches,          setBatches]          = useState(new Map());
  const [selectedBatch,    setSelectedBatch]    = useState("");
  const [students,         setStudents]         = useState(null);
  const [selectedMonth,    setSelectedMonth]    = useState(new Date());
  const [holidays,         setHolidays]         = useState(new Map());
  const [newAttendance,    setNewAttendance]    = useState([]);
  const [studentStatsMap,  setStudentStatsMap]  = useState(new Map());
  const [currentMonthlyStatsMap, setCurrentMonthlyStatsMap] = useState(new Map());
  const [loading,          setLoading]          = useState(INITIAL_LOADING);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [isModalOpen,          setIsModalOpen]          = useState(false);
  const [selectedDate,         setSelectedDate]         = useState(null);
  const [selectedStudent,      setSelectedStudent]      = useState(null);
  const [updatingAttendance,   setUpdatingAttendance]   = useState(new Map());

  // ── Student Profile Modal State ──────────────────────────────────────────
  const [viewProfileUserId,    setViewProfileUserId]    = useState(null);
  const [profileTab,           setProfileTab]           = useState("profile");
  const [selectedProfileStudent, setSelectedProfileStudent] = useState(null);

  // ── Stats Discrepancy Modal State ────────────────────────────────────────
  const [discrepancyData, setDiscrepancyData] = useState({ hasDiscrepancies: false, mismatches: [] });
  const [isFixModalOpen,  setIsFixModalOpen]  = useState(false);
  const [isVerifyingStats, setIsVerifyingStats] = useState(false);

  const handleManualVerifyStats = useCallback(async () => {
    if (!selectedBatch || !students?.length) return;
    setIsVerifyingStats(true);
    try {
      const yearMonthStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;
      const res = await newAttendanceService.verifyBatchMonthlyStats(selectedBatch, yearMonthStr, students);
      if (!res?.hasDiscrepancies) {
        setDiscrepancyData({ hasDiscrepancies: false, mismatches: [] });
        toast.success("✅ All monthly attendance stats are verified and match daily records!");
      } else {
        setDiscrepancyData(res);
        setIsFixModalOpen(true);
      }
    } catch (error) {
      console.error("Error verifying stats:", error);
      toast.error("Failed to verify monthly stats.");
    } finally {
      setIsVerifyingStats(false);
    }
  }, [selectedBatch, selectedMonth, students]);



  const handleOpenStudentProfile = useCallback((student) => {
    if (!student || student.isTeacher) return;
    setSelectedProfileStudent(student);
    setViewProfileUserId(student.userId);
    setProfileTab("profile");
  }, []);

  // ── Realtime sync ────────────────────────────────────────────────────────
  useAttendanceRealtime(selectedBatch, selectedMonth, setNewAttendance);

  // ── Loading helper ───────────────────────────────────────────────────────
  // FIX: Accepts a string key; original code called setLoading("holiday", true)
  //      which passed a string to the reducer instead of calling updateLoading.
  const updateLoading = useCallback((key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Derived: attendance map (userId → dateStr → status) ─────────────────
  const newAttendanceMap = useMemo(() => {
    const map = new Map();
    (newAttendance || []).forEach((att) => {
      let inner = map.get(att.userId);
      if (!inner) {
        inner = new Map();
        map.set(att.userId, inner);
      }
      let rawStatus = att.attendanceStatus ? att.attendanceStatus.toLowerCase() : (att.status || "");
      if (rawStatus === "leave") {
        const lt = String(att.leaveType || "").toLowerCase();
        rawStatus = lt ? (lt === "casual" ? "casual" : lt === "sick" ? "sick" : lt === "special" ? "special" : lt === "on_duty" ? "on_duty" : "casual") : "casual";
      }
      inner.set(att.date, rawStatus);
    });
    return map;
  }, [newAttendance]);

  // ── Derived: stable batch dates ──────────────────────────────────────────
  const { batchStartDate, rawBatchStartDate, batchEndDate, rawBatchEndDate } = useMemo(() => {
    const data = batches.get(selectedBatch);
    if (!data?.start_date) return { batchStartDate: null, rawBatchStartDate: null, batchEndDate: null, rawBatchEndDate: null };
    const rawStart = toLocalDate(data.start_date);
    const rawEnd   = data.end_date ? toLocalDate(data.end_date) : null;

    return {
      batchStartDate:    toMonthStart(rawStart), // first-of-month, used for nav clamping
      rawBatchStartDate: rawStart,               // exact day, used for column filtering
      batchEndDate:      rawEnd ? toMonthStart(rawEnd) : null,
      rawBatchEndDate:   rawEnd,                 // exact day
    };
  }, [batches, selectedBatch]);

  // ── Check whether a student row has a pending update ────────────────────
  const isStudentUpdating = useCallback(
    (studentId) => {
      for (const key of updatingAttendance.keys()) {
        if (key.startsWith(`${studentId}-`)) return true;
      }
      return false;
    },
    [updatingAttendance],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: batches (once per mount)
  // ─────────────────────────────────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    if (!profile?.userId || batchFetchedRef.current) return;
    batchFetchedRef.current = true; // guard before await to prevent race

    try {
      const response = await batchService.listBatches([
        Query.equal("teacherId", profile.userId),
        Query.equal("isActive", true),
        Query.select(["$id", "BatchName", "start_date", "end_date", "tradeId"]),
      ]);

      const newMap = new Map();
      response.documents.forEach((batch) => newMap.set(batch.$id, batch));
      setBatches(newMap);

      // Auto-select: prefer the globally active batch, fall back to last in list
      if (response.documents.length > 0) {
        const preferredId =
          activeBatchId && newMap.has(activeBatchId)
            ? activeBatchId
            : response.documents[response.documents.length - 1].$id;
        setSelectedBatch(preferredId);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      batchFetchedRef.current = false; // allow retry on error
    } finally {
      updateLoading("initial", false);
    }
  }, [profile?.userId, activeBatchId, updateLoading]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: students + holidays (runs when selectedBatch changes)
  // ─────────────────────────────────────────────────────────────────────────
  const fetchStudentsAndHolidays = useCallback(async () => {
    if (!selectedBatch || !batches.has(selectedBatch)) return;

    // Cancel any in-flight request from a previous batch selection
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    // Reset per-batch state
    setStudents(null);
    setHolidays(new Map());
    setNewAttendance([]);        // use empty array, not null, for safer downstream code
    setStudentStatsMap(new Map());
    setUpdatingAttendance(new Map());
    fetchCacheRef.current = { attendance: null, stats: null }; // invalidate cache

    updateLoading("students", true);
    updateLoading("holiday", true);

    try {
      const [holidaysData, studentsData] = await Promise.all([
        holidayService.getBatchHolidays(selectedBatch).catch((err) => {
          console.error("Error fetching holidays:", err);
          return [];
        }),
        (async () => {
          const batchStudents = await batchStudentService.getBatchStudents(selectedBatch);
          const userIds = batchStudents.map((doc) => doc.studentId).filter(Boolean);
          if (userIds.length === 0) return [];
          const profilesMap = await userProfileService.getProfilesByUserIds(userIds);

          const batchStudentMap = new Map();
          batchStudents.forEach((bs) => {
            if (bs.studentId) batchStudentMap.set(bs.studentId, bs);
          });

          return userIds
            .map((uid) => {
              const p = profilesMap.get(uid);
              const bs = batchStudentMap.get(uid);
              if (!p && !bs) return null;

              const rollNo =
                bs?.rollNumber ||
                bs?.registerId ||
                p?.rollNumber ||
                p?.registerId ||
                p?.rollNo ||
                "N/A";

              return {
                userId: uid,
                userName: p?.userName || p?.name || "Student",
                studentId: rollNo,
                rollNo: rollNo,
                rollNumber: bs?.rollNumber || p?.rollNumber || rollNo,
                registerId: bs?.registerId || p?.registerId || null,
                profileImage: p?.profileImage || "",
                // Per-student enrollment date: used to compute working days for the enrollment month
                enrollmentDate: bs?.enrollmentDate || bs?.joinedAt || null,
              };
            })
            .filter(Boolean);

        })(),
      ]);

      if (signal.aborted) return;

      const holidayMap = new Map();
      holidaysData.forEach((h) => holidayMap.set(h.date, h));
      setHolidays(holidayMap);

      console.log("[AttendanceRegister] Raw batchStudents & profiles joined:", studentsData);

      const sortedStudentsData = [...studentsData].sort((a, b) => {
        const rollA = String(a.studentId || a.rollNo || "").trim();
        const rollB = String(b.studentId || b.rollNo || "").trim();
        if (!rollA && !rollB) {
          return String(a.userName || "").localeCompare(String(b.userName || ""));
        }
        if (!rollA) return 1;
        if (!rollB) return -1;
        return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: "base" });
      });

      console.log(
        "[AttendanceRegister] Sorted students by rollNumber:",
        sortedStudentsData.map((s) => ({ name: s.userName, rollNumber: s.studentId })),
      );

      let finalStudents = sortedStudentsData;
      if (profile?.userId) {
        finalStudents = [
          {
            $id: profile.$id || profile.userId,
            userId: profile.userId,
            userName: `${profile.userName || profile.name || "Instructor"} - Teacher`,
            studentId: "Teacher",
            profileImage: profile.profileImage || "",
            isTeacher: true,
          },
          ...sortedStudentsData.filter((s) => s.userId !== profile.userId),
        ];
      }
      setStudents(finalStudents);
    } catch (error) {
      if (error.name !== "AbortError" && !signal.aborted) {
        console.error("Error fetching students and holidays:", error);
        setStudents([]);
      }
    } finally {
      if (!signal.aborted) {
        updateLoading("students", false);
        updateLoading("holiday", false);
      }
    }
  }, [selectedBatch, batches, updateLoading, profile]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: attendance + stats
  // FIX: cache keys are now read/written via a single ref (fetchCacheRef) so
  //      they are never stale inside useCallback closures.
  // FIX: stats are fetched via a single multi-student call instead of N serial
  //      calls (depends on newAttendanceService supporting it; falls back to
  //      parallel Promise.all to avoid the original serial pattern).
  // ─────────────────────────────────────────────────────────────────────────
  const fetchAttendanceAndStats = useCallback(
    async (signal) => {
      if (!selectedBatch || !students?.length) return;

      const batch = batches.get(selectedBatch);
      if (!batch?.start_date) return;

      const currentKey   = cacheKey(selectedBatch, selectedMonth);
      const needsAttendance =
        fetchCacheRef.current.attendance !== currentKey;
      const needsStats   =
        columnVisibility.previous &&
        fetchCacheRef.current.stats !== currentKey;

      if (!needsAttendance && !needsStats) return;

      try {
        if (needsAttendance) updateLoading("attendance", true);
        if (needsStats)      updateLoading("stats",      true);

        const studentIds = students.map((s) => s.userId);

        // ── Attendance & Current Month Pre-aggregated Stats ──────────────
        if (needsAttendance) {
          const yearMonthStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;
          const [result, currentStats] = await Promise.all([
            newAttendanceService.getMonthlyAttendance(
              studentIds,
              selectedBatch,
              selectedMonth.getFullYear(),
              selectedMonth.getMonth() + 1,
            ),
            newAttendanceService.getBatchMonthlyStats(selectedBatch, yearMonthStr),
          ]);

          if (signal?.aborted) return;
          setNewAttendance(result.documents);
          setCurrentMonthlyStatsMap(currentStats || new Map());
          fetchCacheRef.current.attendance = currentKey;
        }





        // ── Stats (previous months) ─────────────────────────────────────
        if (needsStats) {
          const rawStart = batch.start_date ? toLocalDate(batch.start_date) : null;
          const batchStartYear = rawStart ? rawStart.getFullYear() : null;
          const batchStartMonth = rawStart ? rawStart.getMonth() : null;

          const selYear = selectedMonth.getFullYear();
          const selMonth = selectedMonth.getMonth();

          // If selectedMonth is on or before the month the batch started, previous stats do not exist (all 0s)
          const isBeforeOrEqualBatchStartMonth =
            batchStartYear !== null &&
            (selYear < batchStartYear || (selYear === batchStartYear && selMonth <= batchStartMonth));

          if (isBeforeOrEqualBatchStartMonth) {
            setStudentStatsMap(new Map());
            fetchCacheRef.current.stats = currentKey;
          } else {
            const yearMonthStr = `${selYear}-${String(selMonth + 1).padStart(2, "0")}`;

            let statsMap = await newAttendanceService.getBatchCumulativeMonthlyStats(
              selectedBatch,
              yearMonthStr
            );

            if (!statsMap || statsMap.size === 0) {
              const endDate = endOfMonth(subMonths(selectedMonth, 1)).toISOString();
              statsMap = await newAttendanceService.getBatchCumulativeStudentStats(
                studentIds,
                selectedBatch,
                batch.start_date,
                endDate
              );
            }

            if (signal?.aborted) return;

            setStudentStatsMap(statsMap || new Map());
            fetchCacheRef.current.stats = currentKey;
          }
        }
      } catch (error) {
        if (!signal?.aborted) {
          console.error("Error fetching attendance and stats:", error);
          if (needsAttendance) setNewAttendance([]);
        }
      } finally {
        if (!signal?.aborted) {
          if (needsAttendance) updateLoading("attendance", false);
          if (needsStats)      updateLoading("stats",      false);
        }
      }
    },
    // FIX: columnVisibility.previous is the only visibility flag that
    //      matters here; avoids recreating the callback on unrelated
    //      column-toggle changes.
    [selectedBatch, students, selectedMonth, batches, updateLoading, columnVisibility.previous],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Action: toggle a single attendance cell
  // ─────────────────────────────────────────────────────────────────────────
  const onAttendanceStatusChange = useCallback(
    async (userId, date, newStatus) => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      if (date > todayStr) {
        toast.error("Cannot mark attendance for future dates");
        return;
      }

      const key = `${userId}-${date}`;
      setUpdatingAttendance((prev) => new Map(prev).set(key, true));

      try {
        const existingRecord = (newAttendance || []).find(
          (att) => att.userId === userId && att.date === date,
        );

        if (newStatus === "clear" || newStatus === "undo" || newStatus === "none" || !newStatus) {
          if (existingRecord) {
            await newAttendanceService.deleteAttendance(existingRecord.$id);
            setNewAttendance((prev) =>
              (prev || []).filter((att) => att.$id !== existingRecord.$id),
            );
            toast.success("Attendance cleared successfully");
          }
          return;
        }

        const payload = attendanceTrackingService.createAttendancePayload({
          userId,
          batchId: selectedBatch,
          tradeId: batches.get(selectedBatch)?.tradeId ?? null,
          date,
          status: newStatus,
        });

        const attendanceResponse = existingRecord
          ? await newAttendanceService.updateAttendance(existingRecord.$id, payload)
          : await newAttendanceService.createAttendance(payload);

        // Merge updated record into local state
        setNewAttendance((prev) => [
          ...(prev || []).filter((att) => att.$id !== attendanceResponse.$id),
          attendanceResponse,
        ]);
        fetchCacheRef.current.stats = null;
      } catch (error) {
        console.error("Error updating attendance:", error);
        toast.error("Failed to update attendance");
      } finally {
        setUpdatingAttendance((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [newAttendance, selectedBatch, batches, selectedMonth],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Action: bulk save from modal
  // ─────────────────────────────────────────────────────────────────────────
  const handleSaveAttendance = useCallback(
    async (statuses) => {
      try {
        const batch = batches.get(selectedBatch);
        const isHoliday = holidays.has(selectedDate);
        const dayType = isHoliday ? "HOLIDAY" : "WORKING";

        const records = Object.entries(statuses).map(([userId, statusVal]) => {
          const payload = attendanceTrackingService.createAttendancePayload({
            userId,
            batchId: selectedBatch,
            tradeId: batch?.tradeId ?? null,
            date: selectedDate,
            status: String(statusVal || "").toLowerCase(),
          });
          return {
            ...payload,
            dayType,
            isHoliday,
            source: "MANUAL",
          };
        });

        const response = await newAttendanceService.markBatchAttendance(
          selectedBatch,
          selectedDate,
          records,
        );

        setNewAttendance((prev) => {
          const successIds = new Set(response.success.map((r) => r.$id));
          return [
            ...(prev || []).filter((att) => !successIds.has(att.$id)),
            ...response.success,
          ];
        });

        // Invalidate stats cache so summary stats & previous month stats refresh
        fetchCacheRef.current.stats = null;
        setStudentStatsMap(new Map());
        await fetchAttendanceAndStats(new AbortController().signal);

        handleCloseModal();
      } catch (error) {
        console.error("Error saving attendance:", error);
        toast.error("Failed to save attendance");
      }
    },
    [batches, selectedBatch, selectedDate, fetchAttendanceAndStats],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Action: holiday management
  // FIX: was calling setLoading("holiday", true) — a string, not a valid
  //      dispatch — replaced with updateLoading("holiday", ...).
  // ─────────────────────────────────────────────────────────────────────────
  const handleRemoveHoliday = useCallback(
    async (date) => {
      updateLoading("holiday", true);
      try {
        const holiday = holidays.get(date);
        const hId = holiday?.$id || holiday?.id || null;
        await holidayService.removeHoliday(hId, selectedBatch, date);
        setHolidays((prev) => {
          const next = new Map(prev);
          next.delete(date);
          return next;
        });

        fetchCacheRef.current.stats = null;
        setStudentStatsMap(new Map());
        await fetchAttendanceAndStats(new AbortController().signal);

        toast.success("Holiday removed successfully");
      } catch (error) {
        console.error("Error removing holiday:", error);
        toast.error("Failed to remove holiday");
      } finally {
        updateLoading("holiday", false);
      }
    },
    [holidays, selectedBatch, fetchAttendanceAndStats, updateLoading],
  );

  const handleAddHoliday = useCallback(
    async (date, holidayText) => {
      updateLoading("holiday", true);
      try {
        const holidayRes = await holidayService.addHoliday({
          date,
          batchId: selectedBatch,
          holidayText,
        });

        // Filter out local attendance records for this date since backend cleared them
        setNewAttendance((prev) =>
          (prev || []).filter((att) => att.date !== date),
        );

        setHolidays((prev) => new Map(prev).set(date, holidayRes));

        fetchCacheRef.current.stats = null;
        setStudentStatsMap(new Map());
        await fetchAttendanceAndStats(new AbortController().signal);

        toast.success("Holiday added and attendance cleared successfully");
      } catch (error) {
        console.error("Add Holiday Error:", error);
        toast.error("Error adding holiday");
      } finally {
        updateLoading("holiday", false);
      }
    },
    [selectedBatch, fetchAttendanceAndStats, updateLoading],
  );

  const handleFetchSingleStudentStats = useCallback(
    async (userId) => {
      if (!selectedBatch || !batches.has(selectedBatch)) return;
      const batch = batches.get(selectedBatch);

      updateLoading("stats", true);
      try {
        const stats = await newAttendanceService.getStudentAttendanceStats(
          userId,
          selectedBatch,
          batch.start_date,
          endOfMonth(subMonths(selectedMonth, 1)).toISOString(),
        );
        setStudentStatsMap((prev) => new Map(prev).set(userId, stats));
      } catch (error) {
        console.error("Error fetching single student stats:", error);
        toast.error("Failed to fetch statistics");
      } finally {
        updateLoading("stats", false);
      }
    },
    [selectedBatch, batches, selectedMonth, updateLoading],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Modal helpers
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenModal         = useCallback((date)    => { setSelectedDate(date);    setIsModalOpen(true);  }, []);
  const handleCloseModal        = useCallback(()        => { setIsModalOpen(false);    setSelectedDate(null); }, []);
  const handleOpenStudentModal  = useCallback((student) => setSelectedStudent(student), []);
  const handleCloseStudentModal = useCallback(()        => setSelectedStudent(null),    []);

  // ─────────────────────────────────────────────────────────────────────────
  // Month navigation
  // ─────────────────────────────────────────────────────────────────────────
  const maxMonth = useMemo(() => {
    const today = toMonthStart(new Date());
    return batchEndDate || today;
  }, [batchEndDate]);

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const next = subMonths(prev, 1);
      if (batchStartDate && next < batchStartDate) return prev;
      return next;
    });
  }, [batchStartDate]);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const next = addMonths(prev, 1);
      return next > maxMonth ? prev : next;
    });
  }, [maxMonth]);

  const handleMonthChange = useCallback(
    (event) => {
      const [y, m] = event.target.value.split("-").map(Number);
      const next   = new Date(y, m - 1, 1);
      if (batchStartDate && next < batchStartDate) return;
      if (next > maxMonth) return;
      setSelectedMonth(next);
    },
    [batchStartDate, maxMonth],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Fetch batches once on mount
  useEffect(() => {
    if (profile?.userId) fetchBatches();
    // FIX: no cleanup that resets batchFetchedRef — that caused StrictMode
    //      double-fetch. Error path already resets the flag if needed.
  }, [profile?.userId, fetchBatches]);

  // 2. Clamp selectedMonth when batch (and its start date) changes
  useEffect(() => {
    if (!batchStartDate) return;
    setSelectedMonth((prev) => {
      if (prev < batchStartDate) return batchStartDate;
      if (prev > maxMonth)       return maxMonth;
      return prev;
    });
  }, [batchStartDate, maxMonth]);

  // 3. Fetch students + holidays when batch selection changes
  useEffect(() => {
    if (!selectedBatch) return;
    fetchStudentsAndHolidays();
    return () => abortControllerRef.current?.abort();
  }, [selectedBatch, fetchStudentsAndHolidays]);

  // 4. Fetch attendance + stats when students or month changes
  // FIX: use AbortSignal pattern instead of isMounted object.
  useEffect(() => {
    if (!students?.length) return;
    const controller = new AbortController();
    fetchAttendanceAndStats(controller.signal);
    return () => controller.abort();
  }, [students, selectedMonth, fetchAttendanceAndStats]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render guards
  // ─────────────────────────────────────────────────────────────────────────
  if (loading.initial) return <LoadingSpinner />;

  if (batches.size === 0) {
    const isTeacher =
      user?.labels?.includes("Teacher") || user?.labels?.includes("admin");
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 overflow-hidden flex items-center justify-center">
        <NoBatchTeacherView isTeacher={isTeacher} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-full mx-auto">
        <AttendanceHeader
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          batches={[...batches.values()]}
          selectedMonth={selectedMonth}
          handlePrevMonth={handlePrevMonth}
          handleNextMonth={handleNextMonth}
          handleMonthChange={handleMonthChange}
          formatDate={format}
          loading={loading}
          holidays={holidays}
          handleAddHoliday={handleAddHoliday}
          handleRemoveHoliday={handleRemoveHoliday}
          batchStartDate={batchStartDate}
          batchEndDate={batchEndDate}
          onVerifyStats={handleManualVerifyStats}
          isVerifyingStats={isVerifyingStats}
        />


        {/* Monthly Stats Discrepancy Banner */}
        {discrepancyData.hasDiscrepancies && (
          <div className="mx-4 mt-3 flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-3 rounded-2xl shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Found {discrepancyData.mismatches.length} student monthly stats discrepancy record(s) for this month.
              </span>
            </div>
            <button
              onClick={() => setIsFixModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              Review & Fix Stats
            </button>
          </div>
        )}

        <AttendanceTable
          students={students}
          selectedMonth={selectedMonth}
          holidays={holidays}
          attendanceMap={newAttendanceMap}
          currentMonthlyStatsMap={currentMonthlyStatsMap}
          calculatePreviousMonthsData={studentStatsMap}
          formatDate={format}
          getDaysInMonth={getDaysInMonth}
          onMarkAttendance={handleOpenModal}
          onAttendanceStatusChange={onAttendanceStatusChange}
          updatingAttendance={updatingAttendance}
          isStudentUpdating={isStudentUpdating}
          loading={loading}
          selectedBatch={selectedBatch}
          batchStartDate={rawBatchStartDate}
          batchEndDate={rawBatchEndDate}
          onOpenStudentAttendanceModal={handleOpenStudentModal}
          onOpenStudentProfile={handleOpenStudentProfile}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />

        <StudentMonthlyAttendanceModal
          isOpen={!!selectedStudent}
          onClose={handleCloseStudentModal}
          student={selectedStudent}
          selectedMonth={selectedMonth}
          attendanceMap={
            newAttendanceMap.get(selectedStudent?.userId) || new Map()
          }
          holidays={holidays}
          onAttendanceStatusChange={onAttendanceStatusChange}
          updatingAttendance={updatingAttendance}
          studentStats={studentStatsMap.get(selectedStudent?.userId)}
          onFetchStats={handleFetchSingleStudentStats}
          loadingStats={loading.stats}
          batchStartDate={rawBatchStartDate}
          batchEndDate={rawBatchEndDate}
          existingAttendance={newAttendance}
        />

        <DailyBatchAttendanceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          students={students}
          date={selectedDate}
          batchId={selectedBatch}
          onSave={handleSaveAttendance}
          existingAttendance={newAttendance}
          holidays={holidays}
          handleAddHoliday={handleAddHoliday}
          handleRemoveHoliday={handleRemoveHoliday}
        />

        <StudentManagementModal
          viewProfileUserId={viewProfileUserId}
          setViewProfileUserId={setViewProfileUserId}
          activeProfileTab={profileTab}
          setActiveProfileTab={setProfileTab}
          selectedStudent={selectedProfileStudent}
          effectiveBatchId={selectedBatch}
        />

        <StatsDiscrepancyModal
          isOpen={isFixModalOpen}
          onClose={() => setIsFixModalOpen(false)}
          batchId={selectedBatch}
          yearMonth={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`}
          mismatches={discrepancyData.mismatches}
          onFixed={async () => {
            setDiscrepancyData({ hasDiscrepancies: false, mismatches: [] });
            fetchCacheRef.current.stats = null;
            if (abortControllerRef.current) {
              await fetchAttendanceAndStats(abortControllerRef.current.signal);
            }
          }}
        />


      </div>
    </div>
  );
};

export default AttendanceRegister;