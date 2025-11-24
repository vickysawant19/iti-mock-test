import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Calendar,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  GraduationCap,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { useListBatchesQuery } from "@/store/api/batchApi";
import { Query, Client } from "appwrite";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import conf from "@/config/config";

// Create a single persistent client instance outside the component
let persistentClient = null;
let subscriptionActive = false;

const getPersistentClient = () => {
  if (!persistentClient) {
    console.log("🔌 Creating persistent Appwrite client");
    persistentClient = new Client()
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.projectId);
  }
  return persistentClient;
};

const AttendanceDashboard = () => {
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [batchAttendance, setBatchAttendance] = useState(new Map());
  const [loadingStats, setLoadingStats] = useState(false);

  // Refs
  const currentBatchIds = useRef([]);
  const subscriptionRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

  // 1. Fetch Colleges
  const { data: collegeData, isLoading: collegeLoading } =
    useListCollegesQuery();

  // 2. Fetch Trades
  const { data: tradeData } = useListTradesQuery(
    [Query.equal("$id", selectedCollege?.tradeIds || [])],
    {
      skip:
        !selectedCollege ||
        !selectedCollege?.tradeIds ||
        selectedCollege?.tradeIds.length === 0,
    }
  );

  // 3. Fetch Batches
  const { data: batchData } = useListBatchesQuery(
    [
      Query.equal("isActive", true),
      Query.equal("collegeId", selectedCollege?.$id || ""),
    ],
    {
      skip: !selectedCollege || !selectedCollege?.$id,
    }
  );

  // --- Sync Refs for Realtime ---
  useEffect(() => {
    if (batchData?.documents) {
      currentBatchIds.current = batchData.documents.map((b) => b.$id);
    }
  }, [batchData]);

  // --- Data Fetching Logic ---
  const fetchAttendanceStats = useCallback(async () => {
    if (!batchData?.documents) return;

    setLoadingStats(true);
    try {
      const data = await Promise.all(
        batchData.documents.map(async (batch) => {
          const studentIds = batch.studentIds || [];
          const userIds = studentIds
            .map((itm) => {
              try {
                return JSON.parse(itm).userId;
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean);

          return await newAttendanceService.getBatchAttendanceByDate(
            batch.$id,
            new Date(),
            userIds.length > 0 ? [Query.equal("userId", userIds)] : []
          );
        })
      );

      const newMap = new Map();
      data.forEach((response, index) => {
        if (response && response.documents) {
          if (response.documents.length > 0) {
            newMap.set(response.documents[0].batchId, response.documents);
          } else {
            newMap.set(batchData.documents[index].$id, []);
          }
        }
      });

      setBatchAttendance(newMap);
    } catch (e) {
      console.error("Error fetching attendance:", e);
    } finally {
      setLoadingStats(false);
    }
  }, [batchData]);

  // Trigger fetch on dependency change
  useEffect(() => {
    fetchAttendanceStats();
  }, [fetchAttendanceStats]);

  // --- Calculation Logic (Memoized) ---
  const dashboardStats = useMemo(() => {
    const defaultStats = {
      trades: [],
      overall: { total: 0, present: 0, absent: 0, percentage: "0.0" },
    };

    if (
      !tradeData?.documents ||
      !batchData?.documents ||
      batchData.documents.length === 0
    ) {
      return defaultStats;
    }

    let globalTotal = 0;
    let globalPresent = 0;
    let globalAbsent = 0;

    const trades = tradeData.documents.map((trade) => {
      const relevantBatches = batchData.documents.filter(
        (batch) => batch.tradeId === trade.$id
      );

      let tradeTotal = 0;
      let tradePresent = 0;
      let tradeAbsent = 0;

      const batches = relevantBatches.map((batch) => {
        const attendance = batchAttendance.get(batch.$id) || [];

        let batchTotal = attendance.length;
        let batchPresent = 0;
        let batchAbsent = 0;

        attendance.forEach((item) => {
          if (item.status === "present") batchPresent++;
          if (item.status === "absent") batchAbsent++;
        });

        tradeTotal += batchTotal;
        tradePresent += batchPresent;
        tradeAbsent += batchAbsent;

        return {
          batchId: batch.$id,
          batchName: batch.BatchName,
          attendance: {
            total: batchTotal,
            present: batchPresent,
            absent: batchAbsent,
            percentage:
              batchTotal > 0
                ? ((batchPresent / batchTotal) * 100).toFixed(1)
                : "0.0",
          },
        };
      });

      globalTotal += tradeTotal;
      globalPresent += tradePresent;
      globalAbsent += tradeAbsent;

      return {
        tradeId: trade.$id,
        tradeName: trade.tradeName,
        batches,
        total: tradeTotal,
        present: tradePresent,
        absent: tradeAbsent,
        percentage:
          tradeTotal > 0
            ? ((tradePresent / tradeTotal) * 100).toFixed(1)
            : "0.0",
      };
    });

    return {
      trades,
      overall: {
        total: globalTotal,
        present: globalPresent,
        absent: globalAbsent,
        percentage:
          globalTotal > 0
            ? ((globalPresent / globalTotal) * 100).toFixed(1)
            : "0.0",
      },
    };
  }, [tradeData, batchData, batchAttendance]);

  // --- Real-time Subscription ---
  useEffect(() => {
    isComponentMountedRef.current = true;

    if (!selectedCollege || !batchData?.documents?.length) {
      return;
    }

    if (subscriptionActive && subscriptionRef.current) {
      return;
    }

    try {
      const client = getPersistentClient();
      const channel = `databases.${conf.databaseId}.collections.${conf.newAttendanceCollectionId}.documents`;

      const unsubscribe = client.subscribe(channel, (response) => {
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

        setBatchAttendance((prevMap) => {
          const newMap = new Map(prevMap);
          const currentBatchDocs = newMap.get(document.batchId) || [];

          if (isCreate) {
            newMap.set(document.batchId, [...currentBatchDocs, document]);
          } else if (isUpdate) {
            const updatedDocs = currentBatchDocs.map((doc) =>
              doc.$id === document.$id ? document : doc
            );
            newMap.set(document.batchId, updatedDocs);
          } else if (isDelete) {
            const filteredDocs = currentBatchDocs.filter(
              (doc) => doc.$id !== document.$id
            );
            newMap.set(document.batchId, filteredDocs);
          }

          return newMap;
        });
      });

      subscriptionRef.current = unsubscribe;
      subscriptionActive = true;
    } catch (error) {
      console.error("❌ Subscription setup failed:", error);
    }

    return () => {
      isComponentMountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
        subscriptionActive = false;
      }
    };
  }, [selectedCollege, batchData]);

  if (collegeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <GraduationCap
                className="text-blue-600 dark:text-blue-400"
                size={32}
              />
              Attendance Dashboard
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <Calendar
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
                {formattedDate}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                {dayName}
              </span>
            </div>
          </div>

          <div className="w-full md:w-80">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Select College
            </label>
            <Select
              value={selectedCollege?.$id || ""}
              onValueChange={(id) => {
                const college = collegeData.documents?.find(
                  (item) => item.$id === id
                );
                setSelectedCollege(college);
                setBatchAttendance(new Map()); // Clear old data
              }}
            >
              <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Select a college" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                {collegeData?.documents.map((college) => (
                  <SelectItem
                    key={college.$id}
                    value={String(college.$id)}
                    className="focus:bg-slate-100 dark:focus:bg-slate-700 dark:text-slate-100"
                  >
                    {college.collageName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-800 text-white border-0 shadow-lg">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs md:text-sm font-medium opacity-90 flex items-center gap-1.5">
                <Users size={16} className="shrink-0" />
                <span className="truncate">Total Students</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {dashboardStats.overall.total}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-800 text-white border-0 shadow-lg">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs md:text-sm font-medium opacity-90 flex items-center gap-1.5">
                <UserCheck size={16} className="shrink-0" />
                <span className="truncate">Present</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {dashboardStats.overall.present}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-800 text-white border-0 shadow-lg">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs md:text-sm font-medium opacity-90 flex items-center gap-1.5">
                <UserX size={16} className="shrink-0" />
                <span className="truncate">Absent</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {dashboardStats.overall.absent}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-800 text-white border-0 shadow-lg">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs md:text-sm font-medium opacity-90 flex items-center gap-1.5">
                <TrendingUp size={16} className="shrink-0" />
                <span className="truncate">Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {dashboardStats.overall.percentage}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trade-wise Attendance */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Trade-wise Attendance
          </h2>

          {loadingStats && (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              Loading attendance data...
            </div>
          )}

          {!loadingStats &&
            dashboardStats.trades.length === 0 &&
            selectedCollege && (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                No batch data available for this college.
              </div>
            )}

          {!loadingStats &&
            dashboardStats.trades.map((trade, idx) => (
              <Card
                key={trade.tradeId || idx}
                className="shadow-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors"
              >
                <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <GraduationCap size={24} />
                    {trade.tradeName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {trade.batches.map((batch, bIdx) => {
                      const present = batch.attendance.present || 0;
                      const total = batch.attendance.total || 0;
                      const absent = batch.attendance.absent || 0;
                      const batchPercentage = batch.attendance.percentage;

                      const statusColor =
                        parseFloat(batchPercentage) >= 90
                          ? "green"
                          : parseFloat(batchPercentage) >= 75
                          ? "yellow"
                          : "red";

                      return (
                        <div
                          key={batch.batchId || bIdx}
                          className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-lg p-3 md:p-4 hover:shadow-lg transition-all"
                        >
                          <div className="flex justify-between items-start mb-2 md:mb-3">
                            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">
                              {batch.batchName}
                            </h3>
                            <span
                              className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold ${
                                statusColor === "green"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                  : statusColor === "yellow"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                              }`}
                            >
                              {batchPercentage}%
                            </span>
                          </div>

                          <div className="space-y-1.5 md:space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                                <UserCheck
                                  size={14}
                                  className="text-green-600 dark:text-green-500"
                                />
                                <span className="truncate">Present</span>
                              </span>
                              <span className="font-bold text-xl md:text-2xl text-green-700 dark:text-green-500">
                                {present}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                                <UserX
                                  size={14}
                                  className="text-red-600 dark:text-red-500"
                                />
                                <span className="truncate">Absent</span>
                              </span>
                              <span className="font-bold text-xl md:text-2xl text-red-700 dark:text-red-500">
                                {absent}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-1.5 md:pt-2 border-t border-slate-200 dark:border-slate-800">
                              <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                                <Users
                                  size={14}
                                  className="text-blue-600 dark:text-blue-500"
                                />
                                <span className="truncate">Total</span>
                              </span>
                              <span className="font-bold text-xl md:text-2xl text-blue-700 dark:text-blue-500">
                                {total}
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 md:mt-3 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 md:h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                statusColor === "green"
                                  ? "bg-green-500 dark:bg-green-600"
                                  : statusColor === "yellow"
                                  ? "bg-yellow-500 dark:bg-yellow-600"
                                  : "bg-red-500 dark:bg-red-600"
                              }`}
                              style={{ width: `${batchPercentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {trade.batches.length === 0 && (
                      <div className="col-span-full text-center text-sm text-slate-500 dark:text-slate-400 py-4">
                        No active batches found for this trade.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
