import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Play, Clock, Sparkles, X, CheckCircle2 } from "lucide-react";
import { Functions } from "appwrite";
import { appwriteService } from "@/services/core/appwriteClient";
import conf from "@/config/config";
import notificationService from "@/services/notification/notification.service";

export default function TestAssignedModal({ isOpen, notification, user, onClose }) {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  if (!isOpen || !notification || notification.type !== "mock_test_assigned") return null;

  const handleStartExam = async () => {
    setIsStarting(true);
    try {
      // Mark as read immediately
      if (user?.$id) {
        notificationService.markAsRead(notification.id, user.$id).catch(() => {});
      }

      const data = {
        action: "createNewMockTest",
        userId: user?.$id,
        userName: user?.userName || user?.name || "Student",
        paperId: notification.paperId,
        databaseId: conf.databaseId,
        questionPapersCollectionId: conf.questionPapersCollectionId,
      };

      const functions = new Functions(appwriteService.getClient());
      const res = await functions.createExecution(
        conf.mockTestFunctionId,
        JSON.stringify(data)
      );

      if (res.responseBody) {
        const parsed = JSON.parse(res.responseBody);
        if (parsed.paperId) {
          onClose();
          navigate(`/start-mock-test/${parsed.paperId}`);
          return;
        }
      }
    } catch (err) {
      console.warn("Auto-instantiate student mock test fallback:", err);
    } finally {
      setIsStarting(false);
    }

    onClose();
    navigate(`/attain-test?paperid=${notification.paperId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-2xl shadow-2xl transition-all">
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Test Assignment</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                Exam Assigned
              </h2>
            </div>
          </div>

          {/* Test Details */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 mb-6 space-y-2.5">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {notification.message || "A new practice mock exam is available for your batch."}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Timed Practice</span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span>Instant Score & Analysis</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleStartExam}
              disabled={isStarting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isStarting ? "Preparing Exam..." : "Take Test Now"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              I will take it later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
