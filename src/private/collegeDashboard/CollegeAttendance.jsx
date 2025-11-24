import React, { useEffect, useState } from "react";
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
import {
  useListCollegesQuery,
} from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { useListBatchesQuery } from "@/store/api/batchApi";
import { Query } from "appwrite";
import { newAttendanceService } from "@/appwrite/newAttendanceService";

const AttendanceDashboard = () => {
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [statsData, setStatsData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

  // 1. Fetch Colleges
  const {
    data: collegeData,
    isLoading: collegeLoading,
  } = useListCollegesQuery();

  // 2. Fetch Trades (Dependent on Selected College)
  const {
    data: tradeData,
    isLoading: tradeLoading,
  } = useListTradesQuery([Query.equal("$id", selectedCollege?.tradeIds || [])], {
    skip:
      !selectedCollege ||
      !selectedCollege?.tradeIds ||
      selectedCollege?.tradeIds.length === 0,
  });

  // 3. Fetch Batches (Dependent on Selected College)
  const {
    data: batchData,
    isLoading: batchLoading,
  } = useListBatchesQuery(
    [
      Query.equal("isActive", true),
      Query.equal("collegeId", selectedCollege?.$id || ""),
    ],
    {
      skip: !selectedCollege || !selectedCollege?.$id,
    }
  );

  // 4. Transform and Fetch Daily Stats
  const fetchAttendanceStats = async () => {
    if (!batchData?.documents || !tradeData?.documents) return;
    
    setLoadingStats(true);
    try {
      const batchIds = batchData?.documents?.map((batch) => batch.$id);
      const studentIds = batchData?.documents?.reduce((acc, batch) => {
        acc[batch.$id] = batch.studentIds.map((id) => JSON.parse(id).userId);
        return acc;
      }, {});
  
      // Fetch stats from service
      const res = await newAttendanceService.getBatchStatsByDate(
        batchIds,
        studentIds,
        new Date()
      );

      // Format data by grouping batches under their trades
      const formattedData = tradeData.documents.map((trade) => {
        // Find all batches belonging to this trade
        const tradeBatches = batchData.documents
          .filter((batch) => batch.tradeId === trade.$id)
          .map((batch) => {
            // Get attendance stats for this batch
            const attendanceStats = res[batch.$id] || {
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
              holiday: 0,
              percentage: 0,
            };

            return {
              batchId: batch.$id,
              batchName: batch.BatchName, // Ensure this matches Appwrite field
              attendance: {
                present: attendanceStats.present,
                absent: attendanceStats.absent,
                total: attendanceStats.total,
                late: attendanceStats.late,
                holiday: attendanceStats.holiday,
                percentage: attendanceStats.percentage,
              },
            };
          });

        return {
          tradeId: trade.$id,
          tradeName: trade.tradeName,
          batches: tradeBatches,
        };
      });

      setStatsData(formattedData);
    } catch (error) {
      console.log(error);     
      // Optional: Add toast notification here
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchAttendanceStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchData, tradeData]); // Run when batch or trade data updates

  // 5. Calculate Overall Header Statistics from statsData
  const calculateStats = () => {
    if (!statsData || statsData.length === 0) {
      return { total: 0, present: 0, absent: 0, percentage: 0 };
    }

    let total = 0,
      present = 0,
      absent = 0;

    statsData.forEach((trade) => {
      trade.batches.forEach((batch) => {
        total += batch.attendance.total || 0;
        present += batch.attendance.present || 0;
        absent += batch.attendance.absent || 0;
      });
    });

    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    return { total, present, absent, percentage };
  };

  const stats = calculateStats();

  if (collegeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <GraduationCap className="text-blue-600" size={32} />
              Attendance Dashboard
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                {dayName}
              </span>
            </div>
          </div>

          <div className="w-full md:w-80">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Select College
            </label>
            <Select
              value={selectedCollege?.$id}
              onValueChange={(id) => {
                const college = collegeData.documents?.find((item) => item.$id === id);
                setSelectedCollege(college);
                setStatsData([]); // Clear old stats on change
              }}
            >
              <SelectTrigger className="w-full bg-white border-slate-300">
                <SelectValue placeholder="Select a college" />
              </SelectTrigger>
              <SelectContent>
                {collegeData?.documents.map((college) => (
                  <SelectItem key={college.$id} value={String(college.$id)}>
                    {college.collageName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs md:text-sm font-medium opacity-90 flex items-center gap-1.5">
                <Users size={16} className="shrink-0" />
                <span className="truncate">Total Students</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs md:text-sm font-medium opacity-90 flex items-center gap-1.5">
                <UserCheck size={16} className="shrink-0" />
                <span className="truncate">Present</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {stats.present}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs md:text-sm font-medium opacity-90 flex items-center gap-1.5">
                <UserX size={16} className="shrink-0" />
                <span className="truncate">Absent</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {stats.absent}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs md:text-sm font-medium opacity-90 flex items-center gap-1.5">
                <TrendingUp size={16} className="shrink-0" />
                <span className="truncate">Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {stats.percentage}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trade-wise Attendance */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">
            Trade-wise Attendance
          </h2>
          
          {loadingStats && (
             <div className="text-center py-10 text-slate-500">Loading attendance data...</div>
          )}

          {!loadingStats && statsData.length === 0 && selectedCollege && (
             <div className="text-center py-10 text-slate-500">No batch data available for this college.</div>
          )}

          {!loadingStats && statsData.map((trade, idx) => (
            <Card
              key={trade.tradeId || idx}
              className="shadow-md border border-slate-200 overflow-hidden"
            >
              <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
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
                    
                    const batchPercentage = total > 0 
                        ? ((present / total) * 100).toFixed(1) 
                        : "0.0";

                    const statusColor =
                      parseFloat(batchPercentage) >= 90
                        ? "green"
                        : parseFloat(batchPercentage) >= 75
                        ? "yellow"
                        : "red";

                    return (
                      <div
                        key={batch.batchId || bIdx}
                        className="bg-white border-2 border-slate-200 rounded-lg p-3 md:p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2 md:mb-3">
                          <h3 className="text-base md:text-lg font-bold text-slate-800">
                            {batch.batchName}
                          </h3>
                          <span
                            className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold ${
                              statusColor === "green"
                                ? "bg-green-100 text-green-800"
                                : statusColor === "yellow"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {batchPercentage}%
                          </span>
                        </div>

                        <div className="space-y-1.5 md:space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs md:text-sm text-slate-600 flex items-center gap-1.5 shrink-0">
                              <UserCheck size={14} className="text-green-600" />
                              <span className="truncate">Present</span>
                            </span>
                            <span className="font-bold text-xl md:text-2xl text-green-700">
                              {present}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs md:text-sm text-slate-600 flex items-center gap-1.5 shrink-0">
                              <UserX size={14} className="text-red-600" />
                              <span className="truncate">Absent</span>
                            </span>
                            <span className="font-bold text-xl md:text-2xl text-red-700">
                              {absent}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 md:pt-2 border-t border-slate-200">
                            <span className="text-xs md:text-sm text-slate-600 flex items-center gap-1.5 shrink-0">
                              <Users size={14} className="text-blue-600" />
                              <span className="truncate">Total</span>
                            </span>
                            <span className="font-bold text-xl md:text-2xl text-blue-700">
                              {total}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2 md:mt-3 bg-slate-200 rounded-full h-1.5 md:h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              statusColor === "green"
                                ? "bg-green-500"
                                : statusColor === "yellow"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${batchPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {trade.batches.length === 0 && (
                     <div className="col-span-full text-center text-sm text-slate-500 py-4">
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