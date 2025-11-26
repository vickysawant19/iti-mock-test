import React, {
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
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isAdmin = user?.labels?.includes("admin");

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

  // Effect to set default college for non-admins (Teachers)
  useEffect(() => {
    if (
      !collegeLoading &&
      collegeData?.documents &&
      !isAdmin &&
      profile?.collegeId
    ) {
      const teacherCollege = collegeData.documents.find(
        (c) => c.$id === profile.collegeId
      );
      if (teacherCollege) {
        setSelectedCollege(teacherCollege);
      }
    }
  }, [collegeData, collegeLoading, isAdmin, profile]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 pb-20">
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                <GraduationCap className="text-white" size={32} />
              </div>
              Attendance Dashboard
            </h1>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400 pl-1">
              <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                <Calendar
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
                {formattedDate}
              </span>
              <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                {dayName}
              </span>
            </div>
          </div>

          <div className="w-full md:w-80">
            {isAdmin ? (
              <>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block ml-1">
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
                  <SelectTrigger className="w-full h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Select a college" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700 rounded-xl">
                    {collegeData?.documents.map((college) => (
                      <SelectItem
                        key={college.$id}
                        value={String(college.$id)}
                        className="focus:bg-slate-50 dark:focus:bg-slate-700 dark:text-slate-100 rounded-lg my-1 cursor-pointer"
                      >
                        {college.collageName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                  Viewing data for:
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {selectedCollege?.collageName || "Loading..."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Users size={14} />
                </div>
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {dashboardStats.overall.total}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <UserCheck size={14} />
                </div>
                Present
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {dashboardStats.overall.present}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-md text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                  <UserX size={14} />
                </div>
                Absent
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl md:text-3xl font-bold text-rose-600 dark:text-rose-400">
                {dashboardStats.overall.absent}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-500/30 rounded-2xl overflow-hidden group">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-indigo-100 flex items-center gap-2 uppercase tracking-wider">
                <div className="p-1.5 bg-white/20 rounded-md text-white group-hover:scale-110 transition-transform">
                  <TrendingUp size={14} />
                </div>
                Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl md:text-3xl font-bold">
                {dashboardStats.overall.percentage}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trade-wise Attendance */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Trade-wise Performance
            </h2>
          </div>

          {loadingStats && (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Loading attendance data...
              </p>
            </div>
          )}

          {!loadingStats &&
            dashboardStats.trades.length === 0 &&
            selectedCollege && (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                  <GraduationCap size={40} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  No Data Available
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  No batch data available for this college.
                </p>
              </div>
            )}

          {!loadingStats &&
            dashboardStats.trades.map((trade, idx) => (
              <Card
                key={trade.tradeId || idx}
                className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all hover:shadow-md rounded-3xl"
              >
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-4 px-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                      <GraduationCap
                        size={20}
                        className="text-slate-700 dark:text-slate-300"
                      />
                    </div>
                    {trade.tradeName}
                    <span className="ml-auto text-sm font-medium px-3 py-1 bg-white dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                      {trade.batches.length} Batches
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {trade.batches.map((batch, bIdx) => {
                      const present = batch.attendance.present || 0;
                      const total = batch.attendance.total || 0;
                      const absent = batch.attendance.absent || 0;
                      const batchPercentage = batch.attendance.percentage;

                      const statusColor =
                        parseFloat(batchPercentage) >= 90
                          ? "emerald"
                          : parseFloat(batchPercentage) >= 75
                          ? "amber"
                          : "rose";

                      return (
                        <div
                          key={batch.batchId || bIdx}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-all group relative overflow-hidden"
                        >
                          <div
                            className={`absolute top-0 left-0 w-1 h-full bg-${statusColor}-500`}
                          ></div>

                          <div className="flex justify-between items-start mb-4 pl-2">
                            <h3
                              className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1"
                              title={batch.batchName}
                            >
                              {batch.batchName}
                            </h3>
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                statusColor === "emerald"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : statusColor === "amber"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                              }`}
                            >
                              {batchPercentage}%
                            </span>
                          </div>

                          <div className="space-y-3 pl-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                Present
                              </span>
                              <span className="font-bold text-lg text-slate-700 dark:text-slate-200">
                                {present}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                Absent
                              </span>
                              <span className="font-bold text-lg text-slate-700 dark:text-slate-200">
                                {absent}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Total Students
                              </span>
                              <span className="font-bold text-lg text-slate-900 dark:text-white">
                                {total}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {trade.batches.length === 0 && (
                      <div className="col-span-full text-center text-sm text-slate-500 dark:text-slate-400 py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
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
