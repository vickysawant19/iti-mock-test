import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Clock, Building, BookOpen, Users, RefreshCw, LogOut, ArrowRight, ShieldAlert } from "lucide-react";

import { selectProfile, addProfile, removeProfile } from "@/store/profileSlice";
import { selectUser, removeUser } from "@/store/userSlice";
import { selectActiveBatchId } from "@/store/activeBatchSlice";
import authService from "@/services/auth.service";
import userProfileService from "@/appwrite/userProfileService";
import batchRequestService from "@/appwrite/batchRequestService";
import studentBatchAccessService from "@/appwrite/studentBatchAccess";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import batchService from "@/appwrite/batchService";

export default function BatchEnrollmentStatus() {
  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);
  const activeBatchId = useSelector(selectActiveBatchId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState("loading");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: collegesData } = useListCollegesQuery();
  const { data: tradesData } = useListTradesQuery();

  const batchId = activeBatchId;
  const [targetBatch, setTargetBatch] = useState(null);

  useEffect(() => {
    if (batchId) {
      batchService.getBatch(batchId).then(setTargetBatch).catch(console.error);
    }
  }, [batchId]);

  const collegeName = collegesData?.documents?.find(
    (c) => c.$id === (targetBatch?.collegeId?.$id || targetBatch?.collegeId)
  )?.collageName || "—";

  const tradeName = tradesData?.documents?.find(
    (t) => t.$id === (targetBatch?.tradeId?.$id || targetBatch?.tradeId)
  )?.tradeName || "—";

  const fetchStatus = async () => {
    if (!user?.$id) return;
    if (!batchId) {
      console.log("[BatchEnrollmentStatus] No batchId found in profile, setting status to MISSING_BATCH");
      setStatus("MISSING_BATCH");
      return;
    }
    setStatus("loading");
    try {
      console.log("[BatchEnrollmentStatus] Checking access for batch:", batchId);
      const currentStatus = await studentBatchAccessService.checkStudentBatchStatus(batchId, user.$id);
      console.log("[BatchEnrollmentStatus] Received status:", currentStatus);
      setStatus(currentStatus);
      if (currentStatus === "ACTIVE") {
        toast.success("Hooray! Your access has been approved.");
        navigate("/dash");
      }
    } catch (err) {
      console.error("[BatchEnrollmentStatus] Error checking status:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    // If router gave us initial state, use it to avoid double-fetching temporarily
    if (location.state?.batchStatus && status === "loading") {
      setStatus(location.state.batchStatus);
      if (location.state.batchStatus === "ACTIVE") navigate("/dash");
    } else {
      fetchStatus();
    }
  }, [batchId, user?.$id]);

  const handleRefresh = async () => {
    setIsProcessing(true);
    // Also quietly refresh REDUX profile in case batchId changed
    try {
      const updated = await userProfileService.getUserProfile(user.$id);
      if (updated) dispatch(addProfile({ data: updated, isLoading: false }));
    } catch {}
    await fetchStatus();
    setIsProcessing(false);
  };

  const handleRequestAccess = async () => {
    if (!batchId || !user?.$id) return;
    setIsProcessing(true);
    try {
      await batchRequestService.sendRequest(batchId, user.$id);
      toast.success("Request sent to instructor successfully.");
      await fetchStatus(); // Will transition to PENDING
    } catch (err) {
      toast.error("Failed to send request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      dispatch(removeUser());
      dispatch(removeProfile());
      navigate("/");
    } catch {
      toast.error("Logout failed.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const renderStatusUI = () => {
    if (status === "loading") {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Checking your batch details...</p>
        </div>
      );
    }

    if (status === "MISSING_BATCH") {
      return (
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-12 h-12 text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No Batch Selected</h1>
          <p className="text-slate-500 text-sm mb-6">You have not requested to join any batches yet. Please browse available batches and select one to join.</p>
          <Button onClick={() => navigate("/browse-batches")} className="w-full bg-blue-600 hover:bg-blue-700 h-10">
            Browse Batches
          </Button>
        </div>
      );
    }

    if (status === "PENDING") {
      return (
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Waiting for Approval</h1>
          <p className="text-slate-500 text-sm">Your instructor is reviewing your request to join this batch.</p>
        </div>
      );
    }

    if (status === "REJECTED") {
      return (
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Request Declined</h1>
          <p className="text-slate-500 text-sm">Your instructor has declined your request to join this batch.</p>
          <Button onClick={handleRequestAccess} disabled={isProcessing} className="mt-4 bg-blue-600">
            Submit New Request <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      );
    }

    if (status === "NOT_REQUESTED") {
      return (
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Batch Enrollment Required</h1>
          <p className="text-slate-500 text-sm mb-6">You need to request access to join this batch and view its contents.</p>
          <Button onClick={handleRequestAccess} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 h-10">
            {isProcessing ? "Sending..." : "Request to Join Batch"}
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        
        {renderStatusUI()}

        {/* Profile Summary Card */}
        <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="pt-5 pb-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Target Enrollment Details
            </h2>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Institute</p>
                <p className="font-medium text-slate-700 dark:text-slate-200">{collegeName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Trade</p>
                <p className="font-medium text-slate-700 dark:text-slate-200">{tradeName}</p>
              </div>
            </div>

            {batchId && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Batch Target</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {targetBatch?.BatchName || "-"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Action Handlers */}
        <div className="space-y-3">
          {status === "PENDING" && (
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
              onClick={handleRefresh}
              disabled={isProcessing}
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Checking status..." : "Check Approval Status"}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
            onClick={() => navigate("/browse-batches")}
          >
            <BookOpen className="w-4 h-4" />
            Browse Other Batches
          </Button>

          <Button
            variant="ghost"
            className="w-full gap-2 text-slate-400 hover:text-red-500"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Logging out..." : "Sign Out"}
          </Button>
        </div>

      </div>
    </div>
  );
}
