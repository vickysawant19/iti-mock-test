import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Clock, Building, BookOpen, Users, RefreshCw, Edit, LogOut } from "lucide-react";
import { selectProfile, addProfile } from "@/store/profileSlice";
import { selectUser, removeUser } from "@/store/userSlice";
import { removeProfile } from "@/store/profileSlice";
import userProfileService from "@/appwrite/userProfileService";
import authService from "@/appwrite/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";

export default function ApprovalPending() {
  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: collegesData } = useListCollegesQuery();
  const { data: tradesData } = useListTradesQuery();

  const collegeName = collegesData?.documents?.find(
    (c) => c.$id === (profile?.collegeId?.$id || profile?.collegeId)
  )?.collageName || "—";

  const tradeName = tradesData?.documents?.find(
    (t) => t.$id === (profile?.tradeId?.$id || profile?.tradeId)
  )?.tradeName || "—";

  const handleRefresh = async () => {
    if (!user?.$id) return;
    setIsRefreshing(true);
    try {
      const updated = await userProfileService.getUserProfile(user.$id);
      if (updated) {
        dispatch(addProfile({ data: updated, isLoading: false }));
        if (updated.isApproved) {
          toast.success("Your account has been approved! Welcome 🎉");
          navigate("/dash");
        } else if (updated.approvalStatus === "rejected") {
          navigate("/approval-rejected");
        } else {
          toast.info("Still pending approval. Please check back later.");
        }
      }
    } catch {
      toast.error("Could not refresh status.");
    } finally {
      setIsRefreshing(false);
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

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        {/* Animated icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 text-2xl">⏳</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">
          Awaiting Teacher Approval
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">
          Your account has been submitted and is under review by your instructor.
          You'll gain full access once approved.
        </p>

        {/* Profile summary card */}
        <Card className="mb-6 border-amber-200 dark:border-amber-800/40 shadow-sm">
          <CardContent className="pt-5 pb-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Submitted details
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

            {profile?.batchId && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Batch</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {profile.batchId?.BatchName || profile.batchId}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Checking status..." : "Check Approval Status"}
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate("/profile/edit")}
          >
            <Edit className="w-4 h-4" />
            Edit My Details
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

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          If you edited your details, please click "Check Approval Status" after a few moments.
        </p>
      </div>
    </div>
  );
}
