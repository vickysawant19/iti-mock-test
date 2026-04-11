import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import { Loader2, Users, Search, Clock, CheckCircle, Trash2, XCircle, RefreshCw } from "lucide-react";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import batchService from "@/appwrite/batchService";
import batchRequestService from "@/appwrite/batchRequestService";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";

export default function BrowseBatches() {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  
  const [batches, setBatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestBatchMap, setRequestBatchMap] = useState({});
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
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

  // Reset trade selection if college changes
  useEffect(() => {
    setSelectedTradeId("");
    setBatches([]);
  }, [selectedCollegeId]);

  // Initial load: Fetch the user's current requests & joined batches
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.$id) return;
      setIsLoadingRequests(true);
      try {
        const requestsRes = await batchRequestService.getStudentRequests(user.$id);
        console.log("[BrowseBatches] batchRequests:", requestsRes);
        setRequests(requestsRes || []);

        // Fetch batch details for each request in bulk
        const batchIds = [...new Set((requestsRes || []).map(r => r.batchId).filter(Boolean))];
        if (batchIds.length > 0) {
          const batchDocs = await batchService.getBatchesByIds(batchIds);
          console.log("[BrowseBatches] request batchDocs:", batchDocs);
          const map = {};
          batchDocs.forEach(b => { map[b.$id] = b; });
          setRequestBatchMap(map);
        }
      } catch (error) {
        console.error("Error fetching requests", error);
      } finally {
        setIsLoadingRequests(false);
      }
    };
    fetchRequests();
  }, [user]);

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
      toast.success("Request sent successfully!");
      setRequests(prev => {
        const filtered = prev.filter(r => r.batchId !== batchId);
        return [...filtered, newReq];
      });
    } catch (e) {
      toast.error("Failed to send request.");
    } finally {
      setIsRequesting(null);
    }
  };

  const handleDeleteRequest = async (req) => {
    setIsDeletingRequest(req.$id);
    try {
      await batchRequestService.deleteRequest(req.$id);
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
      setRequests(prev => prev.map(r => r.$id === req.$id ? { ...r, status: updated.status } : r));
      toast.success("Request sent again!");
    } catch (e) {
      console.error("Error re-sending request", e);
      toast.error("Failed to send request.");
    } finally {
      setIsSendingAgain(null);
    }
  };

  // Show all requests regardless of status so student always sees their history
  const activeRequests = requests.filter(r => r.status === "pending" || r.status === "approved" || r.status === "rejected");

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-blue-500" /> Browse Batches
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Select an Institute and Trade to discover available learning batches.
        </p>
      </div>

      {/* Filter Options */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Institute / College</label>
            <Select onValueChange={setSelectedCollegeId} value={selectedCollegeId}>
              <SelectTrigger>
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
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Primary Trade</label>
            <Select onValueChange={setSelectedTradeId} value={selectedTradeId} disabled={!selectedCollegeId}>
              <SelectTrigger>
                <SelectValue placeholder={!selectedCollegeId ? "Select Institute First" : (isTradesLoading ? "Loading Trades..." : "Select Trade")} />
              </SelectTrigger>
              <SelectContent>
                {!isTradesLoading && tradeData.map((trade) => (
                  <SelectItem key={trade.$id} value={trade.$id}>{trade.tradeName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* My Requests & Joined Batches Section */}
      {isLoadingRequests ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your requests...
        </div>
      ) : activeRequests.length > 0 && (
        <div className="pt-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">My Requests & Batches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRequests.map(req => {
              const batchDoc = requestBatchMap[req.batchId];
              return (
                <Card key={req.$id} className="border border-slate-200 dark:border-slate-800 flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base leading-tight">
                        {batchDoc?.BatchName || "Loading..."}
                      </CardTitle>
                      {req.status === "approved"
                        ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        : req.status === "rejected"
                        ? <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        : <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                    </div>
                    <CardDescription className="mt-1">
                      {batchDoc?.teacherName ? `Teacher: ${batchDoc.teacherName}` : "—"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-1 space-y-2">
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
                      <span className={`font-semibold capitalize ${
                        req.status === "approved" ? "text-green-600 dark:text-green-400"
                        : req.status === "rejected" ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {req.status}
                      </span>
                    </p>
                    {/* Actions per status */}
                    {req.status === "pending" && (
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
                    {req.status === "rejected" && (
                      <div className="flex gap-2 mt-1">
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
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
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Batches Section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Available Batches</h2>
        
        {!selectedCollegeId || !selectedTradeId ? (
          <Card className="border-dashed border-2 bg-transparent text-center py-12">
            <CardContent className="flex flex-col items-center">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Please select both an Institute and a Trade to view available batches.
              </p>
            </CardContent>
          </Card>
        ) : isLoadingBatches ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : batches.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent text-center py-12">
            <CardContent className="flex flex-col items-center">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">No active batches available</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Try selecting a different Trade or check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => {
              const req = requests.find(r => r.batchId === batch.$id);
              const status = req ? req.status : null;

              return (
                <Card key={batch.$id} className="border border-slate-200 dark:border-slate-800 flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{batch.BatchName}</CardTitle>
                    <CardDescription>
                      Teacher: {batch.teacherName || "Assigned Teacher"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-3">
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
                      <Button
                        onClick={() => handleRequestJoin(batch.$id)}
                        disabled={isRequesting === batch.$id}
                        variant="outline"
                        className="w-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                      >
                        {isRequesting === batch.$id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Request Again
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRequestJoin(batch.$id)}
                        disabled={isRequesting === batch.$id}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isRequesting === batch.$id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Join Batch
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
