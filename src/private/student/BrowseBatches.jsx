import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import { Loader2, Users, Search, Clock, CheckCircle } from "lucide-react";
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
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isRequesting, setIsRequesting] = useState(null); 
  
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
      try {
        const requestsRes = await batchRequestService.getStudentRequests(user.$id);
        setRequests(requestsRes || []);
      } catch (error) {
        console.error("Error fetching requests", error);
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

  const activeRequests = requests.filter(r => r.status === "pending" || r.status === "approved");

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
              
              // Only let user request if they haven't already requested/joined
              const canRequest = (!status || status === "rejected") && !profile?.batchId;
  
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
                    ) : profile?.batchId ? (
                       <Button disabled variant="outline" className="w-full bg-slate-100 text-slate-500">
                        Already Enrolled
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRequestJoin(batch.$id)}
                        disabled={isRequesting === batch.$id}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isRequesting === batch.$id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {status === "rejected" ? "Request Again" : "Join Batch"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* My Requests & Joined Batches Section */}
      {activeRequests.length > 0 && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-8">
           <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">My Requests & Batches</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRequests.map(req => (
                 <Card key={req.$id} className="border border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-md flex items-center justify-between">
                         Requested Batch
                         {req.status === "approved" && <CheckCircle className="w-4 h-4 text-green-500" />}
                         {req.status === "pending" && <Clock className="w-4 h-4 text-amber-500" />}
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-slate-500">
                         Status: <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">{req.status}</span>
                      </p>
                    </CardContent>
                 </Card>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
