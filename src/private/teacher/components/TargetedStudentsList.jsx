import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Loader2, Users, RefreshCw, UserPlus, Building, Calendar, BookOpen } from "lucide-react";
import { selectUser } from "@/store/userSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import userProfileService from "@/appwrite/userProfileService";
import batchRequestService from "@/appwrite/batchRequestService";
import batchStudentService from "@/appwrite/batchStudentService";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";

export default function TargetedStudentsList({ selectedBatch }) {
  const user = useSelector(selectUser);
  const teacherId = user?.$id;

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const { data: collegesData } = useListCollegesQuery();
  const { data: tradesData } = useListTradesQuery();

  const fetchStudents = async () => {
    if (!selectedBatch) {
      setStudents([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Fetch all profiles mapped to this batchId natively
      const profiles = await userProfileService.getProfilesByBatchId(selectedBatch);
      if (profiles.length === 0) {
        setStudents([]);
        return;
      }

      // 2. Fetch existing requests for this batch
      const requests = await batchRequestService.getRequests(selectedBatch);
      const requestedStudentIds = new Set(requests.map(r => r.studentId));

      // 3. Fetch active students in this batch
      const activeStudents = await batchStudentService.getBatchStudents(selectedBatch);
      const activeStudentIds = new Set(activeStudents.map(s => s.studentId));

      // 4. Filter targeted students who have NEITHER requested NOR joined
      const targeted = profiles.filter(
        p => !requestedStudentIds.has(p.userId) && !activeStudentIds.has(p.userId)
      );
      
      setStudents(targeted);
    } catch (err) {
      console.error("TargetedStudentsList: error fetching targeted students:", err);
      toast.error("Failed to load targeted students");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatch) {
      fetchStudents();
    } else {
      setIsLoading(false);
    }
  }, [selectedBatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    setIsRefreshing(false);
  };

  const handleInvite = async (studentId, userName) => {
    if (!studentId || !selectedBatch) return;
    setProcessingId(studentId);
    try {
      await batchRequestService.sendRequest(selectedBatch, studentId);
      toast.success(`Generated request for ${userName || "Student"}!`);
      // Remove from list immediately
      setStudents(prev => prev.filter(s => s.userId !== studentId));
    } catch (error) {
      toast.error("Failed to send batch request");
    } finally {
      setProcessingId(null);
    }
  };

  const displayed = useMemo(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.userName?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, search]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white capitalize">
            Unrequested Students
          </h2>
          {students.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold rounded-full bg-blue-500 text-white">
              {students.length}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search name / email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 px-3 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
          />

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-slate-500 text-sm">Loading…</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-medium text-slate-500 dark:text-slate-400">
            No Unrequested Students
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            All students assigned to this batch have initiated a request.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((student) => {
            const collegeName = collegesData?.documents?.find(
              (c) => c.$id === (student.collegeId?.$id || student.collegeId)
            )?.collageName || "—";
            
            const tradeName = tradesData?.documents?.find(
              (t) => t.$id === (student.tradeId?.$id || student.tradeId)
            )?.tradeName || "—";

            return (
              <Card key={student.$id} className="relative group dark:bg-slate-900 border-slate-200 hover:border-blue-200 dark:border-slate-800 transition-colors shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1 w-full max-w-[85%] pr-2">
                      <h3 className="font-bold text-slate-800 dark:text-white truncate" title={student.userName}>
                        {student.userName || "Unnamed User"}
                      </h3>
                      <p className="text-xs text-slate-500 truncate" title={student.email}>
                        {student.email}
                      </p>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 gap-2.5 mb-5 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={collegeName}>
                        {collegeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={tradeName}>
                        {tradeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                        Joined: {new Date(student.$createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={processingId === student.userId}
                    onClick={() => handleInvite(student.userId, student.userName)}
                  >
                    {processingId === student.userId ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Generate Request
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
