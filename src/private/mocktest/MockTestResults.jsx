import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Trophy,
  Download,
  Search,
  Filter,
  Users,
  Award,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Medal,
  MoreVertical,
  Trash2,
  Eye,
  Share2,
  Lock,
  Unlock,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { toast } from "react-toastify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import mockTestService from "@/services/mocktest.service";
import userProfileService from "@/appwrite/userProfileService";
import profileImageService from "@/appwrite/profileImageService";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { Query, Channel } from "appwrite";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import Loader from "@/components/components/Loader";
import { realtime } from "@/services/appwriteClient";
import conf from "@/config/config";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatName = (name = "") =>
  name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const fixProfileImage = (url) => {
  if (!url) return url;
  // Replace both cloud.appwrite.io and any localhost proxy URLs with the production endpoint
  let newUrl = url.replace("cloud.appwrite.io", "auth.itimitra.in");

  // // Specifically catch localhost (e.g. from Vite dev server config) and redirect to production
  // if (newUrl.includes("localhost:")) {
  //   newUrl = newUrl.replace(/https?:\/\/localhost:\d+/g, "https://auth.itimitra.in");
  // }
  return newUrl;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

const medalColors = {
  1: {
    bg: "bg-yellow-400",
    text: "text-yellow-900",
    ring: "ring-yellow-400",
    label: "🥇",
  },
  2: {
    bg: "bg-gray-300",
    text: "text-gray-800",
    ring: "ring-gray-300",
    label: "🥈",
  },
  3: {
    bg: "bg-amber-600",
    text: "text-amber-100",
    ring: "ring-amber-600",
    label: "🥉",
  },
};

// ─── Live time display hook ────────────────────────────────────────────────────
// Calculates both elapsed and remaining time based on startTime and totalMinutes.
// Updates every 30s to keep the UI fresh without performance hits.
const useTimeDisplay = (startTime, totalMinutes) => {
  const calc = () => {
    if (!startTime) return { elapsedStr: null, remainingStr: null };
    const elapsedSecs = Math.max(
      0,
      Math.floor((Date.now() - new Date(startTime).getTime()) / 1000),
    );

    const eh = Math.floor(elapsedSecs / 3600);
    const em = Math.floor((elapsedSecs % 3600) / 60);
    const elapsedStr = eh > 0 ? `${eh} h ${em} min` : `${em} min`;

    if (totalMinutes) {
      const totalSecs = totalMinutes * 60;
      const remSecs = Math.max(0, totalSecs - elapsedSecs);
      const isTimeUp = elapsedSecs >= totalSecs + 60; // 1-minute grace period before forcing submit
      const rh = Math.floor(remSecs / 3600);
      const rm = Math.floor((remSecs % 3600) / 60);
      const remainingStr = rh > 0 ? `${rh}h ${rm}m left` : `${rm}m left`;
      return { elapsedStr, remainingStr, isTimeUp };
    }
    return { elapsedStr, remainingStr: null, isTimeUp: false };
  };

  const [time, setTime] = React.useState(calc);
  React.useEffect(() => {
    if (!startTime) return;
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 30_000);
    return () => clearInterval(id);
  }, [startTime, totalMinutes]);

  return time;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, iconClass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
    >
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
      )}
    </div>
  </div>
);

