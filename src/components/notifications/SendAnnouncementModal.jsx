import React, { useState } from "react";
import { Megaphone, AlertTriangle, Send, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectActiveBatch } from "@/store/activeBatchSlice";
import { selectProfile } from "@/store/profileSlice";
import notificationService from "@/services/notification.service";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PRESET_PILLS = [
  "⚡ Exam starts in 10 minutes! Please join test arena.",
  "⏰ Practical class delayed by 15 minutes.",
  "📚 Assignment submission deadline is today at 5:00 PM.",
  "📍 Report to Practical Workshop B immediately.",
  "📣 Revision session starting now in main hall.",
];

export function SendAnnouncementModal({ trigger, customBatch }) {
  const activeBatchFromStore = useSelector(selectActiveBatch);
  const activeBatch = customBatch || activeBatchFromStore;
  const profile = useSelector(selectProfile);

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handlePresetSelect = (presetText) => {
    setMessage(presetText);
    if (presetText.startsWith("⚡") || presetText.startsWith("📍")) {
      setIsUrgent(true);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter an announcement message");
      return;
    }

    if (!activeBatch?.$id) {
      toast.error("No active batch selected to send announcement");
      return;
    }

    setIsSending(true);

    try {
      await notificationService.createAnnouncement({
        message: message.trim(),
        batchId: activeBatch.$id,
        teamId: activeBatch.teamId,
        teacherId: profile?.userId || profile?.$id,
        isUrgent,
      });

      toast.success("📢 Announcement broadcasted to team successfully!");
      setIsOpen(false);
      setMessage("");
      setIsUrgent(false);
    } catch (err) {
      console.error("Failed to send announcement:", err);
      toast.error("Failed to send announcement. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-xs shadow-sm transition-all"
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Send Announcement</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Megaphone className="h-4 w-4" />
            </div>
            <span>Broadcast Team Announcement</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 mt-2">
          {/* Target Batch Info */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Target Batch Team:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activeBatch?.BatchName || "Active Batch"}
            </span>
          </div>

          {/* Preset Pills */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Quick Preset Messages</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PILLS.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(pill)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-950/20"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Field */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Announcement Content
            </label>
            <Textarea
              placeholder="Type your urgent notice or message for the batch..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs min-h-[90px]"
              maxLength={300}
            />
            <div className="mt-1 flex justify-end text-[10px] text-slate-400">
              {message.length}/300
            </div>
          </div>

          {/* Urgent Priority Checkbox */}
          <div className="flex items-center gap-2 rounded-lg border border-red-200/60 bg-red-50/40 p-2.5 dark:border-red-900/40 dark:bg-red-950/10">
            <input
              type="checkbox"
              id="isUrgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="isUrgent" className="flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400 cursor-pointer">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Mark as Urgent Alert (High Priority Red Badge)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isSending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSending || !message.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Broadcast Notice</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SendAnnouncementModal;
