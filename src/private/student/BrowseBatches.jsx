import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";
import { Loader2, Users, Search, Clock, CheckCircle, Trash2, XCircle, RefreshCw, GraduationCap, Building, Briefcase } from "lucide-react";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import {
  selectUserBatches,
  initializeActiveBatch,
  upsertStudentRequest,
  removeStudentRequest,
} from "@/store/activeBatchSlice";
import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import batchService from "@/services/batch/batchService";
import batchRequestService from "@/services/batch/batchRequestService";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";

export default function BrowseBatches() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const userBatches = useSelector(selectUserBatches);
  
  const [batches, setBatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestBatchMap, setRequestBatchMap] = useState({});
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isRefreshingRequests, setIsRefreshingRequests] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isRequesting, setIsRequesting] = useState(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(null);
  const [isSendingAgain, setIsSendingAgain] = useState(null); 
  
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [selectedTradeId, setSelectedTradeId] = useState("");

  const { data: collegesResponse, isLoading: isCollegesLoading } = useListCollegesQuery();
  const collegeData = collegesResponse?.documents || [];

  const selectedCollege = collegeData.find(c => c.$id === selectedCollegeId);
  const tradeIds = selectedCollege?.tradeIds || [];

  const { data: tradesResponse, isLoading: isTradesLoading } = useListTradesQuery(
    [Query.equal("$id", tradeIds)],
    { skip: !tradeIds.length }
  );
  const tradeData = tradesResponse?.documents || [];

  // Mark student checklist step "Find a batch" as visited
  useEffect(() => {
    try {
      localStorage.setItem("student_found_batch", "true");
    } catch {
      // ignore
    }
  }, []);

  // Reset trade selection if college changes
  useEffect(() => {
    setSelectedTradeId("");
    setBatches([]);
  }, [selectedCollegeId]);

  const fetchRequests = useCallback(async ({ quiet = false } = {}) => {
    if (!user?.$id) return;
    if (quiet) setIsRefreshingRequests(true);
    else setIsLoadingRequests(true);
    try {
      const requestsRes = await batchRequestService.getStudentRequests(user.$id);
      const studentRequests = requestsRes || [];
      setRequests(studentRequests);
      studentRequests.forEach((request) => dispatch(upsertStudentRequest(request)));

      const batchIds = [...new Set(studentRequests.map((request) => request.batchId).filter(Boolean))];
      const batchDocs = batchIds.length ? await batchService.getBatchesByIds(batchIds) : [];
      setRequestBatchMap(Object.fromEntries(batchDocs.map((batch) => [batch.$id, batch])));
    } catch (error) {
      console.error("Error fetching requests", error);
      if (!quiet) toast.error("Could not load your request statuses.");
    } finally {
      if (quiet) setIsRefreshingRequests(false);
      else setIsLoadingRequests(false);
    }
  }, [dispatch, user?.$id]);

  // Refresh status when the student returns to this tab, and keep a manual refresh nearby.
  useEffect(() => {
    fetchRequests();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") fetchRequests({ quiet: true });
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchRequests]);

  // Fetch batches when college and trade are selected
  useEffect(() => {
    const fetchBatches = async () => {
      if (!selectedCollegeId || !selectedTradeId) {
        setBatches([]);
        return;
      }
      
      setIsLoadingBatches(true);
      try {
        const batchesRes = await batchService.listBatches([
          Query.equal("collegeId", selectedCollegeId),
          Query.equal("tradeId", selectedTradeId),
          Query.equal("isActive", true),
          Query.limit(50)
        ]);
        
        setBatches(batchesRes.documents || []);
      } catch (error) {
        console.error("Error fetching batches", error);
        toast.error("Failed to load batches.");
      } finally {
        setIsLoadingBatches(false);
      }
    };
    fetchBatches();
  }, [selectedCollegeId, selectedTradeId]);

  const handleRequestJoin = async (batchId) => {
    setIsRequesting(batchId);
    try {
      const newReq = await batchRequestService.sendRequest(batchId, user.$id);
      
      if (newReq?.alreadyJoined) {
        toast.info("You have already joined this batch!");
        if (profile) {
          dispatch(initializeActiveBatch(profile));
        }
      } else {
        toast.success("Request sent successfully!");
        dispatch(upsertStudentRequest(newReq));
        const selectedBatch = batches.find((batch) => batch.$id === batchId);
        if (selectedBatch) {
          setRequestBatchMap((prev) => ({ ...prev, [batchId]: selectedBatch }));
        }
        setRequests(prev => {
          const filtered = prev.filter(r => r.batchId !== batchId);
          return [...filtered, newReq];
        });
      }
    } catch (e) {
      console.error("Failed to send request:", e);
      toast.error("Failed to send request.");
    } finally {
      setIsRequesting(null);
    }
  };

  const handleDeleteRequest = async (req) => {
    setIsDeletingRequest(req.$id);
    try {
      await batchRequestService.deleteRequest(req.$id);
      dispatch(removeStudentRequest(req.$id));
      setRequests(prev => prev.filter(r => r.$id !== req.$id));
      toast.success("Request deleted.");
    } catch (e) {
      console.error("Error deleting request", e);
      toast.error("Failed to delete request.");
    } finally {
      setIsDeletingRequest(null);
    }
  };

  const handleSendAgain = async (req) => {
    setIsSendingAgain(req.$id);
    try {
      const updated = await batchRequestService.sendRequest(req.batchId, user.$id);
      dispatch(upsertStudentRequest(updated));
      setRequests(prev => prev.map(r => r.$id === req.$id ? { ...r, status: updated.status } : r));
      toast.success("Request sent again!");
    } catch (e) {
      console.error("Error re-sending request", e);
      toast.error("Failed to send request.");
    } finally {
      setIsSendingAgain(null);
    }
  };

  const handleOpenLearningDashboard = async () => {
    if (profile) await dispatch(initializeActiveBatch(profile));
    navigate("/arena");
  };

  // Show all requests regardless of status so student always sees their history
  const activeRequests = requests.filter(r => ["pending", "approved", "rejected"].includes(r.status?.toLowerCase()));
  const pendingRequestsCount = activeRequests.filter((request) => request.status?.toLowerCase() === "pending").length;
  const scrollToRequests = () => document.getElementById("my-requests")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToAvailableBatches = () => document.getElementById("available-batches")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-clip font-sans">
      {/* Ambient Animated Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl">
          <div className="h-20 bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500"></div>
          <div className="px-6 py-5 -mt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/80 dark:bg-slate-800 rounded-2xl shadow-lg border border-white/40">
                <Search className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Browse Batches
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
                  Select an Institute and Trade to discover available learning batches.
                </p>
              </div>
            </div>
          </div>
      </div>

      {!isLoadingRequests && activeRequests.length > 0 && (
        <div className="sticky top-16 z-30 -mx-1 rounded-2xl border border-indigo-200/80 bg-white/95 px-3 py-2.5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-indigo-900/70 dark:bg-slate-900/95 sm:mx-0 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={scrollToRequests} className="flex min-w-0 items-center gap-2 text-left">
              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${pendingRequestsCount ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"}`}>
                {pendingRequestsCount ? <Clock className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {pendingRequestsCount
                    ? `${pendingRequestsCount} request${pendingRequestsCount === 1 ? "" : "s"} awaiting review`
                    : "Your batch request updates"}
                </span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">View status and next steps</span>
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button type="button" variant="ghost" size="sm" className="h-9 px-2.5 text-indigo-700 dark:text-indigo-300" onClick={scrollToRequests}>
                My requests
              </Button>
              <Button type="button" variant="outline" size="icon" aria-label="Refresh request statuses" title="Refresh request statuses" className="h-9 w-9" onClick={() => fetchRequests({ quiet: true })} disabled={isRefreshingRequests}>
                <RefreshCw className={`h-4 w-4 ${isRefreshingRequests ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-white/40 dark:border-slate-800 flex items-center gap-3">
          <Building className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Filter by Institute & Trade</h2>
        </div>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institute / College</label>
            <Select onValueChange={setSelectedCollegeId} value={selectedCollegeId}>
              <SelectTrigger className="rounded-xl border-slate-200/50 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <SelectValue placeholder={isCollegesLoading ? "Loading Colleges..." : "Select Institute"} />
              </SelectTrigger>
              <SelectContent>
                {!isCollegesLoading && collegeData.map((college) => (
                  <SelectItem key={college.$id} value={college.$id}>{college.collageName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Trade</label>
            <Select onValueChange={setSelectedTradeId} value={selectedTradeId} disabled={!selectedCollegeId}>
              <SelectTrigger className="rounded-xl border-slate-200/50 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <SelectValue placeholder={!selectedCollegeId ? "Select Institute First" : (isTradesLoading ? "Loading Trades..." : "Select Trade")} />
              </SelectTrigger>
              <SelectContent>
                {!isTradesLoading && tradeData.map((trade) => (
                  <SelectItem key={trade.$id} value={trade.$id}>{trade.tradeName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* My Requests & Joined Batches Section */}
      {isLoadingRequests ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium py-2">
          <Loader2 className="w-4 h-4 animate-spin text-pink-500" /> Loading your requests...
        </div>
      ) : activeRequests.length > 0 && (
        <div id="my-requests" className="scroll-mt-24">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-500" /> My Requests & Batches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRequests.map(req => {
              const batchDoc = requestBatchMap[req.batchId];
              const status = req.status?.toLowerCase();
              const statusLabel = status === "rejected" ? "Declined" : status === "approved" ? "Approved" : "Pending";
              return (
                <div key={req.$id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-default">
                  <div className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {batchDoc?.BatchName || "Batch details unavailable"}
                      </h3>
                      {status === "approved"
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        : status === "rejected"
                        ? <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        : <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {batchDoc?.teacherName ? `Teacher: ${batchDoc.teacherName}` : "—"}
                    </p>
                  </div>
                  <div className="px-4 pb-4 pt-1 space-y-2 mt-auto">
                    {batchDoc?.start_date && (
                      <p className="text-xs text-slate-500">
                        Duration:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(batchDoc.start_date).getFullYear()} – {new Date(batchDoc.end_date || batchDoc.start_date).getFullYear()}
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-slate-500">
                      Status:{" "}
                      <span className={`font-semibold ${
                        status === "approved" ? "text-green-600 dark:text-green-400"
                        : status === "rejected" ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {statusLabel}
                      </span>
                    </p>
                    {status === "pending" && (
                      <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
                        Your request is with the instructor for review. You can cancel it while you wait.
                      </p>
                    )}
                    {status === "approved" && (
                      <p className="text-xs leading-5 text-emerald-700 dark:text-emerald-300">
                        You’re approved. Open your learning dashboard to continue.
                      </p>
                    )}
                    {status === "rejected" && (
                      <p className="text-xs leading-5 text-red-700 dark:text-red-300">
                        This request was declined. You can request again or choose another batch.
                      </p>
                    )}
                    {status === "approved" && (
                      <Button
                        size="sm"
                        className="mt-1 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={handleOpenLearningDashboard}
                      >
                        Open learning dashboard
                      </Button>
                    )}
                    {/* Actions per status */}
                    {status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 dark:text-red-400"
                        disabled={isDeletingRequest === req.$id}
                        onClick={() => handleDeleteRequest(req)}
                      >
                        {isDeletingRequest === req.$id
                          ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                        Cancel Request
                      </Button>
                    )}
                    {status === "rejected" && (
                      <div className="mt-1 space-y-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs rounded-xl font-semibold shadow-sm"
                            disabled={isSendingAgain === req.$id || isDeletingRequest === req.$id}
                            onClick={() => handleSendAgain(req)}
                          >
                            {isSendingAgain === req.$id
                              ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                            Send Again
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 dark:text-red-400 text-xs"
                            disabled={isDeletingRequest === req.$id || isSendingAgain === req.$id}
                            onClick={() => handleDeleteRequest(req)}
                          >
                            {isDeletingRequest === req.$id
                              ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                            Delete
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={scrollToAvailableBatches}>
                          <Search className="w-3.5 h-3.5 mr-1.5" /> Browse other batches
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Batches Section */}
      <div id="available-batches" className="scroll-mt-24">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-amber-500" /> Available Batches
        </h2>
        
        {!selectedCollegeId || !selectedTradeId ? (
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-2 border-dashed border-white/60 dark:border-slate-700 rounded-3xl text-center py-14">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl mb-4">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                Please select both an Institute and a Trade to view available batches.
              </p>
            </div>
          </div>
        ) : isLoadingBatches ? (
          <div className="flex justify-center items-center py-14">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-2 border-dashed border-white/60 dark:border-slate-700 rounded-3xl text-center py-14">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl mb-4">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No active batches available</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                Try selecting a different Trade or check back later.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => {
              const req = requests.find(r => r.batchId === batch.$id);
              const isJoinedInStore = userBatches?.some(b => b.$id === batch.$id);
              const status = isJoinedInStore ? "approved" : (req ? req.status?.toLowerCase() : null);

              return (
                <div key={batch.$id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden hover:shadow-lg transition-all cursor-default group">
                  <div className="p-5 pb-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{batch.BatchName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Teacher: {batch.teacherName || "Assigned Teacher"}
                    </p>
                  </div>
                  <div className="px-5 pb-5 mt-auto pt-2">
                    <div className="flex justify-between items-center text-sm mb-4">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {new Date(batch.start_date || new Date()).getFullYear()} - {new Date(batch.end_date || new Date()).getFullYear()}
                      </span>
                    </div>
  
                    {status === "approved" ? (
                      <Button disabled variant="outline" className="w-full border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                        <CheckCircle className="w-4 h-4 mr-2" /> Joined
                      </Button>
                    ) : status === "pending" ? (
                      <Button disabled variant="outline" className="w-full border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                        <Clock className="w-4 h-4 mr-2" /> Request Sent
                      </Button>
                    ) : status === "rejected" ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">Request declined</p>
                        <Button
                          onClick={() => handleRequestJoin(batch.$id)}
                          disabled={isRequesting === batch.$id}
                          variant="outline"
                          className="w-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                        >
                          {isRequesting === batch.$id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                          Request Again
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleRequestJoin(batch.$id)}
                        disabled={isRequesting === batch.$id}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-md shadow-pink-500/20 transition-all hover:-translate-y-0.5"
                      >
                        {isRequesting === batch.$id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Join Batch
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {userBatches?.length === 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 dark:border-indigo-900/70 dark:bg-indigo-950/40 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2 className="font-bold text-indigo-950 dark:text-indigo-100">Ready to join a batch?</h2>
            <p className="mt-1 text-sm text-indigo-800/80 dark:text-indigo-200/80">
              Choose an institute and trade above, then request to join an available batch. Your instructor will review the request.
            </p>
          </div>
          <a
            href="#available-batches"
            className="mt-3 inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 sm:mt-0"
          >
            Browse available batches
          </a>
        </div>
      )}
      </div>
    </div>
  );
}