// ─── Student Row ──────────────────────────────────────────────────────────────
const StudentRow = ({ result, index, isMe, quesCount, isTeacher, canSeeScores, onPreview, onExtendTime, onDelete }) => {
  const rank = index + 1;
  const medal = medalColors[rank];
  const score = result.score ?? 0;
  const isLive = !result.submitted && result.startTime;
  const { elapsedStr, remainingStr, isTimeUp } = useTimeDisplay(
    isLive ? result.startTime : null,
    result.totalMinutes,
  );

  React.useEffect(() => {
    if (isLive && isTimeUp) {
      const autoSubmit = async () => {
        try {
          const expectedEndTime = new Date(new Date(result.startTime).getTime() + result.totalMinutes * 60000).toISOString();
          await mockTestService.updateRow(result.$id, {
            submitted: true,
            endTime: expectedEndTime
          });
        } catch (e) {
          console.error("Auto-submit failed for", result.$id, e);
        }
      };
      autoSubmit();
    }
  }, [isLive, isTimeUp, result.$id, result.startTime, result.totalMinutes]);
  // scorePct drives colour; progressPct drives bar width
  const scorePct = quesCount > 0 ? Math.round((score / quesCount) * 100) : 0;
  const answered = result.answeredCount ?? score; // fallback to score if field not yet stored
  const progressPct =
    quesCount > 0 ? Math.round((answered / quesCount) * 100) : 0;

  const barColor = result.submitted
    ? scorePct >= 70
      ? "bg-green-500"
      : scorePct >= 40
        ? "bg-amber-500"
        : "bg-red-500"
    : "bg-blue-400";

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden
        ${
          isMe
            ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700"
            : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600"
        }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Rank */}
        <div className="w-8 shrink-0 text-center">
          {medal ? (
            <span className="text-xl leading-none">{medal.label}</span>
          ) : (
            <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
              #{rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <div
          className={`w-9 h-9 shrink-0 ring-2 rounded-full ${medal ? medal.ring : "ring-gray-200 dark:ring-gray-600"}`}
        >
          <InteractiveAvatar
            src={result.profileImage}
            fallbackText={getInitials(result.userName) || "U"}
            userId={result.userId}
            editable={false}
            className="w-9 h-9"
          />
        </div>

        {/* Name + time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {result.submitted && (canSeeScores || isMe) ? (
              <Link
                to={`/show-mock-test/${result.$id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1 truncate"
              >
                {formatName(result.userName)}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </Link>
            ) : (
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                {formatName(result.userName)}
              </span>
            )}
            {isMe && (
              <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                You
              </span>
            )}
            {isLive && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 animate-pulse">
                ● Live
              </span>
            )}
          </div>
          {result.submitted && result.endTime ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {format(new Date(result.endTime), "dd MMM, hh:mm a")}
            </p>
          ) : result.startTime ? (
            <p className="text-xs text-blue-400 dark:text-blue-500 mt-0.5">
              Started at {format(new Date(result.startTime), "hh:mm a")} · In progress · {elapsedStr ?? "0 min"}
              {remainingStr && (
                <span className="text-blue-300 dark:text-blue-600 ml-1">
                  ({remainingStr})
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs text-amber-500 mt-0.5">Not started</p>
          )}
        </div>

        {/* Score */}
        <div className="shrink-0 text-right">
          <div className="flex items-baseline gap-0.5">
            {canSeeScores || (isMe && result.submitted) ? (
              <>
                <span
                  className={`text-base font-bold ${
                    scorePct >= 70
                      ? "text-green-600 dark:text-green-400"
                      : scorePct >= 40
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {score}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  /{quesCount ?? "—"}
                </span>
              </>
            ) : (
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {result.submitted
              ? `${result.timeTaken ?? 0} min`
              : isLive
                ? `${answered}/${quesCount} attempted`
                : "—"}
          </div>
        </div>

        {/* Status pill & Admin Actions */}
        <div className="shrink-0 flex items-center gap-2">
          {result.submitted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline">Done</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              <XCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Pending</span>
            </span>
          )}
          {isTeacher && (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onPreview(result.$id)} className="cursor-pointer">
                  <Eye className="w-4 h-4 mr-2 text-gray-500" /> View Paper
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExtendTime(result)} className="cursor-pointer">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" /> Extend Time
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(result.$id)} className="cursor-pointer text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Result
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Progress bar — width = attempted/total, colour = correct/total */}
      <div className="h-1 w-full bg-gray-100 dark:bg-gray-700">
        <div
          className={`h-full transition-all duration-700 ease-out ${barColor} ${isLive ? "opacity-80" : ""}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MockTestResults = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [previewId, setPreviewId] = useState(null);
  const [extendState, setExtendState] = useState(null);
  const [newMinutes, setNewMinutes] = useState(0);
  const [teacherResult, setTeacherResult] = useState(null);
  const [paperData, setPaperData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingProtection, setIsTogglingProtection] = useState(false);
  const [copied, setCopied] = useState(false);
  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);
  const isTeacher = user?.labels?.includes("Teacher") || false;

  useEffect(() => {
    let isInitialLoadDone = false;
    let eventQueue = [];
    let processQueue = null;
    let isMounted = true;

    const getData = async () => {
      try {
        try {
          const pData = await mockTestService.fetchPaperById(paperId);
          setPaperData(pData);
        } catch (e) {
          console.error("Failed to fetch paper data:", e);
        }

        const res = await mockTestService.getUserResults(paperId);

        // Compute teacher's own result from RAW data before any isOriginal filter.
        // The teacher's own paper may have isOriginal:true (they took the test on
        // the original document), so we must check the unfiltered list.
        const teacherOwn = (res ?? []).find(
          (r) => r.userId === profile?.userId,
        );
        if (teacherOwn) {
          teacherOwn.timeTaken =
            teacherOwn.endTime && teacherOwn.startTime
              ? differenceInMinutes(
                  new Date(teacherOwn.endTime),
                  new Date(teacherOwn.startTime),
                )
              : 0;
        }

        const baseResults = (res ?? [])
          .map((item) => ({
            timeTaken: item.endTime && item.startTime ? differenceInMinutes(
              new Date(item.endTime),
              new Date(item.startTime),
            ) : 0,
            ...item,
          }))
          .filter((item) => !item.isOriginal)
          .sort(
            (a, b) =>
              b.score - a.score ||
              a.timeTaken - b.timeTaken ||
              new Date(a.endTime) - new Date(b.endTime),
          );

        // Collect all unique user IDs (students + teacher)
        const allUserIds = [
          ...new Set(
            [...baseResults.map((r) => r.userId), teacherOwn?.userId].filter(
              Boolean,
            ),
          ),
        ];

        // Fetch all profile picture URLs from userProfiles collection in one shot (Optimized!)
        let profileImageMap = new Map();
        if (allUserIds.length > 0) {
          try {
            // Using Query.equal with array of IDs is much faster than N bucket list API calls
            const profiles = await userProfileService.getBatchUserProfile([
              Query.equal("userId", allUserIds),
            ]);
            profiles.forEach((p) => {
              if (p.profileImage) {
                profileImageMap.set(p.userId, fixProfileImage(p.profileImage));
              }
            });
          } catch (e) {
            console.warn(
              "Optimized profile image fetch failed, falling back to bucket API:",
              e,
            );
            try {
              profileImageMap =
                await profileImageService.getBulkProfileUrls(allUserIds);
            } catch (fallbackError) {
              console.warn("Fallback bucket fetch also failed:", fallbackError);
            }
          }
        }

        if (teacherOwn) {
          setTeacherResult({
            ...teacherOwn,
            profileImage: fixProfileImage(
              profileImageMap.get(teacherOwn.userId) || teacherOwn.profileImage,
            ),
          });
        } else {
          setTeacherResult(null);
        }

        setData(
          baseResults.map((r) => ({
            ...r,
            profileImage: fixProfileImage(
              profileImageMap.get(r.userId) || r.profileImage,
            ),
          })),
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
        isInitialLoadDone = true;
        if (processQueue) processQueue();
      }
    };

    // ── Realtime leaderboard — server-side filtered ──────────────────────────────
    // Channel: only rows in the questionPaperData table
    // Queries: server filters to this paperId only, and excludes the original template
    const rtChannel = Channel.tablesdb(conf.databaseId)
      .table(conf.questionPapersCollectionId)
      .row();

    let unsubFn = null;

    const setupRealtime = async () => {
      console.log(
        "[Realtime] Subscribing to channel:",
        rtChannel,
        "paperId:",
        paperId,
      );

      const handleEvent = (response) => {
        if (!isInitialLoadDone) {
          console.log("[RT] Queuing event", response.payload?.$id);
          eventQueue.push(response);
          return;
        }

        const doc = response.payload;
        if (!doc) return;

        console.log(
          "[RT] event paperId:",
          doc.paperId,
          "| isOriginal:",
          doc.isOriginal,
          "| score:",
          doc.score,
          "| answeredCount:",
          doc.answeredCount,
          "| $id:",
          doc.$id,
        );

        // Client-side paperId filter (needed when server-side filtering not active)
        if (doc.paperId !== paperId) {
          console.log("[RT] ignored — different paperId");
          return;
        }

        const isDelete = response.events && response.events.some((e) => e.includes(".delete"));
        if (isDelete) {
          if (doc.isOriginal) {
            setTeacherResult((prev) => (prev?.$id === doc.$id ? null : prev));
          } else {
            setData((prev) => prev.filter((r) => r.$id !== doc.$id));
          }
          return;
        }

        // Update teacher's own result (includes isOriginal docs)
        setTeacherResult((prev) => {
          if (prev && prev.$id === doc.$id) {
            const timeTaken =
              doc.endTime && doc.startTime
                ? differenceInMinutes(
                    new Date(doc.endTime),
                    new Date(doc.startTime),
                  )
                : (prev.timeTaken ?? 0);
            // Preserve profileImage, or use the incoming one (fixed domain) if missing
            const newImage =
              fixProfileImage(doc.profileImage) || prev.profileImage;
            console.log(
              "[RT] teacherResult updated → score:",
              doc.score,
              "timeTaken:",
              timeTaken,
            );
            return { ...prev, ...doc, timeTaken, profileImage: newImage };
          }
          return prev;
        });

        // Student leaderboard — exclude original paper (client-side only)
        if (doc.isOriginal) {
          console.log("[RT] skipped for leaderboard — isOriginal true");
          return;
        }

        setData((prev) => {
          const timeTaken =
            doc.endTime && doc.startTime
              ? differenceInMinutes(
                  new Date(doc.endTime),
                  new Date(doc.startTime),
                )
              : 0;
          const idx = prev.findIndex((r) => r.$id === doc.$id);

          const safeSort = (a, b) => {
            const scoreDiff = (b.score || 0) - (a.score || 0);
            if (scoreDiff !== 0) return scoreDiff;
            const timeDiff = (a.timeTaken || 0) - (b.timeTaken || 0);
            if (timeDiff !== 0) return timeDiff;
            const endA = a.endTime ? new Date(a.endTime).getTime() : 0;
            const endB = b.endTime ? new Date(b.endTime).getTime() : 0;
            return endA - endB;
          };

          if (idx === -1) {
            // New entry: fix URL if present
            const updated = {
              ...doc,
              timeTaken,
              profileImage: fixProfileImage(doc.profileImage),
            };

            // Fetch profile image asynchronously since questionPapers doesn't store it
            if (doc.userId) {
              userProfileService.getUserProfile(doc.userId).then(profile => {
                if (profile && profile.profileImage) {
                  setData(current => current.map(r => 
                    r.$id === doc.$id ? { ...r, profileImage: fixProfileImage(profile.profileImage) } : r
                  ));
                }
              }).catch(() => {});
            }

            return [...prev, updated].sort(safeSort);
          } else {
            // Existing entry: keep the profile image from previous state so it doesn't wipe
            const newImage =
              fixProfileImage(doc.profileImage) || prev[idx].profileImage;
            const updated = { ...doc, timeTaken, profileImage: newImage };
            return prev
              .map((r, i) => (i === idx ? updated : r))
              .sort(safeSort);
          }
        });
      };

      processQueue = () => {
        if (eventQueue.length > 0) {
          console.log(`[RT] Processing ${eventQueue.length} queued events.`);
          eventQueue.forEach(handleEvent);
          eventQueue = [];
        }
      };

      // realtime.subscribe (async) returns {unsubscribe: fn};
      // older client.subscribe (sync) returns a plain function.
      // Normalise to a callable.
      const toUnsub = (result) => {
        if (typeof result === "function") return result;
        if (result && typeof result.unsubscribe === "function")
          return result.unsubscribe.bind(result);
        return null;
      };

      try {
        // Server-side: filter by paperId ONLY — NOT by isOriginal.
        // If we also filtered isOriginal:false, the teacher's own paper
        // (isOriginal:true) would never fire an event.
        // The isOriginal distinction is handled client-side in handleEvent.
        const sub = await realtime.subscribe(rtChannel, handleEvent, [
          Query.equal("paperId", [paperId]),
        ]);
        console.log("[RT] subscribed with server-side paperId filter.", sub);
        unsubFn = toUnsub(sub);
        if (!isMounted && unsubFn) unsubFn();
      } catch (err) {
        console.warn(
          "[RT] server-side filter failed, plain subscribe:",
          err?.message,
        );
        try {
          const sub = await realtime.subscribe(rtChannel, handleEvent);
          unsubFn = toUnsub(sub);
          console.log("[RT] subscribed (plain, client-side filter).");
          if (!isMounted && unsubFn) unsubFn();
        } catch (err2) {
          console.error("[RT] both subscribe attempts failed:", err2?.message);
        }
      }
    };

    setupRealtime();
    getData();

    let hiddenAt = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (document.visibilityState === "visible") {
        // Only refetch if the tab was hidden for more than 30 seconds
        if (hiddenAt && Date.now() - hiddenAt > 30000) {
          console.log("[App] Tab was hidden for >30s, refetching data to catch up...");
          getData();
        }
        hiddenAt = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (typeof unsubFn === "function") unsubFn();
    };
  }, [paperId]);

  const filteredData = useMemo(() => {
    let filtered = data.filter((item) =>
      (item.userName || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (filterStatus === "submitted")
      filtered = filtered.filter((i) => i.submitted);
    else if (filterStatus === "not-submitted")
      filtered = filtered.filter((i) => !i.submitted);
    return filtered;
  }, [data, searchQuery, filterStatus]);

  const canSeeOthersDetails = useMemo(() => {
    if (isTeacher) return true;
    // Current student can see others' results ONLY if they have submitted their own paper
    return data.some(r => r.userId === profile?.userId && r.submitted);
  }, [data, isTeacher, profile?.userId]);

  const stats = useMemo(() => {
    const submitted = data.filter((i) => i.submitted);
    const avgScore =
      submitted.length > 0
        ? (
            submitted.reduce((s, i) => s + i.score, 0) / submitted.length
          ).toFixed(1)
        : 0;
    const avgTime =
      submitted.length > 0
        ? (
            submitted.reduce((s, i) => s + i.timeTaken, 0) / submitted.length
          ).toFixed(1)
        : 0;
    const topScore =
      submitted.length > 0 ? Math.max(...submitted.map((i) => i.score)) : 0;
    // Use first student row, then teacher's result, then 0 — never fall back to a magic number
    const quesCount = data[0]?.quesCount ?? teacherResult?.quesCount ?? 0;
    return {
      total: data.length,
      submitted: submitted.length,
      notSubmitted: data.length - submitted.length,
      avgScore,
      avgTime,
      topScore,
      quesCount,
      completionPct:
        data.length > 0
          ? ((submitted.length / data.length) * 100).toFixed(0)
          : 0,
    };
  }, [data, teacherResult]);

  // Teacher's own result — derived from raw results (before isOriginal filter)
  // so it works even when the teacher took the test on the original document.
  const myResult = isTeacher ? teacherResult : null;
  // Live elapsed time for the teacher's own in-progress card
  const { elapsedStr: tElapsed, remainingStr: tRemaining, isTimeUp: tIsTimeUp } = useTimeDisplay(
    myResult && !myResult.submitted ? myResult.startTime : null,
    myResult?.totalMinutes,
  );

  React.useEffect(() => {
    if (myResult && !myResult.submitted && myResult.startTime && tIsTimeUp) {
      const autoSubmit = async () => {
        try {
          const expectedEndTime = new Date(new Date(myResult.startTime).getTime() + myResult.totalMinutes * 60000).toISOString();
          await mockTestService.updateRow(myResult.$id, {
            submitted: true,
            endTime: expectedEndTime
          });
        } catch (e) {
          console.error("Auto-submit failed for teacher", myResult.$id, e);
        }
      };
      autoSubmit();
    }
  }, [myResult, tIsTimeUp]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this result?")) return;
    try {
      await mockTestService.deleteRow(id);
      toast.success("Result deleted successfully");
      // Note: RT will catch the .delete event and remove it from state.
    } catch (err) {
      toast.error(err.message || "Failed to delete result");
    }
  };

  const handleExtendTimeSubmit = async () => {
    if (!extendState) return;
    try {
      await mockTestService.updateRow(extendState.id, { totalMinutes: newMinutes });
      toast.success("Time extended successfully");
      setExtendState(null);
    } catch (err) {
      toast.error(err.message || "Failed to extend time");
    }
  };

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Rank,Name,Score,Time Taken (min),Status,Submitted At"]
        .concat(
          filteredData.map((res, i) => {
            const timeTaken = res.submitted ? res.timeTaken : "Not Submitted";
            const submittedAt = res.submitted
              ? format(
                  new Date(res.endTime || res.$updatedAt),
                  "dd/MM/yyyy hh:mm a",
                )
              : "Not Submitted";
            return `${i + 1},"${res.userName}",${res.score},${timeTaken},${
              res.submitted ? "Submitted" : "Not Submitted"
            },"${submittedAt}"`;
          }),
        )
        .join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `mock_test_results_${paperId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    const examUrl = `${window.location.origin}/attain-test?paperid=${paperId}`;
    const shareText = `🎉 *_MSQs Exam Paper_* 🎉\n\n_Hey there!_\n_Check out this Exam Paper_\n Paper ID: *${paperId}*\n\n📚 *Trade:* ${paperData?.tradeName || "Unknown"}\n💯 *Total Questions:* ${stats.quesCount}\n⏳ *Duration:* ${paperData?.totalMinutes || 0} Minutes\n\n👉 Click the link below to get started:\n${examUrl}\n\n*Remember to submit on complete!*\n\n Good luck and happy Exam!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mock Test Paper", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleCopyMessage = async () => {
    const examUrl = `${window.location.origin}/attain-test?paperid=${paperId}`;
    const shareText = `🎉 *_MSQs Exam Paper_* 🎉\n\n_Hey there!_\n_Check out this Exam Paper_\n Paper ID: *${paperId}*\n\n📚 *Trade:* ${paperData?.tradeName || "Unknown"}\n💯 *Total Questions:* ${stats.quesCount}\n⏳ *Duration:* ${paperData?.totalMinutes || 0} Minutes\n\n👉 Click the link below to get started:\n${examUrl}\n\n*Remember to submit on complete!*\n\n Good luck and happy Exam!`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Message copied to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy message");
    }
  };

  const onToggleProtection = async () => {
    if (!paperData || !paperData.$id) return;
    setIsTogglingProtection(true);
    try {
      const updated = await mockTestService.updateQuestion(paperData.$id, {
        isProtected: !paperData.isProtected,
      });
      setPaperData(updated);
      toast.success(updated.isProtected ? "Paper protected" : "Paper unprotected");
    } catch (error) {
      console.log(error);
      toast.error("Failed to toggle protection");
    } finally {
      setIsTogglingProtection(false);
    }
  };

  const handleDeletePaper = async () => {
    if (!paperData || !paperData.$id) return;
    const confirmation = window.confirm("Are you sure you want to delete this paper?");
    if (!confirmation) return;

    setIsDeleting(true);
    try {
      await mockTestService.deleteQuestionPaper(paperData.$id);
      toast.success("Deleted!");
      navigate("/all-mock-tests");
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast.error("Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <Loader isLoading={loading} />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900 p-8 max-w-md w-full text-center space-y-4">
          <p className="text-red-600 dark:text-red-400 font-semibold">
            Error loading results
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 w-full overflow-x-hidden">
        {/* ── Header ── */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-20">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                Mock Test Results
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-2">
                Paper ID: <span className="font-mono">{paperId}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold bg-gray-500 hover:bg-gray-600 text-white transition-colors shrink-0 whitespace-nowrap outline-none focus:ring-2 focus:ring-gray-400">
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {navigator.share && (
                    <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                      <Share2 className="w-4 h-4 mr-2 text-gray-500" /> Share via App
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleCopyMessage} className="cursor-pointer">
                    {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2 text-gray-500" />}
                    Copy Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {isTeacher && paperData && paperData.isOriginal && (
                <>
                  <button
                    onClick={onToggleProtection}
                    disabled={isTogglingProtection}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white transition-colors shrink-0 whitespace-nowrap"
                  >
                    {isTogglingProtection ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : paperData.isProtected ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {paperData.isProtected ? "Protected" : "Unprotect"}
                    </span>
                  </button>
                  <button
                    onClick={handleDeletePaper}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors shrink-0 whitespace-nowrap"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </>
              )}

              {isTeacher && (
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">Export</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* ── Left Section (Sidebar on Desktop) ── */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-6 lg:sticky lg:top-24">
            {/* ── Stats ── */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Users}
                label="Total Students"
                value={stats.total}
                sub={`${stats.submitted} submitted`}
                iconClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              />
              <StatCard
                icon={TrendingUp}
                label="Average Score"
                value={stats.avgScore}
                sub={`Top: ${stats.topScore}`}
                iconClass="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              />
              <StatCard
                icon={Clock}
                label="Avg Time"
                value={`${stats.avgTime} min`}
                sub="Among submitted"
                iconClass="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
              />
              <StatCard
                icon={Award}
                label="Completion"
                value={`${stats.completionPct}%`}
                sub={`${stats.notSubmitted} pending`}
                iconClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              />
            </div>

            {/* ── Teacher's own score ── */}
            {isTeacher &&
              myResult &&
              (() => {
                const tScore = myResult.score ?? 0;
                const tScorePct =
                  stats.quesCount > 0
                    ? Math.round((tScore / stats.quesCount) * 100)
                    : 0;
                const tAnswered = myResult.answeredCount ?? tScore;
                const tProgressPct =
                  stats.quesCount > 0
                    ? Math.round((tAnswered / stats.quesCount) * 100)
                    : 0;
                const tIsLive = !myResult.submitted && myResult.startTime;
                const tBarColor = myResult.submitted
                  ? tScorePct >= 70
                    ? "bg-green-500"
                    : tScorePct >= 40
                      ? "bg-amber-500"
                      : "bg-red-500"
                  : "bg-blue-400";
                return (
                  <div className="rounded-2xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 overflow-hidden shadow-sm">
                    <div className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" /> Your Score
                        {tIsLive && (
                          <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 animate-pulse">
                            ● Live
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 ring-2 ring-violet-400 rounded-full">
                          <InteractiveAvatar
                            src={myResult.profileImage}
                            fallbackText={getInitials(myResult.userName) || "T"}
                            userId={myResult.userId}
                            editable={false}
                            className="w-10 h-10"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {formatName(myResult.userName)}
                          </p>
                          {myResult.submitted && myResult.endTime ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {format(
                                new Date(myResult.endTime),
                                "dd MMM, hh:mm a",
                              )}{" "}
                              · {myResult.timeTaken ?? 0} min
                            </p>
                          ) : myResult.startTime ? (
                            <p className="text-xs text-blue-400 dark:text-blue-500">
                              Started at {format(new Date(myResult.startTime), "hh:mm a")} · In progress · {tElapsed ?? "0 min"}
                              {tRemaining && (
                                <span className="text-blue-300 dark:text-blue-600 ml-1">
                                  ({tRemaining})
                                </span>
                              )}
                            </p>
                          ) : (
                            <p className="text-xs text-amber-500">
                              Not started yet
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`text-2xl font-extrabold ${
                              tScorePct >= 70
                                ? "text-green-600 dark:text-green-400"
                                : tScorePct >= 40
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-red-500 dark:text-red-400"
                            }`}
                          >
                            {tScore}
                            <span className="text-sm font-semibold text-gray-400">
                              /{stats.quesCount}
                            </span>
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {myResult.submitted
                              ? `${myResult.timeTaken ?? 0} min`
                              : tIsLive
                                ? `${tAnswered}/${stats.quesCount} attempted`
                                : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Progress bar — width = attempted/total, colour = score/total */}
                    <div className="h-1 w-full bg-violet-100 dark:bg-violet-900/30">
                      <div
                        className={`h-full transition-all duration-700 ease-out ${tBarColor} ${tIsLive ? "opacity-80" : ""}`}
                        style={{ width: `${tProgressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
          </div>

          {/* ── Right Section (Main Content) ── */}
          <div className="flex-1 w-full min-w-0 space-y-6">
            {/* ── Search & Filter ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="submitted">Submitted Only</SelectItem>
                  <SelectItem value="not-submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Results list ── */}
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  No results found
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium px-1 pb-1">
                  Showing {filteredData.length} of {data.length} student
                  {data.length !== 1 ? "s" : ""}
                </p>
                {filteredData.map((result, index) => (
                  <StudentRow
                    key={result.$id}
                    result={result}
                    index={index}
                    isMe={profile?.userId === result.userId}
                    quesCount={stats.quesCount}
                    isTeacher={isTeacher}
                    canSeeScores={canSeeOthersDetails}
                    onPreview={(id) => setPreviewId(id)}
                    onExtendTime={(res) => {
                      setExtendState({ id: res.$id, name: res.userName, currentMinutes: res.totalMinutes });
                      setNewMinutes(res.totalMinutes || 0);
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:text-white [&>button]:bg-black/50 hover:[&>button]:bg-black/70 [&>button]:p-2 [&>button]:rounded-full sm:[&>button]:right-4 sm:[&>button]:top-4">
          <DialogTitle className="sr-only">Paper Preview</DialogTitle>
          <DialogDescription className="sr-only">Inline preview of the mock test paper.</DialogDescription>
          {previewId && (
            <iframe src={`/show-mock-test/${previewId}`} className="w-full h-full bg-white dark:bg-gray-950 rounded-2xl shadow-2xl" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendState} onOpenChange={(open) => !open && setExtendState(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Time</DialogTitle>
            <DialogDescription>
              Increase the total allowed minutes for {formatName(extendState?.name || "this student")}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Total Minutes</label>
              <Input
                type="number"
                value={newMinutes}
                onChange={(e) => setNewMinutes(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Current total is {extendState?.currentMinutes ?? 0} minutes.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendState(null)}>Cancel</Button>
            <Button onClick={handleExtendTimeSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MockTestResults;
