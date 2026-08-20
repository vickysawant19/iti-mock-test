import React, { useState, useEffect } from "react";
import { UserCircle2, IdCard, X } from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmbeddedProfileForm from "@/private/profile/EmbeddedProfileForm";
import EditEnrollmentTab from "../../../../manage-students/EditEnrollmentTab";
import userProfileService from "@/appwrite/userProfileService";

const StudentManagementModal = ({
  viewProfileUserId,
  setViewProfileUserId,
  activeProfileTab,
  setActiveProfileTab,
  selectedStudent,
  effectiveBatchId,
}) => {
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!viewProfileUserId) {
      setProfileData(null);
      return;
    }
    let isMounted = true;
    userProfileService
      .getUserProfile(viewProfileUserId)
      .then((data) => {
        if (isMounted && data) {
          setProfileData(data);
        }
      })
      .catch(() => null);

    return () => {
      isMounted = false;
    };
  }, [viewProfileUserId]);

  const displayEmail =
    selectedStudent?.email ||
    selectedStudent?.userEmail ||
    profileData?.email ||
    "No email";

  const displayRoll =
    selectedStudent?.studentId ||
    selectedStudent?.rollNumber ||
    selectedStudent?.rollNo ||
    profileData?.rollNumber ||
    profileData?.registerId ||
    "N/A";

  const displayName =
    selectedStudent?.userName ||
    selectedStudent?.name ||
    profileData?.userName ||
    "Student Management";

  const avatarSrc = selectedStudent?.profileImage || profileData?.profileImage;

  return (
    <Dialog
      open={!!viewProfileUserId}
      onOpenChange={(open) => {
        if (!open) {
          setViewProfileUserId(null);
          setActiveProfileTab("profile");
        }
      }}
    >
      <DialogContent showCloseButton={false} className="w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 no-scrollbar">
        <DialogHeader className="p-4 sm:p-5 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            
            {/* Selected Student Identity Banner */}
            <div className="flex items-center gap-3 min-w-0">
              <InteractiveAvatar
                src={avatarSrc}
                fallbackText={displayName?.charAt(0) || "S"}
                userId={viewProfileUserId}
                editable={false}
                showStatus={true}
                statusSize="xs"
                className="w-11 h-11 rounded-2xl ring-2 ring-blue-500/20 shadow-md shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </DialogTitle>
                  {selectedStudent?.presenceStatus === "online" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold shrink-0">
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] text-slate-500 shrink-0">
                      {selectedStudent?.status || "Offline"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  Roll No: {displayRoll} • {displayEmail}
                </p>
              </div>
            </div>

            {/* Styled Segmented Control Tabs & Action Controls */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shadow-inner border border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={() => setActiveProfileTab("profile")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeProfileTab === "profile"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <UserCircle2 className="w-3.5 h-3.5" />
                  Profile Details
                </button>
                <button
                  onClick={() => setActiveProfileTab("enrollment")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeProfileTab === "enrollment"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <IdCard className="w-3.5 h-3.5" />
                  Enrollment Record
                </button>
              </div>

              {/* Explicit Modal Close Button (X) */}
              <button
                type="button"
                onClick={() => {
                  setViewProfileUserId(null);
                  setActiveProfileTab("profile");
                }}
                aria-label="Close profile modal"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Tab Body */}
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 min-h-[400px] w-full min-w-0 overflow-x-hidden">
          {viewProfileUserId && activeProfileTab === "profile" && (
            <EmbeddedProfileForm
              explicitUserId={viewProfileUserId}
              defaultBatchId={effectiveBatchId}
              initialData={selectedStudent}
              onSuccess={() => {
                setViewProfileUserId(null);
              }}
              onCancel={() => setViewProfileUserId(null)}
            />
          )}
          {viewProfileUserId && activeProfileTab === "enrollment" && (
            <EditEnrollmentTab
              batchId={effectiveBatchId}
              studentId={viewProfileUserId}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentManagementModal;
