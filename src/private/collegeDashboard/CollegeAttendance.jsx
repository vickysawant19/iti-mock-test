import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import {
  selectUserBatches,
  selectActiveBatchData,
  selectActiveBatchId,
} from "@/store/activeBatchSlice";
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  GraduationCap,
  Search,
  Download,
  RefreshCw,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  Eye,
  Star,
  Building2,
  Layers,
  BookOpen,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { useListBatchesQuery } from "@/store/api/batchApi";
import { Query, Channel } from "appwrite";
import { appwriteService } from "@/services/core/appwriteClient";
import { newAttendanceService } from "@/services/attendance/newAttendanceService";
import batchStudentService from "@/services/batch/batchStudentService";
import userProfileService from "@/services/auth/userProfileService";
import batchService from "@/services/batch/batchService";
import conf from "@/config/config";
import { format, parseISO } from "date-fns";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

const CollegeAttendance = () => {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isAdmin = user?.labels?.includes("admin") || profile?.role?.includes("Admin");

  // Redux Active Batch Data for Teacher
  const activeBatchData = useSelector(selectActiveBatchData);
  const activeBatchId = useSelector(selectActiveBatchId);
  const userBatches = useSelector(selectUserBatches);

  // States
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [batchAttendanceMap, setBatchAttendanceMap] = useState(new Map());
  const [batchMembersMap, setBatchMembersMap] = useState(new Map());
  const [loadingStats, setLoadingStats] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and View States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTradeFilter, setSelectedTradeFilter] = useState("all");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'high' | 'moderate' | 'low' | 'unmarked'
  const [sortBy, setSortBy] = useState("percentage_desc");
  const [viewMode, setViewMode] = useState("matrix"); // 'matrix' | 'table'

  // Student Roster Inspection Modal State
  const [rosterModalBatch, setRosterModalBatch] = useState(null);
  const [rosterProfiles, setRosterProfiles] = useState(new Map());
  const [loadingRosterProfiles, setLoadingRosterProfiles] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterStatusTab, setRosterStatusTab] = useState("all"); // 'all' | 'present' | 'absent' | 'leave' | 'unmarked'

  // Refs for Realtime
  const currentBatchIds = useRef([]);
  const subscriptionRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  // Date helpers
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isSelectedDateToday = selectedDate === todayStr;
  const formattedDisplayDate = useMemo(() => {
    try {
      return format(parseISO(selectedDate), "EEEE, MMMM d, yyyy");
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // 1. Fetch Colleges
  const { data: collegeData, isLoading: collegeLoading } = useListCollegesQuery();

  // Resolve Teacher's Active College ID
  const teacherActiveCollegeId = useMemo(() => {
    if (activeBatchData?.collegeId) {
      return typeof activeBatchData.collegeId === "object"
        ? activeBatchData.collegeId.$id
        : activeBatchData.collegeId;
    }
    const currentActive = userBatches.find(
      (b) => b.$id === activeBatchId || b.isCurrentBatch
    );
    if (currentActive?.collegeId) {
      return typeof currentActive.collegeId === "object"
        ? currentActive.collegeId.$id
        : currentActive.collegeId;
    }
    if (userBatches.length > 0 && userBatches[0]?.collegeId) {
      return typeof userBatches[0].collegeId === "object"
        ? userBatches[0].collegeId.$id
        : userBatches[0].collegeId;
    }
    return null;
  }, [activeBatchData, userBatches, activeBatchId]);

  // Auto-select Teacher's Active Batch College by default
  useEffect(() => {
    if (!collegeLoading && collegeData?.documents && collegeData.documents.length > 0) {
      if (!selectedCollege) {
        if (teacherActiveCollegeId) {
          const matchedCollege = collegeData.documents.find(
            (c) => c.$id === teacherActiveCollegeId
          );
          if (matchedCollege) {
            setSelectedCollege(matchedCollege);
            return;
          }
        }

        // Fallback for teacher if active batch wasn't populated yet: query batchService
        if (!isAdmin && user?.$id) {
          batchService
            .listBatches([
              Query.equal("teacherId", user.$id),
              Query.select(["collegeId"]),
              Query.limit(1),
            ])
            .then((res) => {
              if (res?.documents?.length > 0) {
                const batchCollegeId =
                  res.documents[0].collegeId?.$id || res.documents[0].collegeId;
                const teacherCol = collegeData.documents.find(
                  (c) => c.$id === batchCollegeId
                );
                if (teacherCol) {
                  setSelectedCollege(teacherCol);
                  return;
                }
              }
              setSelectedCollege(collegeData.documents[0]);
            })
            .catch(() => {
              setSelectedCollege(collegeData.documents[0]);
            });
        } else {
          // Admin default to first college
          setSelectedCollege(collegeData.documents[0]);
        }
      }
    }
  }, [collegeData, collegeLoading, teacherActiveCollegeId, isAdmin, user, selectedCollege]);

  // 2. Fetch Trades for Selected College
  const tradeIds = useMemo(() => {
    if (!selectedCollege || !selectedCollege.tradeIds) return [];
    return Array.isArray(selectedCollege.tradeIds) ? selectedCollege.tradeIds : [];
  }, [selectedCollege]);

  const { data: tradeData } = useListTradesQuery(
    [Query.equal("$id", tradeIds)],
    {
      skip: !selectedCollege || tradeIds.length === 0,
    }
  );

  // 3. Fetch Batches for Selected College
  const { data: batchData } = useListBatchesQuery(
    [
      Query.equal("isActive", true),
      Query.equal("collegeId", selectedCollege?.$id || ""),
    ],
    {
      skip: !selectedCollege || !selectedCollege?.$id,
    }
  );

  // Sync current batch IDs for realtime subscription
  useEffect(() => {
    if (batchData?.documents) {
      currentBatchIds.current = batchData.documents.map((b) => b.$id);
    }
  }, [batchData]);

  // --- Data Fetching Logic for Attendance & Members ---
  const fetchAttendanceStats = useCallback(
    async (isManualRefresh = false) => {
      if (!batchData?.documents || batchData.documents.length === 0) {
        setBatchAttendanceMap(new Map());
        setBatchMembersMap(new Map());
        return;
      }

      if (isManualRefresh) setIsRefreshing(true);
      else setLoadingStats(true);

      try {
        const batchList = batchData.documents;
        const newAttMap = new Map();
        const newMemMap = new Map();

        // Fetch students & attendance concurrently for all batches in the college
        await Promise.all(
          batchList.map(async (batch) => {
            try {
              // 1. Get enrolled batch members
              const members = await batchStudentService.getBatchStudents(batch.$id);
              newMemMap.set(batch.$id, members || []);

              const userIds = (members || []).map((m) => m.studentId).filter(Boolean);

              // 2. Get attendance records for selected date
              const targetDate = new Date(selectedDate);
              const attResponse = await newAttendanceService.getBatchAttendanceByDate(
                batch.$id,
                targetDate,
                userIds.length > 0 ? [Query.equal("userId", userIds)] : []
              );

              newAttMap.set(batch.$id, attResponse?.documents || []);
            } catch (err) {
              console.warn(`Error fetching stats for batch ${batch.$id}:`, err);
              newMemMap.set(batch.$id, []);
              newAttMap.set(batch.$id, []);
            }
          })
        );

        setBatchMembersMap(newMemMap);
        setBatchAttendanceMap(newAttMap);
      } catch (e) {
        console.error("Error fetching college attendance stats:", e);
      } finally {
        setLoadingStats(false);
        setIsRefreshing(false);
      }
    },
    [batchData, selectedDate]
  );

  // Fetch when batches or selected date change
  useEffect(() => {
    fetchAttendanceStats();
  }, [fetchAttendanceStats]);

  // --- Process & Compute Comprehensive Stats ---
  const computedData = useMemo(() => {
    const rawBatches = batchData?.documents || [];
    const trades = tradeData?.documents || [];

    // Map each batch with its complete computed metrics
    const processedBatches = rawBatches.map((batch) => {
      const members = batchMembersMap.get(batch.$id) || [];
      const attendance = batchAttendanceMap.get(batch.$id) || [];

      const totalEnrolled = members.length;
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let lateCount = 0;
      let halfDayCount = 0;

      attendance.forEach((item) => {
        const st = String(item.attendanceStatus || item.status || "").toLowerCase();
        if (st === "present") presentCount++;
        else if (st === "absent") absentCount++;
        else if (st === "leave") leaveCount++;
        else if (st === "late") {
          lateCount++;
          presentCount++; // Late counts towards present
        } else if (st === "half_day" || st === "half day") {
          halfDayCount++;
          presentCount += 0.5;
        }
      });

      const totalMarked = attendance.length;
      const unmarkedCount = Math.max(0, totalEnrolled - totalMarked);
      const isMarked = totalMarked > 0;
      const isFullyMarked = totalEnrolled > 0 && totalMarked >= totalEnrolled;

      // Rate: percentage of enrolled students present today
      const attendanceRate =
        totalEnrolled > 0
          ? ((presentCount / totalEnrolled) * 100).toFixed(1)
          : totalMarked > 0
          ? ((presentCount / totalMarked) * 100).toFixed(1)
          : "0.0";

      // Trade details for this batch
      const matchedTrade = trades.find(
        (t) => t.$id === (batch.tradeId?.$id || batch.tradeId)
      );

      const isTeacherActiveBatch =
        batch.$id === activeBatchId ||
        userBatches.some((ub) => ub.$id === batch.$id && ub.isCurrentBatch);

      return {
        batchId: batch.$id,
        batchName: batch.BatchName || "Unnamed Batch",
        tradeId: batch.tradeId?.$id || batch.tradeId,
        tradeName: matchedTrade?.tradeName || "General Trade",
        tradeCode: matchedTrade?.tradeCode || "",
        teacherId: batch.teacherId,
        isActiveBatch: isTeacherActiveBatch,
        totalEnrolled,
        totalMarked,
        presentCount,
        absentCount,
        leaveCount,
        lateCount,
        halfDayCount,
        unmarkedCount,
        isMarked,
        isFullyMarked,
        attendanceRate: parseFloat(attendanceRate),
        attendanceRateStr: attendanceRate,
        members,
        attendanceRecords: attendance,
      };
    });

    // Group batches by trade
    const tradeGroups = trades.map((trade) => {
      const tradeBatches = processedBatches.filter(
        (b) => b.tradeId === trade.$id
      );

      const tradeEnrolled = tradeBatches.reduce((acc, b) => acc + b.totalEnrolled, 0);
      const tradePresent = tradeBatches.reduce((acc, b) => acc + b.presentCount, 0);
      const tradeAbsent = tradeBatches.reduce((acc, b) => acc + b.absentCount, 0);
      const tradeLeave = tradeBatches.reduce((acc, b) => acc + b.leaveCount, 0);
      const tradeUnmarked = tradeBatches.reduce((acc, b) => acc + b.unmarkedCount, 0);

      const tradeRate =
        tradeEnrolled > 0
          ? ((tradePresent / tradeEnrolled) * 100).toFixed(1)
          : "0.0";

      return {
        tradeId: trade.$id,
        tradeName: trade.tradeName,
        tradeCode: trade.tradeCode,
        batches: tradeBatches,
        totalEnrolled: tradeEnrolled,
        totalPresent: tradePresent,
        totalAbsent: tradeAbsent,
        totalLeave: tradeLeave,
        totalUnmarked: tradeUnmarked,
        attendanceRate: parseFloat(tradeRate),
        attendanceRateStr: tradeRate,
        batchesCount: tradeBatches.length,
      };
    });

    // Overall College Aggregates
    const collegeEnrolled = processedBatches.reduce((acc, b) => acc + b.totalEnrolled, 0);
    const collegePresent = processedBatches.reduce((acc, b) => acc + b.presentCount, 0);
    const collegeAbsent = processedBatches.reduce((acc, b) => acc + b.absentCount, 0);
    const collegeLeave = processedBatches.reduce((acc, b) => acc + b.leaveCount, 0);
    const collegeUnmarked = processedBatches.reduce((acc, b) => acc + b.unmarkedCount, 0);
    const totalBatches = processedBatches.length;
    const fullyMarkedBatches = processedBatches.filter((b) => b.isFullyMarked).length;
    const unmarkedBatches = processedBatches.filter((b) => !b.isMarked).length;

    const overallRate =
      collegeEnrolled > 0
        ? ((collegePresent / collegeEnrolled) * 100).toFixed(1)
        : "0.0";

    return {
      allBatches: processedBatches,
      trades: tradeGroups,
      overall: {
        totalEnrolled: collegeEnrolled,
        totalPresent: collegePresent,
        totalAbsent: collegeAbsent,
        totalLeave: collegeLeave,
        totalUnmarked: collegeUnmarked,
        percentage: overallRate,
        totalBatches,
        fullyMarkedBatches,
        unmarkedBatches,
      },
    };
  }, [batchData, tradeData, batchMembersMap, batchAttendanceMap, activeBatchId, userBatches]);

  // --- Filter & Sort Batches for Presentation ---
  const filteredBatches = useMemo(() => {
    let result = [...computedData.allBatches];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.batchName.toLowerCase().includes(q) ||
          b.tradeName.toLowerCase().includes(q)
      );
    }

    // 2. Trade Filter
    if (selectedTradeFilter !== "all") {
      result = result.filter((b) => b.tradeId === selectedTradeFilter);
    }

    // 3. Batch Filter
    if (selectedBatchFilter === "active_only") {
      result = result.filter((b) => b.isActiveBatch);
    } else if (selectedBatchFilter !== "all") {
      result = result.filter((b) => b.batchId === selectedBatchFilter);
    }

    // 4. Status Filter
    if (statusFilter === "high") {
      result = result.filter((b) => b.attendanceRate >= 85);
    } else if (statusFilter === "moderate") {
      result = result.filter((b) => b.attendanceRate >= 60 && b.attendanceRate < 85);
    } else if (statusFilter === "low") {
      result = result.filter((b) => b.attendanceRate < 60 && b.isMarked);
    } else if (statusFilter === "unmarked") {
      result = result.filter((b) => !b.isMarked);
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === "percentage_desc") return b.attendanceRate - a.attendanceRate;
      if (sortBy === "percentage_asc") return a.attendanceRate - b.attendanceRate;
      if (sortBy === "students_desc") return b.totalEnrolled - a.totalEnrolled;
      if (sortBy === "absent_desc") return b.absentCount - a.absentCount;
      if (sortBy === "name_asc") return a.batchName.localeCompare(b.batchName);
      return 0;
    });

    return result;
  }, [
    computedData.allBatches,
    searchQuery,
    selectedTradeFilter,
    selectedBatchFilter,
    statusFilter,
    sortBy,
  ]);

  // Aggregated Stats for Currently Filtered View
  const filteredMetrics = useMemo(() => {
    const totalEnrolled = filteredBatches.reduce((acc, b) => acc + b.totalEnrolled, 0);
    const present = filteredBatches.reduce((acc, b) => acc + b.presentCount, 0);
    const absent = filteredBatches.reduce((acc, b) => acc + b.absentCount, 0);
    const leave = filteredBatches.reduce((acc, b) => acc + b.leaveCount, 0);
    const unmarked = filteredBatches.reduce((acc, b) => acc + b.unmarkedCount, 0);
    const rate = totalEnrolled > 0 ? ((present / totalEnrolled) * 100).toFixed(1) : "0.0";

    return {
      totalEnrolled,
      present,
      absent,
      leave,
      unmarked,
      rate,
      count: filteredBatches.length,
    };
  }, [filteredBatches]);

  // --- Real-time Appwrite Subscription ---
  useEffect(() => {
    isComponentMountedRef.current = true;

    if (!selectedCollege || !batchData?.documents?.length) return;
    if (subscriptionRef.current) return;

    const setup = async () => {
      try {
        const realtime = appwriteService.getRealtime();
        const channel = Channel.tablesdb(conf.databaseId)
          .table(conf.newAttendanceCollectionId)
          .row();

        const sub = await realtime.subscribe(channel, (response) => {
          if (!isComponentMountedRef.current) return;

          const document = response.payload;
          if (
            !document.batchId ||
            !currentBatchIds.current.includes(document.batchId)
          ) {
            return;
          }

          const events = response.events;
          const isCreate = events.some((e) => e.endsWith(".create"));
          const isUpdate = events.some((e) => e.endsWith(".update"));
          const isDelete = events.some((e) => e.endsWith(".delete"));

          setBatchAttendanceMap((prevMap) => {
            const newMap = new Map(prevMap);
            const currentDocs = newMap.get(document.batchId) || [];

            if (isCreate) {
              newMap.set(document.batchId, [...currentDocs, document]);
            } else if (isUpdate) {
              const updated = currentDocs.map((d) =>
                d.$id === document.$id ? document : d
              );
              newMap.set(document.batchId, updated);
            } else if (isDelete) {
              const filtered = currentDocs.filter((d) => d.$id !== document.$id);
              newMap.set(document.batchId, filtered);
            }
            return newMap;
          });
        });

        subscriptionRef.current = sub;
      } catch (error) {
        console.error("Attendance Realtime Subscription failed:", error);
      }
    };

    setup();

    return () => {
      isComponentMountedRef.current = false;
      const sub = subscriptionRef.current;
      if (sub && typeof sub.unsubscribe === "function") {
        sub.unsubscribe();
      }
      subscriptionRef.current = null;
    };
  }, [selectedCollege, batchData]);

  // --- Student Roster Drill-Down Logic ---
  const handleOpenRoster = async (batchItem) => {
    setRosterModalBatch(batchItem);
    setRosterSearch("");
    setRosterStatusTab("all");

    // Fetch user profiles for the batch members
    const userIds = batchItem.members.map((m) => m.studentId).filter(Boolean);
    if (userIds.length > 0) {
      setLoadingRosterProfiles(true);
      try {
        const profilesMap = await userProfileService.getProfilesByUserIds(userIds);
        setRosterProfiles(profilesMap);
      } catch (err) {
        console.error("Error fetching roster profiles:", err);
      } finally {
        setLoadingRosterProfiles(false);
      }
    } else {
      setRosterProfiles(new Map());
    }
  };

  // Filtered list of students inside the Roster Modal
  const rosterStudentList = useMemo(() => {
    if (!rosterModalBatch) return [];

    const attendanceRecords = rosterModalBatch.attendanceRecords || [];
    const attMap = new Map(attendanceRecords.map((r) => [r.userId, r]));

    const list = rosterModalBatch.members.map((member) => {
      const studentId = member.studentId;
      const profileData = rosterProfiles.get(studentId) || {};
      const attRecord = attMap.get(studentId);

      const status = attRecord
        ? String(attRecord.attendanceStatus || attRecord.status || "").toLowerCase()
        : "unmarked";

      return {
        memberId: member.$id,
        studentId,
        rollNumber: member.rollNumber || profileData.rollNumber || "N/A",
        name: profileData.userName || profileData.name || `Student (${studentId.slice(0, 6)})`,
        email: profileData.email || "",
        phone: profileData.phone || "",
        profileImage: profileData.profileImage || null,
        status: status === "present" ? "present" : status === "absent" ? "absent" : status === "leave" ? "leave" : "unmarked",
        rawStatus: status,
        markedAt: attRecord?.$createdAt || null,
        remarks: attRecord?.remarks || "",
      };
    });

    return list.filter((item) => {
      // 1. Search Filter
      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchRoll = item.rollNumber.toLowerCase().includes(q);
        if (!matchName && !matchRoll) return false;
      }

      // 2. Status Tab Filter
      if (rosterStatusTab === "present") return item.status === "present";
      if (rosterStatusTab === "absent") return item.status === "absent";
      if (rosterStatusTab === "leave") return item.status === "leave";
      if (rosterStatusTab === "unmarked") return item.status === "unmarked";

      return true;
    });
  }, [rosterModalBatch, rosterProfiles, rosterSearch, rosterStatusTab]);

  // --- Export College Report to CSV ---
  const handleExportCSV = () => {
    if (!filteredBatches.length) return;

    const headers = [
      "College",
      "Date",
      "Trade Name",
      "Batch Name",
      "Total Enrolled",
      "Present Count",
      "Absent Count",
      "Leave Count",
      "Unmarked Count",
      "Attendance Rate (%)",
      "Status",
    ];

    const rows = filteredBatches.map((b) => [
      `"${selectedCollege?.collageName || "College"}"`,
      `"${selectedDate}"`,
      `"${b.tradeName}"`,
      `"${b.batchName}"`,
      b.totalEnrolled,
      b.presentCount,
      b.absentCount,
      b.leaveCount,
      b.unmarkedCount,
      `"${b.attendanceRateStr}%"`,
      `"${b.isFullyMarked ? "Complete" : b.isMarked ? "Partial" : "Unmarked"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Attendance_${selectedCollege?.collageName || "College"}_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading Screen for College List
  if (collegeLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-50 dark:bg-slate-950">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-4 border-blue-500/20 border-t-blue-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading College Attendance Hub...
        </p>
      </div>
    );
  }

  // Teacher has no batches assigned
  if (!isAdmin && userBatches.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 flex items-center justify-center">
        <NoBatchTeacherView isTeacher={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        
        {/* ========================================================================= */}
        {/* 1. TOP COMMAND BAR & HERO HEADER */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left: College Brand & Title */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/80">
                  <Building2 size={13} className="text-blue-600 dark:text-blue-400" />
                  {selectedCollege?.collageName || "College"}
                </span>

                {activeBatchData && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/80">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    Active: {activeBatchData.BatchName}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime Active
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                  College Attendance Central
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <CalendarDays size={15} className="text-slate-400" />
                  {formattedDisplayDate}
                  {isSelectedDateToday && (
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                      Today
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Date Picker, College Selector & Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              
              {/* Date Input */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm font-medium px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                />
                {!isSelectedDateToday && (
                  <button
                    onClick={() => setSelectedDate(todayStr)}
                    className="text-xs bg-blue-600 text-white font-semibold px-2.5 py-1 rounded-xl hover:bg-blue-700 transition"
                  >
                    Today
                  </button>
                )}
              </div>

              {/* College Switcher for Admins or Multi-College */}
              {isAdmin ? (
                <div className="w-full sm:w-64">
                  <Select
                    value={selectedCollege?.$id || ""}
                    onValueChange={(id) => {
                      const college = collegeData?.documents?.find((c) => c.$id === id);
                      setSelectedCollege(college);
                    }}
                  >
                    <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold shadow-xs">
                      <SelectValue placeholder="Switch College" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
                      {collegeData?.documents?.map((c) => (
                        <SelectItem
                          key={c.$id}
                          value={c.$id}
                          className="text-xs font-medium cursor-pointer"
                        >
                          {c.collageName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {/* Refresh Action */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchAttendanceStats(true)}
                disabled={loadingStats || isRefreshing}
                className="h-11 w-11 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Sync Realtime Data"
              >
                <RefreshCw
                  size={16}
                  className={`text-slate-600 dark:text-slate-300 ${
                    isRefreshing || loadingStats ? "animate-spin text-blue-600" : ""
                  }`}
                />
              </Button>

              {/* Export CSV */}
              <Button
                onClick={handleExportCSV}
                disabled={filteredBatches.length === 0}
                className="h-11 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold gap-2 shadow-sm"
              >
                <Download size={15} />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. INTERACTIVE TELEMETRY HUD / METRIC STRIP */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Total Enrolled */}
          <div
            onClick={() => setStatusFilter("all")}
            className={`relative overflow-hidden rounded-3xl p-5 border transition-all duration-200 cursor-pointer group ${
              statusFilter === "all"
                ? "bg-blue-600/10 border-blue-500/40 dark:bg-blue-950/40 dark:border-blue-500/50 shadow-md ring-2 ring-blue-500/30"
                : "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Total Enrolled
              </span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {filteredMetrics.totalEnrolled}
              </span>
              <span className="text-xs font-semibold text-slate-400">students</span>
            </div>
            <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen size={13} className="text-blue-500" />
              Across {filteredMetrics.count} batches
            </div>
          </div>

          {/* Card 2: Present Today */}
          <div
            onClick={() => setStatusFilter("high")}
            className={`relative overflow-hidden rounded-3xl p-5 border transition-all duration-200 cursor-pointer group ${
              statusFilter === "high"
                ? "bg-emerald-600/10 border-emerald-500/40 dark:bg-emerald-950/40 dark:border-emerald-500/50 shadow-md ring-2 ring-emerald-500/30"
                : "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                Present Today
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {filteredMetrics.present}
              </span>
              <span className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70">
                attendees
              </span>
            </div>
            <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              {filteredMetrics.totalEnrolled > 0
                ? `${((filteredMetrics.present / filteredMetrics.totalEnrolled) * 100).toFixed(1)}% of total`
                : "0%"}
            </div>
          </div>

          {/* Card 3: Absent Today */}
          <div
            onClick={() => setStatusFilter("low")}
            className={`relative overflow-hidden rounded-3xl p-5 border transition-all duration-200 cursor-pointer group ${
              statusFilter === "low"
                ? "bg-rose-600/10 border-rose-500/40 dark:bg-rose-950/40 dark:border-rose-500/50 shadow-md ring-2 ring-rose-500/30"
                : "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-rose-600 dark:text-rose-400">
                Absent Today
              </span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserX size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
                {filteredMetrics.absent}
              </span>
              <span className="text-xs font-semibold text-rose-600/70 dark:text-rose-400/70">
                absentees
              </span>
            </div>
            <div className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertCircle size={13} />
              {filteredMetrics.leave > 0 && `+ ${filteredMetrics.leave} on leave`}
              {filteredMetrics.leave === 0 && "Marked absent"}
            </div>
          </div>

          {/* Card 4: Overall Rate & Health */}
          <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-xl shadow-indigo-600/20 border-0 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-indigo-200">
                Attendance Rate
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <TrendingUp size={18} className="text-white" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">
                {filteredMetrics.rate}%
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, parseFloat(filteredMetrics.rate) || 0)}%` }}
                />
              </div>
            </div>
            <div className="text-xs font-medium text-indigo-100 flex items-center justify-between">
              <span>Marking: {computedData.overall.fullyMarkedBatches}/{computedData.overall.totalBatches} batches</span>
              <span className="font-bold">
                {parseFloat(filteredMetrics.rate) >= 80 ? "✨ Healthy" : "⚠️ Needs Focus"}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MULTI-DIMENSIONAL FILTER & CONTROL DOCK */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          
          {/* Top Filter Row: Search, Batch Selector, Health Filter, Sort, View Toggle */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search batch or trade name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Batch Scope Filter */}
              <Select value={selectedBatchFilter} onValueChange={setSelectedBatchFilter}>
                <SelectTrigger className="h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-semibold min-w-[150px]">
                  <SelectValue placeholder="Filter Batch" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
                  <SelectItem value="all">All Batches</SelectItem>
                  {activeBatchData && (
                    <SelectItem value="active_only" className="font-bold text-amber-600 dark:text-amber-400">
                      ⭐ My Active Batch Only
                    </SelectItem>
                  )}
                  {computedData.allBatches.map((b) => (
                    <SelectItem key={b.batchId} value={b.batchId}>
                      {b.batchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status / Health Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-semibold min-w-[140px]">
                  <SelectValue placeholder="Attendance Health" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
                  <SelectItem value="all">All Health States</SelectItem>
                  <SelectItem value="high">🟢 High (≥85%)</SelectItem>
                  <SelectItem value="moderate">🟡 Moderate (60-84%)</SelectItem>
                  <SelectItem value="low">🔴 Low (&lt;60%)</SelectItem>
                  <SelectItem value="unmarked">⚪ Unmarked Today</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-semibold min-w-[150px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
                  <SelectItem value="percentage_desc">Highest Attendance %</SelectItem>
                  <SelectItem value="percentage_asc">Lowest Attendance %</SelectItem>
                  <SelectItem value="students_desc">Most Enrolled Students</SelectItem>
                  <SelectItem value="absent_desc">Most Absentees</SelectItem>
                  <SelectItem value="name_asc">Batch Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("matrix")}
                  className={`p-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                    viewMode === "matrix"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Trade Command Matrix"
                >
                  <LayoutGrid size={16} />
                  <span className="hidden sm:inline">Matrix</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Analytics Data Table"
                >
                  <TableIcon size={16} />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Filter Row: Horizontal Trade Selection Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setSelectedTradeFilter("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                selectedTradeFilter === "all"
                  ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30"
                  : "bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Layers size={13} />
              All Trades ({computedData.trades.length})
            </button>

            {computedData.trades.map((trade) => {
              const isSelected = selectedTradeFilter === trade.tradeId;
              return (
                <button
                  key={trade.tradeId}
                  onClick={() => setSelectedTradeFilter(trade.tradeId)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-2 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30 font-bold"
                      : "bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{trade.tradeName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {trade.batchesCount}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      trade.attendanceRate >= 80
                        ? isSelected
                          ? "text-emerald-200"
                          : "text-emerald-600 dark:text-emerald-400"
                        : isSelected
                        ? "text-rose-200"
                        : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {trade.attendanceRateStr}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. MAIN CONTENT AREA: MATRIX VIEW OR TABLE VIEW */}
        {/* ========================================================================= */}
        {loadingStats ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-2xl border-4 border-blue-500/20 border-t-blue-600 animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Gathering college attendance intelligence...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Synchronizing trade & batch telemetry
            </p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/80 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center p-8">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No matching attendance records found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-5">
              Try adjusting your search filters, selecting another trade, or changing the date.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedTradeFilter("all");
                setSelectedBatchFilter("all");
                setStatusFilter("all");
              }}
              className="rounded-2xl text-xs font-bold"
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "table" ? (
          
          /* ----------------------------------------------------------------------- */
          /* VIEW 1: COMPARATIVE ANALYTICS DATA TABLE */
          /* ----------------------------------------------------------------------- */
          <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BarChart3 size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    College Performance Table
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {filteredBatches.length} batches across selected filters
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-5">Batch Details</th>
                    <th className="py-3.5 px-4">Trade</th>
                    <th className="py-3.5 px-4 text-center">Enrolled</th>
                    <th className="py-3.5 px-4 text-center">Present</th>
                    <th className="py-3.5 px-4 text-center">Absent</th>
                    <th className="py-3.5 px-4 text-center">Unmarked</th>
                    <th className="py-3.5 px-5">Attendance Rate</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBatches.map((batch) => {
                    const rate = batch.attendanceRate;
                    const statusColor =
                      rate >= 85
                        ? "emerald"
                        : rate >= 60
                        ? "amber"
                        : rate > 0
                        ? "rose"
                        : "slate";

                    return (
                      <tr
                        key={batch.batchId}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          batch.isActiveBatch
                            ? "bg-amber-50/30 dark:bg-amber-950/20"
                            : ""
                        }`}
                      >
                        {/* Batch Name & Active Badge */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {batch.batchName}
                            </span>
                            {batch.isActiveBatch && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                ⭐ Your Active
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Trade Name */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {batch.tradeName}
                          </span>
                        </td>

                        {/* Total Enrolled */}
                        <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {batch.totalEnrolled}
                        </td>

                        {/* Present */}
                        <td className="py-4 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {batch.presentCount}
                        </td>

                        {/* Absent */}
                        <td className="py-4 px-4 text-center font-bold text-rose-600 dark:text-rose-400">
                          {batch.absentCount}
                        </td>

                        {/* Unmarked */}
                        <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                          {batch.unmarkedCount}
                        </td>

                        {/* Attendance Rate Bar */}
                        <td className="py-4 px-5 min-w-[170px]">
                          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <span
                              className={`text-${statusColor}-600 dark:text-${statusColor}-400 font-extrabold`}
                            >
                              {batch.attendanceRateStr}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {batch.isFullyMarked
                                ? "Complete"
                                : batch.isMarked
                                ? "Partial"
                                : "Unmarked"}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{
                                width: `${
                                  batch.totalEnrolled > 0
                                    ? (batch.presentCount / batch.totalEnrolled) * 100
                                    : 0
                                }%`,
                              }}
                            />
                            <div
                              className="bg-rose-500 h-full"
                              style={{
                                width: `${
                                  batch.totalEnrolled > 0
                                    ? (batch.absentCount / batch.totalEnrolled) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRoster(batch)}
                            className="rounded-xl text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 gap-1"
                          >
                            <Eye size={14} />
                            Roster
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          
          /* ----------------------------------------------------------------------- */
          /* VIEW 2: CREATIVE TRADE COMMAND MATRIX (BENTO TELEMETRY CARDS) */
          /* ----------------------------------------------------------------------- */
          <div className="space-y-8">
            {computedData.trades
              .filter(
                (t) =>
                  selectedTradeFilter === "all" || t.tradeId === selectedTradeFilter
              )
              .map((trade) => {
                // Get batches belonging to this trade that also pass the global batch filter & search
                const tradeBatches = filteredBatches.filter(
                  (b) => b.tradeId === trade.tradeId
                );

                if (tradeBatches.length === 0) return null;

                return (
                  <div
                    key={trade.tradeId}
                    className="rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300"
                  >
                    {/* Trade Header Strip */}
                    <div className="bg-gradient-to-r from-slate-50 via-slate-100/50 to-slate-50 dark:from-slate-800/70 dark:via-slate-800/40 dark:to-slate-800/70 p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                          <GraduationCap size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                              {trade.tradeName}
                            </h2>
                            {trade.tradeCode && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {trade.tradeCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            {trade.batchesCount} Batches • {trade.totalEnrolled} Registered Students
                          </p>
                        </div>
                      </div>

                      {/* Trade Aggregate Quick Stats */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-3 text-xs font-semibold bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <UserCheck size={14} />
                            <span>{trade.totalPresent} Present</span>
                          </div>
                          <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                            <UserX size={14} />
                            <span>{trade.totalAbsent} Absent</span>
                          </div>
                          <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
                          <div className="font-extrabold text-blue-600 dark:text-blue-400">
                            {trade.attendanceRateStr}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trade Batches Grid */}
                    <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                      {tradeBatches.map((batch) => {
                        const rate = batch.attendanceRate;
                        const statusTheme =
                          rate >= 85
                            ? {
                                border: "hover:border-emerald-400 dark:hover:border-emerald-600",
                                badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
                                text: "text-emerald-600 dark:text-emerald-400",
                                bar: "bg-emerald-500",
                                pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                              }
                            : rate >= 60
                            ? {
                                border: "hover:border-amber-400 dark:hover:border-amber-600",
                                badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
                                text: "text-amber-600 dark:text-amber-400",
                                bar: "bg-amber-500",
                                pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                              }
                            : {
                                border: "hover:border-rose-400 dark:hover:border-rose-600",
                                badge: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
                                text: "text-rose-600 dark:text-rose-400",
                                bar: "bg-rose-500",
                                pill: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
                              };

                        return (
                          <div
                            key={batch.batchId}
                            className={`relative rounded-2xl bg-white dark:bg-slate-950/80 border p-5 transition-all duration-200 hover:shadow-lg group flex flex-col justify-between ${
                              batch.isActiveBatch
                                ? "border-amber-400/80 dark:border-amber-500/80 shadow-md ring-2 ring-amber-400/20"
                                : "border-slate-200/80 dark:border-slate-800 shadow-xs"
                            } ${statusTheme.border}`}
                          >
                            {/* Card Top: Batch Title & Rate Badge */}
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3
                                      className="text-base font-bold text-slate-900 dark:text-white line-clamp-1"
                                      title={batch.batchName}
                                    >
                                      {batch.batchName}
                                    </h3>
                                  </div>
                                  {batch.isActiveBatch && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                      <Star size={11} className="fill-amber-500" />
                                      Your Active Batch
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`px-3 py-1 rounded-xl text-xs font-black tracking-tight ${statusTheme.badge}`}
                                >
                                  {batch.attendanceRateStr}%
                                </span>
                              </div>

                              {/* Multi-Segment Visual Attendance Gauge */}
                              <div className="space-y-1.5 my-4">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                                  <span>Attendance Distribution</span>
                                  <span>
                                    {batch.isFullyMarked
                                      ? "100% Processed"
                                      : batch.isMarked
                                      ? `${batch.totalMarked}/${batch.totalEnrolled} Marked`
                                      : "Not Marked Today"}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                                  {batch.totalEnrolled > 0 ? (
                                    <>
                                      <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                        style={{
                                          width: `${(batch.presentCount / batch.totalEnrolled) * 100}%`,
                                        }}
                                        title={`Present: ${batch.presentCount}`}
                                      />
                                      <div
                                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                                        style={{
                                          width: `${(batch.absentCount / batch.totalEnrolled) * 100}%`,
                                        }}
                                        title={`Absent: ${batch.absentCount}`}
                                      />
                                      <div
                                        className="bg-slate-300 dark:bg-slate-700 h-full rounded-full"
                                        style={{
                                          width: `${(batch.unmarkedCount / batch.totalEnrolled) * 100}%`,
                                        }}
                                        title={`Unmarked: ${batch.unmarkedCount}`}
                                      />
                                    </>
                                  ) : (
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-full rounded-full" />
                                  )}
                                </div>
                              </div>

                              {/* Key Metrics Bento Grid */}
                              <div className="grid grid-cols-3 gap-2 text-center my-4">
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                                    Enrolled
                                  </div>
                                  <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                                    {batch.totalEnrolled}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/80 dark:border-emerald-900/40">
                                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                    Present
                                  </div>
                                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {batch.presentCount}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100/80 dark:border-rose-900/40">
                                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                                    Absent
                                  </div>
                                  <div className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                                    {batch.absentCount}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: Action */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">
                                {batch.unmarkedCount > 0
                                  ? `${batch.unmarkedCount} Unmarked`
                                  : "All Accounted"}
                              </span>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenRoster(batch)}
                                className="h-8 px-3 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 gap-1.5"
                              >
                                <Eye size={13} />
                                View Roster
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. STUDENT ROSTER INSPECTION MODAL */}
        {/* ========================================================================= */}
        <Dialog
          open={!!rosterModalBatch}
          onOpenChange={(open) => !open && setRosterModalBatch(null)}
        >
          <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 rounded-3xl overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/80 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                      {rosterModalBatch?.tradeName}
                    </span>
                    {rosterModalBatch?.isActiveBatch && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                        ⭐ Active Batch
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                    {rosterModalBatch?.batchName}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Roster attendance breakdown for {formattedDisplayDate}
                  </DialogDescription>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {rosterModalBatch?.attendanceRateStr}%
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    Rate Today
                  </div>
                </div>
              </div>

              {/* Roster Quick Tabs & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5">
                {/* Search */}
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    placeholder="Search student or roll..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="pl-9 h-9 rounded-xl text-xs bg-white dark:bg-slate-800"
                  />
                </div>

                {/* Status Tab Pills */}
                <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setRosterStatusTab("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      rosterStatusTab === "all"
                        ? "bg-slate-900 text-white dark:bg-slate-700"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    All ({rosterModalBatch?.totalEnrolled || 0})
                  </button>
                  <button
                    onClick={() => setRosterStatusTab("present")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      rosterStatusTab === "present"
                        ? "bg-emerald-600 text-white"
                        : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    }`}
                  >
                    Present ({rosterModalBatch?.presentCount || 0})
                  </button>
                  <button
                    onClick={() => setRosterStatusTab("absent")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      rosterStatusTab === "absent"
                        ? "bg-rose-600 text-white"
                        : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    }`}
                  >
                    Absent ({rosterModalBatch?.absentCount || 0})
                  </button>
                  <button
                    onClick={() => setRosterStatusTab("unmarked")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      rosterStatusTab === "unmarked"
                        ? "bg-slate-600 text-white"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  >
                    Unmarked ({rosterModalBatch?.unmarkedCount || 0})
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body: Student List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              {loadingRosterProfiles ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-3 border-blue-500/20 border-t-blue-600 animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-400">
                    Loading student profiles...
                  </p>
                </div>
              ) : rosterStudentList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No students match the selected roster filters.
                </div>
              ) : (
                rosterStudentList.map((student) => {
                  const isPresent = student.status === "present";
                  const isAbsent = student.status === "absent";
                  const isLeave = student.status === "leave";

                  return (
                    <div
                      key={student.memberId || student.studentId}
                      className="pt-2.5 first:pt-0 flex items-center justify-between gap-3"
                    >
                      {/* Avatar & Student Name */}
                      <div className="flex items-center gap-3">
                        <InteractiveAvatar
                          src={student.profileImage}
                          fallbackText={student.name}
                          className="w-10 h-10 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {student.name}
                          </h4>
                          <p className="text-xs text-slate-400">
                            Roll: {student.rollNumber} {student.email && `• ${student.email}`}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPresent && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <CheckCircle2 size={13} />
                            Present
                          </span>
                        )}
                        {isAbsent && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                            <UserX size={13} />
                            Absent
                          </span>
                        )}
                        {isLeave && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            <AlertCircle size={13} />
                            On Leave
                          </span>
                        )}
                        {student.status === "unmarked" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Unmarked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total: {rosterStudentList.length} Students Listed
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRosterModalBatch(null)}
                className="rounded-xl text-xs font-bold"
              >
                Close Roster
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CollegeAttendance;
