import React, { useState, useEffect } from "react";
import {
  Play,
  RotateCcw,
  RefreshCw,
  FileSpreadsheet,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Database,
  Globe,
  Loader2,
  ShieldCheck,
  Zap,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { setupQuestionSchema } from "../../scripts/setupQuestionSchema";
import migrationService from "../../services/migration/migrationService";
import { validateCollectionIntegrity } from "../../services/migration/validationService";
import {
  generateDuplicateReport,
  exportDuplicateReportCSV,
} from "../../services/migration/duplicateReporter";
import { Query } from "../../services/appwriteClient";
import questionService from "../../services/question.service";

const MigrationDashboard = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [batchSize, setBatchSize] = useState(25);
  const [requestDelayMs, setRequestDelayMs] = useState(250);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const [progress, setProgress] = useState({
    total: 0,
    processed: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    duplicates: 0,
    currentBatch: 0,
    totalBatches: 0,
    status: "idle",
    logs: [],
  });

  const [dupSummary, setDupSummary] = useState(null);
  const [validationSummary, setValidationSummary] = useState(null);
  const [langStats, setLangStats] = useState({
    english: 0,
    marathi: 0,
    bilingual: 0,
    unknown: 0,
  });

  const appendLog = (msg) => {
    setLogs((prev) => [msg, ...prev].slice(0, 300));
  };

  const fetchCollectionStats = async () => {
    try {
      appendLog("Fetching collection overview using indexed total counts...");

      // Total count
      const totalRes = await questionService.listQuestions([Query.limit(1)]);
      const totalCount = typeof totalRes.total === "number" ? totalRes.total : 0;

      // Migrated count (schemaVersion = 2 or migrationStatus = completed)
      let migratedCount = 0;
      try {
        const v2Res = await questionService.listQuestions([
          Query.equal("schemaVersion", 2),
          Query.limit(1),
        ]);
        migratedCount = typeof v2Res.total === "number" ? v2Res.total : 0;
      } catch (_) {}

      if (migratedCount === 0) {
        try {
          const statusRes = await questionService.listQuestions([
            Query.equal("migrationStatus", "completed"),
            Query.limit(1),
          ]);
          migratedCount = typeof statusRes.total === "number" ? statusRes.total : 0;
        } catch (_) {}
      }

      // Indexed category totals
      let eng = 0, mar = 0, bi = 0, unk = 0;
      try {
        const biRes = await questionService.listQuestions([
          Query.equal("languageType", "bilingual"),
          Query.limit(1),
        ]);
        bi = typeof biRes.total === "number" ? biRes.total : 0;
      } catch (_) {}

      try {
        const engRes = await questionService.listQuestions([
          Query.equal("languageType", "english"),
          Query.limit(1),
        ]);
        eng = typeof engRes.total === "number" ? engRes.total : 0;
      } catch (_) {}

      try {
        const marRes = await questionService.listQuestions([
          Query.equal("languageType", "marathi"),
          Query.limit(1),
        ]);
        mar = typeof marRes.total === "number" ? marRes.total : 0;
      } catch (_) {}

      unk = Math.max(0, totalCount - (bi + eng + mar));

      setLangStats({ english: eng, marathi: mar, bilingual: bi, unknown: unk });
      setProgress((prev) => ({
        ...prev,
        total: totalCount,
        migrated: migratedCount,
        skipped: migratedCount,
      }));
    } catch (err) {
      appendLog(`Error fetching stats: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchCollectionStats();
  }, []);

  const handleVerifySchema = async () => {
    appendLog("Initiating Appwrite Schema Verification...");
    const res = await setupQuestionSchema((msg) => appendLog(msg));
    if (res.success) {
      toast.success("Schema attributes & indexes verified successfully!");
    } else {
      toast.error("Schema verification completed with errors.");
    }
  };

  const handleStartMigration = async (force = false) => {
    setIsRunning(true);
    appendLog(`Starting migration (DryRun: ${dryRun}, BatchSize: ${batchSize}, Delay: ${requestDelayMs}ms, Force: ${force})...`);

    try {
      await migrationService.executeMigration({
        batchSize,
        requestDelayMs,
        batchDelayMs: 1500,
        dryRun,
        forceAll: force,
        onLog: (msg) => appendLog(msg),
        onProgress: (p) => setProgress(p),
      });

      toast.success("Migration process finished!");
      await fetchCollectionStats();
    } catch (err) {
      toast.error(`Migration failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ fetched: 0, total: 0 });

  const handleRunDuplicateReport = async () => {
    setIsAnalyzing(true);
    setActiveTab("duplicates");
    appendLog("Generating Duplicate Report across entire collection (res.total)...");

    try {
      const res = await questionService.fetchAllQuestions((fetched, total) => {
        setAnalyzeProgress({ fetched, total });
      });
      const docs = res.documents || [];

      let eng = 0, mar = 0, bi = 0, unk = 0;
      for (const d of docs) {
        const lt = d.languageType;
        if (lt === "bilingual") bi++;
        else if (lt === "english") eng++;
        else if (lt === "marathi") mar++;
        else unk++;
      }
      setLangStats({ english: eng, marathi: mar, bilingual: bi, unknown: unk });

      const report = generateDuplicateReport(docs);
      setDupSummary(report);
      toast.success(`Duplicate Report generated! Analyzed ${docs.length} of ${res.total} total questions. Found ${report.exactDuplicatesCount + report.normalizedDuplicatesCount} duplicates.`);
    } catch (err) {
      toast.error(`Failed to generate duplicate report: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCSV = () => {
    if (!dupSummary) {
      toast.warn("Please run duplicate report first!");
      return;
    }
    const csvContent = exportDuplicateReportCSV(dupSummary);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `question_duplicate_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Duplicate Report CSV downloaded!");
  };

  const [deletingId, setDeletingId] = useState(null);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  const handleDeleteQuestion = async (docId) => {
    if (!window.confirm(`Are you sure you want to delete duplicate question ${docId}?`)) return;
    setDeletingId(docId);
    appendLog(`Deleting duplicate question document ${docId}...`);
    try {
      await questionService.deleteQuestion(docId);
      toast.success(`Duplicate question ${docId} deleted successfully!`);
      if (dupSummary) {
        const updatedGroups = dupSummary.groups
          .map((g) => ({
            ...g,
            duplicates: g.duplicates.filter((d) => d.$id !== docId),
          }))
          .filter((g) => g.duplicates.length > 0);

        setDupSummary({
          ...dupSummary,
          groups: updatedGroups,
          exactDuplicatesCount: updatedGroups.filter((g) => g.type === "exact").reduce((acc, g) => acc + g.duplicates.length, 0),
          normalizedDuplicatesCount: updatedGroups.filter((g) => g.type === "normalized").reduce((acc, g) => acc + g.duplicates.length, 0),
          partialDuplicatesCount: updatedGroups.filter((g) => g.type === "partial").reduce((acc, g) => acc + g.duplicates.length, 0),
        });
      }
      await fetchCollectionStats();
    } catch (err) {
      toast.error(`Failed to delete question: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleResolveGroup = async (group) => {
    if (!window.confirm(`Resolve group? Canonical question ${group.canonicalQuestionId} will be kept and ${group.duplicates.length} duplicate(s) deleted.`)) return;
    setIsCleaningDuplicates(true);
    let deletedCount = 0;
    try {
      for (const dup of group.duplicates) {
        await questionService.deleteQuestion(dup.$id);
        deletedCount++;
        await new Promise((r) => setTimeout(r, 300));
      }
      toast.success(`Group resolved! Cleaned ${deletedCount} duplicate question(s).`);
      await handleRunDuplicateReport();
    } catch (err) {
      toast.error(`Group resolution failed: ${err.message}`);
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const handleBulkCleanDuplicates = async (typeFilter) => {
    if (!dupSummary) return;
    const targetGroups = dupSummary.groups.filter((g) => g.type === typeFilter);
    const totalToDelete = targetGroups.reduce((acc, g) => acc + g.duplicates.length, 0);

    if (totalToDelete === 0) {
      toast.info(`No ${typeFilter} duplicates available to clean.`);
      return;
    }

    if (!window.confirm(`Auto-clean ${totalToDelete} ${typeFilter} duplicate questions? 1 primary original question per group will be kept and redundant duplicate rows deleted.`)) return;

    setIsCleaningDuplicates(true);
    appendLog(`Starting Rate-Limited Bulk Auto-Clean of ${totalToDelete} ${typeFilter} duplicates...`);
    let deletedCount = 0;

    try {
      for (const group of targetGroups) {
        for (const dup of group.duplicates) {
          try {
            await questionService.deleteQuestion(dup.$id);
            deletedCount++;
            appendLog(`Cleaned duplicate question ${dup.$id} (${deletedCount}/${totalToDelete})...`);
            await new Promise((r) => setTimeout(r, 300));
          } catch (err) {
            appendLog(`Failed to delete duplicate ${dup.$id}: ${err.message}`);
          }
        }
      }
      toast.success(`Successfully cleaned ${deletedCount} ${typeFilter} duplicate questions!`);
      await handleRunDuplicateReport();
      await fetchCollectionStats();
    } catch (err) {
      toast.error(`Bulk clean failed: ${err.message}`);
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const handleValidateIntegrity = async () => {
    appendLog("Running Collection Integrity Audit...");
    try {
      const summary = await validateCollectionIntegrity();
      setValidationSummary(summary);
      if (summary.isValid) {
        toast.success("Collection Integrity Audit Passed! 100% Data Integrity Verified.");
      } else {
        toast.warn(`Audit found ${summary.invalidCount} issues.`);
      }
    } catch (err) {
      toast.error(`Validation failed: ${err.message}`);
    }
  };

  const handleRollback = async () => {
    if (!window.confirm("Are you sure you want to rollback migration status for all documents?")) return;
    setIsRunning(true);
    appendLog("Rolling back migration statuses...");
    try {
      const res = await migrationService.rollbackMigration();
      toast.success(`Rollback completed! ${res.rolledBackCount} documents reset.`);
      await fetchCollectionStats();
    } catch (err) {
      toast.error(`Rollback failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const [isMigratingSessions, setIsMigratingSessions] = useState(false);

  const handleMigrateBatchSessions = async () => {
    setIsMigratingSessions(true);
    appendLog("Starting Batch Academic Sessions Migration (Splitting 2-year courses into First & Second Year sessions)...");
    try {
      const batchService = (await import("../../appwrite/batchService")).default;
      const res = await batchService.migrateAllBatchesSessions();
      appendLog(`Successfully processed ${res.total} batches and updated ${res.updated} batch documents with Academic Sessions.`);
      toast.success(`Updated ${res.updated} batch documents with Academic Sessions!`);
    } catch (err) {
      appendLog(`Error migrating batch sessions: ${err.message}`);
      toast.error(`Batch session migration failed: ${err.message}`);
    } finally {
      setIsMigratingSessions(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                <Database className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Appwrite Migration Engine & Tools
              </h1>
            </div>
            <p className="text-slate-400 text-xs pl-12">
              Normalize questions, split academic batch sessions (1 vs 2 year terms), and audit collection integrity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleMigrateBatchSessions}
              disabled={isMigratingSessions}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {isMigratingSessions ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Layers className="w-4 h-4 text-white" />
              )}
              Migrate Batch Sessions
            </button>
            <button
              onClick={handleVerifySchema}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verify Schema
            </button>
            <button
              onClick={fetchCollectionStats}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
              title="Refresh Collection Stats"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold">Total Questions</div>
            <div className="text-2xl font-black text-white mt-2">{progress.total}</div>
            <div className="text-[10px] text-slate-500 mt-1">Appwrite Collection</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold">Migrated (v2)</div>
            <div className="text-2xl font-black text-emerald-400 mt-2">{progress.migrated}</div>
            <div className="text-[10px] text-emerald-500/80 mt-1">
              {progress.total ? Math.round((progress.migrated / progress.total) * 100) : 0}% Complete
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold">Duplicates Detected</div>
            <div className="text-2xl font-black text-amber-400 mt-2">
              {dupSummary ? dupSummary.exactDuplicatesCount + dupSummary.normalizedDuplicatesCount : 0}
            </div>
            <div className="text-[10px] text-amber-500/80 mt-1">
              {dupSummary ? dupSummary.exactDuplicatesCount : 0} Exact Matches
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold">Bilingual Questions</div>
            <div className="text-2xl font-black text-blue-400 mt-2">{langStats.bilingual}</div>
            <div className="text-[10px] text-blue-500/80 mt-1">English + Marathi</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold">English Only</div>
            <div className="text-2xl font-black text-sky-400 mt-2">{langStats.english}</div>
            <div className="text-[10px] text-sky-500/80 mt-1">Standalone</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold">Marathi Only</div>
            <div className="text-2xl font-black text-purple-400 mt-2">{langStats.marathi}</div>
            <div className="text-[10px] text-purple-500/80 mt-1">Standalone</div>
          </div>
        </div>

        {/* Primary Controls Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                />
                Dry Run Mode (Simulate Only)
              </label>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <span>Batch Size:</span>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                >
                  <option value={15}>15 Docs</option>
                  <option value={25}>25 Docs</option>
                  <option value={50}>50 Docs</option>
                  <option value={100}>100 Docs</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <span>API Speed:</span>
                <select
                  value={requestDelayMs}
                  onChange={(e) => setRequestDelayMs(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                >
                  <option value={100}>Fast (100ms)</option>
                  <option value={250}>Safe (250ms - Recommended)</option>
                  <option value={500}>Strict (500ms)</option>
                  <option value={1000}>Ultra Safe (1000ms)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={isRunning}
                onClick={() => handleStartMigration(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Migration
              </button>

              <button
                disabled={isRunning}
                onClick={() => handleStartMigration(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                Force Re-Migrate All
              </button>

              <button
                disabled={isAnalyzing || isRunning}
                onClick={handleRunDuplicateReport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : (
                  <FileSearch className="w-4 h-4 text-indigo-400" />
                )}
                {isAnalyzing ? "Analyzing Collection..." : "Duplicate Analysis"}
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Export CSV
              </button>

              <button
                disabled={isRunning}
                onClick={handleRollback}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 font-semibold text-xs border border-red-800/60 transition disabled:opacity-50"
                title="Rollback Migration Status"
              >
                <RotateCcw className="w-4 h-4" />
                Rollback
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Batch {progress.currentBatch} of {progress.totalBatches}</span>
                <span>{progress.processed} / {progress.total} Docs ({Math.round((progress.processed / (progress.total || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (progress.processed / (progress.total || 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
              activeTab === "overview" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Overview & Status
          </button>

          <button
            onClick={() => setActiveTab("duplicates")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === "duplicates" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Duplicate Report
            {dupSummary && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                {dupSummary.groups.length} Groups
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("validation")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
              activeTab === "validation" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Integrity Audit
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
              activeTab === "logs" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Console Logs
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                Language Classification Breakdown
              </h3>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Bilingual (English | Marathi)</span>
                  <span className="text-xs font-bold text-blue-400">{langStats.bilingual} Docs</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">English Standalone</span>
                  <span className="text-xs font-bold text-sky-400">{langStats.english} Docs</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Marathi Standalone</span>
                  <span className="text-xs font-bold text-purple-400">{langStats.marathi} Docs</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Unclassified / Unknown</span>
                  <span className="text-xs font-bold text-slate-400">{langStats.unknown} Docs</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Migration Assurance & Safeguards
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Data Loss:</strong> Raw original <code className="text-blue-300">question</code> and <code className="text-blue-300">options[]</code> remain untouched.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Backwards Compatible:</strong> All legacy API calls, mock test generators, and game modes continue operating without modification.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Resumable Engine:</strong> Safely interrupts and resumes from the exact last document checkpoint without duplicating updates.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Duplicate Report */}
        {activeTab === "duplicates" && (
          <div className="space-y-6">
            {isAnalyzing ? (
              <div className="bg-slate-900/80 border border-slate-800 p-12 rounded-3xl text-center space-y-6 shadow-xl">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Analyzing Duplicate Questions Across Collection...</h3>
                  <p className="text-slate-400 text-xs">
                    Downloaded {analyzeProgress.fetched} of {analyzeProgress.total} questions ({Math.round((analyzeProgress.fetched / (analyzeProgress.total || 1)) * 100)}%)
                  </p>
                </div>
                <div className="w-full max-w-md mx-auto bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (analyzeProgress.fetched / (analyzeProgress.total || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Normalizing questions, computing hashes, and clustering duplicate groups...</p>
              </div>
            ) : !dupSummary ? (
              <div className="bg-slate-900/80 border border-slate-800 p-12 rounded-3xl text-center space-y-4">
                <FileSearch className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">No duplicate analysis report loaded yet.</p>
                <button
                  disabled={isAnalyzing}
                  onClick={handleRunDuplicateReport}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Generate Duplicate Analysis Now
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metric Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-400">Exact Duplicates</div>
                      <div className="text-2xl font-black text-red-400 mt-1">{dupSummary.exactDuplicatesCount}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Identical text, options & answer</div>
                    </div>
                    {dupSummary.exactDuplicatesCount > 0 && (
                      <button
                        disabled={isCleaningDuplicates}
                        onClick={() => handleBulkCleanDuplicates("exact")}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 font-bold text-xs transition disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clean {dupSummary.exactDuplicatesCount} Exact Duplicates
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-400">Normalized Duplicates</div>
                      <div className="text-2xl font-black text-amber-400 mt-1">{dupSummary.normalizedDuplicatesCount}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Identical after space/case normalization</div>
                    </div>
                    {dupSummary.normalizedDuplicatesCount > 0 && (
                      <button
                        disabled={isCleaningDuplicates}
                        onClick={() => handleBulkCleanDuplicates("normalized")}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold text-xs transition disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clean {dupSummary.normalizedDuplicatesCount} Normalized Duplicates
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-400">Partial Similarities</div>
                      <div className="text-2xl font-black text-blue-400 mt-1">{dupSummary.partialDuplicatesCount}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">High text overlap / stemming match</div>
                    </div>
                    <div className="text-[10px] text-slate-500 italic p-2 bg-slate-950/40 rounded-xl border border-slate-800">
                      Review partial matches below before resolving manually.
                    </div>
                  </div>
                </div>

                {/* Duplicate Clusters List */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-4 bg-slate-800/50 border-b border-slate-800 font-bold text-xs text-slate-300 flex items-center justify-between">
                    <span>Duplicate Cluster Groups ({dupSummary.groups.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Click action buttons to remove duplicate records safely</span>
                  </div>
                  <div className="divide-y divide-slate-800 max-h-[550px] overflow-y-auto">
                    {dupSummary.groups.map((group, idx) => (
                      <div key={idx} className="p-5 space-y-4 hover:bg-slate-800/20 transition">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg font-black uppercase text-[10px] ${
                              group.type === "exact"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : group.type === "normalized"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}>
                              {group.type} Match ({group.duplicates.length} Redundant)
                            </span>
                            <span className="text-slate-400 text-xs font-mono">
                              Canonical Original: <code className="text-emerald-400 font-bold">{group.canonicalQuestionId}</code>
                            </span>
                          </div>

                          <button
                            disabled={isCleaningDuplicates}
                            onClick={() => handleResolveGroup(group)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-red-300 hover:text-red-200 text-xs font-bold border border-slate-700 hover:border-red-800 transition disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Keep Primary & Delete {group.duplicates.length} Duplicates
                          </button>
                        </div>

                        <div className="text-sm font-semibold text-slate-200 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
                          {group.questionText}
                        </div>

                        <div className="space-y-2 pl-3">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duplicate Rows To Clean:</div>
                          {group.duplicates.map((dup) => (
                            <div key={dup.$id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 hover:border-slate-700 transition">
                              <div className="flex items-center gap-3 truncate pr-4">
                                <span className="text-red-400 font-mono text-[11px] font-bold">• ID: {dup.$id}</span>
                                <span className="truncate text-slate-300">{dup.question || group.questionText}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[10px] text-slate-500 font-mono">Score: {(dup.similarityScore || 1).toFixed(2)}</span>
                                <button
                                  disabled={deletingId === dup.$id || isCleaningDuplicates}
                                  onClick={() => handleDeleteQuestion(dup.$id)}
                                  className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/60 text-red-400 hover:text-red-200 transition border border-red-900/40 disabled:opacity-50"
                                  title="Delete this duplicate document"
                                >
                                  {deletingId === dup.$id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Integrity Validation */}
        {activeTab === "validation" && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Collection Integrity Audit</h3>
                  <p className="text-xs text-slate-400">Verifies zero data loss, hash integrity, option count parity, and search fields across all documents.</p>
                </div>
                <button
                  onClick={handleValidateIntegrity}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
                >
                  Run Full Integrity Audit
                </button>
              </div>

              {validationSummary && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Total Audited</div>
                      <div className="text-xl font-bold text-white">{validationSummary.totalAudited}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Valid & Healthy</div>
                      <div className="text-xl font-bold text-emerald-400">{validationSummary.validCount}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Issues Flagged</div>
                      <div className="text-xl font-bold text-red-400">{validationSummary.invalidCount}</div>
                    </div>
                  </div>

                  {validationSummary.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-300">Integrity Issues Log</h4>
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2 text-xs">
                        {validationSummary.issues.map((iss, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-red-400">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span><strong>[{iss.issueType}]</strong> Doc ID <code className="text-slate-300">{iss.documentId}</code>: {iss.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Console Logs */}
        {activeTab === "logs" && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl font-mono text-xs text-slate-300 h-96 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">Console output will stream here...</div>
            ) : (
              logs.map((logStr, i) => (
                <div key={i} className="leading-relaxed hover:bg-slate-900 px-1 py-0.5 rounded">
                  {logStr}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationDashboard;
