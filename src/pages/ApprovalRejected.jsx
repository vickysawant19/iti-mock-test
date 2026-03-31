import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { XCircle, Edit, RefreshCw, LogOut } from "lucide-react";
import { selectProfile, addProfile } from "@/store/profileSlice";
import { selectUser, removeUser } from "@/store/userSlice";
import { removeProfile } from "@/store/profileSlice";
import userProfileService from "@/appwrite/userProfileService";
import authService from "@/appwrite/auth";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function ApprovalRejected() {
  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // After student edits details, they can re-request approval
  const handleReRequest = async () => {
    if (!profile?.$id) return;
    setIsRequesting(true);
    try {
      const updated = await userProfileService.reRequestApproval(profile.$id);
      dispatch(addProfile({ data: updated, isLoading: false }));
      toast.success("Re-approval request submitted!");
      navigate("/approval-pending");
    } catch {
      toast.error("Failed to re-submit request. Please try again.");
    } finally {
      setIsRequesting(false);
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
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Request Not Approved
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
          Your enrollment request was not approved by your instructor.
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-xs mb-8">
          Please review your details (college, trade, batch) and re-submit your request,
          or contact your instructor for more information.
        </p>

        <div className="space-y-3">
          <Button
            className="w-full gap-2"
            variant="outline"
            onClick={() => navigate("/profile/edit")}
          >
            <Edit className="w-4 h-4" />
            Edit My Details
          </Button>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={handleReRequest}
            disabled={isRequesting}
          >
            <RefreshCw className={`w-4 h-4 ${isRequesting ? "animate-spin" : ""}`} />
            {isRequesting ? "Submitting..." : "Re-submit Approval Request"}
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
