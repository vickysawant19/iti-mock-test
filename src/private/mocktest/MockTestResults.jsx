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
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import questionpaperservice from "@/appwrite/mockTest";
import userProfileService from "@/appwrite/userProfileService";
import profileImageService from "@/appwrite/profileImageService";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { Query } from "appwrite";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import Loader from "@/components/components/Loader";
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

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

const medalColors = {
  1: { bg: "bg-yellow-400", text: "text-yellow-900", ring: "ring-yellow-400", label: "🥇" },
  2: { bg: "bg-gray-300",   text: "text-gray-800",   ring: "ring-gray-300",   label: "🥈" },
  3: { bg: "bg-amber-600",  text: "text-amber-100",  ring: "ring-amber-600",  label: "🥉" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, iconClass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Student Row ──────────────────────────────────────────────────────────────
const StudentRow = ({ result, index, isMe, quesCount }) => {
  const rank = index + 1;
  const medal = medalColors[rank];
  const pct = quesCount > 0 ? Math.round((result.score / quesCount) * 100) : 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
        ${isMe
          ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700"
          : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600"
        }`}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        {medal ? (
          <span className="text-xl leading-none">{medal.label}</span>
        ) : (
          <span className="text-sm font-bold text-gray-400 dark:text-gray-500">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className={`w-9 h-9 shrink-0 ring-2 rounded-full ${medal ? medal.ring : "ring-gray-200 dark:ring-gray-600"}`}>
        <InteractiveAvatar
          src={result.profileImage}
          fallbackText={getInitials(result.userName) || "U"}
          userId={result.userId}
          editable={false}
          className="w-9 h-9"
        />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {result.submitted ? (
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
        </div>
        {result.submitted && result.endTime ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {format(new Date(result.endTime), "dd MMM, hh:mm a")}
          </p>
        ) : (
          <p className="text-xs text-amber-500 mt-0.5">Not submitted</p>
        )}
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div className="flex items-baseline gap-0.5">
          <span className={`text-base font-bold ${pct >= 70 ? "text-green-600 dark:text-green-400" : pct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}>
            {result.score ?? 0}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">/{quesCount ?? "—"}</span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {result.submitted ? `${result.timeTaken ?? 0} min` : "—"}
        </div>
      </div>

      {/* Status pill */}
      <div className="shrink-0">
        {result.submitted ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            Done
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <XCircle className="w-3 h-3" />
            Pending
          </span>
        )}
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
  const profile = useSelector(selectProfile);

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await questionpaperservice.getUserResults(paperId);
        const baseResults = (res ?? [])
          .map((item) => ({
            timeTaken: differenceInMinutes(new Date(item.endTime), new Date(item.startTime)),
            ...item,
          }))
          .filter((item) => !item.isOriginal)
          .sort(
            (a, b) =>
              b.score - a.score ||
              a.timeTaken - b.timeTaken ||
              new Date(a.endTime) - new Date(b.endTime)
          );

        // Step 1 — fast path: get profileImage stored in the DB profile document
        const userIds = [...new Set(baseResults.map((r) => r.userId).filter(Boolean))];
        let profileImageMap = {};
        if (userIds.length > 0) {
          try {
            const profiles = await userProfileService.getBatchUserProfile([
              Query.equal("userId", userIds),
              Query.select(["userId", "profileImage"]),
              Query.limit(100),
            ]);
            profiles.forEach((p) => {
              profileImageMap[p.userId] = p.profileImage || null;
            });
          } catch (e) {
            console.warn("DB profile fetch failed:", e);
          }
        }

        setData(
          baseResults.map((r) => ({
            ...r,
            profileImage: profileImageMap[r.userId] || null,
          }))
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [paperId]);

  const filteredData = useMemo(() => {
    let filtered = data.filter((item) =>
      item.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filterStatus === "submitted") filtered = filtered.filter((i) => i.submitted);
    else if (filterStatus === "not-submitted") filtered = filtered.filter((i) => !i.submitted);
    return filtered;
  }, [data, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const submitted = data.filter((i) => i.submitted);
    const avgScore =
      submitted.length > 0
        ? (submitted.reduce((s, i) => s + i.score, 0) / submitted.length).toFixed(1)
        : 0;
    const avgTime =
      submitted.length > 0
        ? (submitted.reduce((s, i) => s + i.timeTaken, 0) / submitted.length).toFixed(1)
        : 0;
    const topScore = submitted.length > 0 ? Math.max(...submitted.map((i) => i.score)) : 0;
    const quesCount = data[0]?.quesCount ?? 50;
    return {
      total: data.length,
      submitted: submitted.length,
      notSubmitted: data.length - submitted.length,
      avgScore,
      avgTime,
      topScore,
      quesCount,
      completionPct:
        data.length > 0 ? ((submitted.length / data.length) * 100).toFixed(0) : 0,
    };
  }, [data]);

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Rank,Name,Score,Time Taken (min),Status,Submitted At"]
        .concat(
          filteredData.map((res, i) => {
            const timeTaken = res.submitted ? res.timeTaken : "Not Submitted";
            const submittedAt = res.submitted
              ? format(new Date(res.endTime || res.$updatedAt), "dd/MM/yyyy hh:mm a")
              : "Not Submitted";
            return `${i + 1},"${res.userName}",${res.score},${timeTaken},${
              res.submitted ? "Submitted" : "Not Submitted"
            },"${submittedAt}"`;
          })
        )
        .join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `mock_test_results_${paperId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Loader isLoading={loading} />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900 p-8 max-w-md w-full text-center space-y-4">
          <p className="text-red-600 dark:text-red-400 font-semibold">Error loading results</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Mock Test Results
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Paper ID: {paperId}
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No results found</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium px-1">
              Showing {filteredData.length} of {data.length} student{data.length !== 1 ? "s" : ""}
            </p>
            {filteredData.map((result, index) => (
              <StudentRow
                key={result.$id}
                result={result}
                index={index}
                isMe={profile?.userId === result.userId}
                quesCount={stats.quesCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockTestResults;
