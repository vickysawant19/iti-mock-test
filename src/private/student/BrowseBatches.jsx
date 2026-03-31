import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import { Loader2, Users, Search, Clock, CheckCircle } from "lucide-react";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "react-toastify";
import batchService from "@/appwrite/batchService";
import batchRequestService from "@/appwrite/batchRequestService";

export default function BrowseBatches() {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  
  const [batches, setBatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(null); 

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.collegeId || !profile?.tradeId || !user?.$id) return;
      setIsLoading(true);
      try {
        // Fetch all active batches for this student's college and trade
        const batchesRes = await batchService.listBatches([
          Query.equal("collegeId", profile.collegeId?.$id || profile.collegeId),
          Query.equal("tradeId", profile.tradeId?.$id || profile.tradeId),
          Query.equal("isActive", true),
          Query.limit(50)
        ]);
        
        // Fetch all requests the student has made
        const requestsRes = await batchRequestService.getStudentRequests(user.$id);
        
        setBatches(batchesRes.documents || []);
        setRequests(requestsRes || []);
      } catch (error) {
        console.error("Error fetching batches/requests", error);
        toast.error("Failed to load batches.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [profile, user]);

  const handleRequestJoin = async (batchId) => {
    setIsRequesting(batchId);
    try {
      const newReq = await batchRequestService.sendRequest(batchId, user.$id);
      toast.success("Request sent successfully!");
      setRequests(prev => {
        // Remove existing request for this batch if it exists (e.g. if it was rejected)
        const filtered = prev.filter(r => r.batchId !== batchId);
        return [...filtered, newReq];
      });
    } catch (e) {
      toast.error("Failed to send request.");
    } finally {
      setIsRequesting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-500" /> Browse Batches
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Discover and join active batches matching your College and Trade.
          </p>
        </div>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent text-center py-16">
          <CardContent className="flex flex-col items-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-lg">No active batches available</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              There are currently no active batches listed for your specific College and Trade.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => {
            const req = requests.find(r => r.batchId === batch.$id);
            const status = req ? req.status : null; // "pending", "approved", "rejected", or null
            
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
  );
}
