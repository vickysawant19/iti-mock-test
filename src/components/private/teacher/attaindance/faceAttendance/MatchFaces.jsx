import { Query } from "appwrite";
import { useEffect, useRef, useState } from "react";
import { generateBinaryHash, generateHashArrayForMatch } from "./util";
import { faceService } from "../../../../../appwrite/faceService";
import {
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle,
} from "lucide-react";
import attendanceService from "../../../../../appwrite/attaindanceService";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../../../store/profileSlice";
import { selectUser } from "../../../../../store/userSlice";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { distance } from "framer-motion";
import useFaceCache from "./hooks/useFaceCache";
import useDbFaceCache from "./hooks/useDbFaceCache";

const MatchFaceMode = ({
  faceapi,
  detectFace,
  resultMessage,
  setResultMessage,
}) => {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isTeacher = user.labels.includes("Teacher");

  const [matchStatus, setMatchStatus] = useState(null); // {'matched', 'unknown', 'loading', null}
  // Ref to track if an API call is currently in progress
  const apiCallInProgressRef = useRef(false);
  // Track total API calls
  const [apiCallCount, setApiCallCount] = useState(0);
  // Track if we're analyzing a face
  const [analyzing, setAnalyzing] = useState(false);
  // Recent attendance records
  const [recentAttendance, setRecentAttendance] = useState([]);
  // Animation state for attendance marking
  const [attendanceMarking, setAttendanceMarking] = useState(false);

  // Add this new state to track users whose attendance has been marked
  const [markedAttendanceUsers, setMarkedAttendanceUsers] = useState(new Set());
  // Reference for checking marked attendance without triggering re-renders
  const markedAttendanceUsersRef = useRef(new Set());

  // Initialize the face cache hook
  const {
    checkFaceCache,
    addToFaceCache,
    createFaceCacheEntry,
    resetCache,
    getCacheStats,
  } = useFaceCache({
    maxCacheSize: 100,
    expiryTimeMs: 30 * 60 * 1000,
    distanceThreshold: 0.6,
    faceapi,
  });

  // Initialize the DB cache hook
  const { checkDbCache, storeInDbCache, resetDbCache, getDbCacheStats } =
    useDbFaceCache({
      maxCacheSize: 500,
      expiryTimeMs: 60 * 60 * 1000, // 1 hour
    });

  useEffect(() => {
    markedAttendanceUsersRef.current = markedAttendanceUsers;
  }, [markedAttendanceUsers]);

  const isAttendanceAlreadyMarked = (userId) => {
    return markedAttendanceUsersRef.current.has(userId);
  };

  const addToMarkedAttendanceUsers = (userId) => {
    const updatedSet = new Set(markedAttendanceUsersRef.current);
    updatedSet.add(userId);
    setMarkedAttendanceUsers(updatedSet);
    markedAttendanceUsersRef.current = updatedSet;
  };


  // This function attempts a match, first checking the face cache,
  // then DB cache, and finally calling the API if needed.
  const attemptMatch = async (detection) => {
    if (!detection || !detection.descriptor) {
      console.error("Invalid detection object");
      return null;
    }

    // Skip processing if an API call is already in progress
    if (apiCallInProgressRef.current) {
      console.log(
        "API call or processing already in progress; skipping this attempt"
      );
      return null;
    }

    setAnalyzing(true);
    // Set flag to prevent concurrent processing
    apiCallInProgressRef.current = true;

    try {
      const detectedHash = generateBinaryHash(detection.descriptor);
      // Create an array of hash chunks (3 chunks of 20 bits each)
      const hashArray = generateHashArrayForMatch(detectedHash);

      // STEP 1: Check if the face is already in the face cache
      const cacheResult = checkFaceCache(hashArray, detection, setMatchStatus);
      if (cacheResult) {
        apiCallInProgressRef.current = false;
        return cacheResult;
      }

      // STEP 2: Check if we have matching documents in the DB cache
      const cachedDocuments = checkDbCache(hashArray);

      if (cachedDocuments && cachedDocuments.length > 0) {
        const matchFound = matchWithDocuments(detection, cachedDocuments);

        if (matchFound) {
          console.log("Match found in DB cache for:", matchFound.name);
          const userId = matchFound.document.userId;

          // Check if attendance is already marked for this user
          if (!isAttendanceAlreadyMarked(userId)) {
            // Trigger animation state
            setAttendanceMarking(true);

            // Try marking today's attendance
            const result = await markAttendance(userId);

            // Add user to marked attendance list if successful
            if (result.attendanceMarked) {
              addToMarkedAttendanceUsers(userId);

              // Create a new record
              const newRecord = {
                name: matchFound.name,
                time: result.inTime || result.outTime,
                date: result.date,
                status: result.attendanceStatus,
                type: result.inTime && !result.outTime ? "in" : "out",
                timestamp: new Date(),
              };

              // Show toast notification
              toast.success(
                `Attendance ${
                  newRecord.type === "in" ? "check-in" : "check-out"
                } marked for ${matchFound.name}`
              );

              // Update recent attendance records
              setRecentAttendance((prev) => {
                const withoutDuplicate = prev.filter(
                  (r) =>
                    !(
                      r.name === newRecord.name &&
                      r.date === result.date &&
                      r.type === newRecord.type
                    )
                );
                return [newRecord, ...withoutDuplicate].slice(0, 10); // Keep last 10 records
              });
            } else if (result.error) {
              toast.error(`Failed to mark attendance: ${result.error}`);
            }

            setTimeout(() => setAttendanceMarking(false), 1500);
          } else {
            console.log(
              `Attendance already marked for ${matchFound.name}, skipping`
            );
          }

          // Create and store the match in face cache
          const matchInfo = {
            name: matchFound.name,
            distance: matchFound.distance,
            document: matchFound.document,
            source: "db_cache",
            attendance: isAttendanceAlreadyMarked(userId)
              ? { attendanceMarked: true }
              : null,
          };

          // Update face cache with the new match
          const newEntry = createFaceCacheEntry({
            hash: detectedHash,
            isMatched: true,
            matchInfo,
            attendanceMarked: isAttendanceAlreadyMarked(userId),
            descriptor: matchFound.descriptor,
          });

          addToFaceCache(detectedHash, newEntry);
          setMatchStatus("matched");
          apiCallInProgressRef.current = false;
          return matchInfo;
        } else {
          console.log("Documents found in DB cache but no face match");

          // Store as unmatched

          const newEntry = createFaceCacheEntry({
            hash: detectedHash,
            isMatched: false,
          });

          addToFaceCache(detectedHash, newEntry);
          setMatchStatus("unknown");
          apiCallInProgressRef.current = false;
          return { name: "Unknown", distance: 1 };
        }
      }

      // STEP 3: Call API to find matches
      setMatchStatus("loading");

      // Build query from hash chunks
      const queries = hashArray.map((chunk) => Query.contains("hash", chunk));
      try {
        // Increment API call counter
        setApiCallCount((prevCount) => prevCount + 1);

        const response = await faceService.getMatches([
          Query.or(queries),
          Query.equal("batchId", profile.batchId),
          Query.limit(2), // Increased limit to get more potential matches
        ]);

        if (response.total > 0 && Array.isArray(response.documents)) {
          // Store all documents in DB cache for future use
          storeInDbCache(response.documents);

          const matchFound = matchWithDocuments(detection, response.documents);

          if (matchFound) {
            console.log("Match found from API for:", matchFound.name);
            const userId = matchFound.document.userId;

            // Check if attendance is already marked for this user
            if (!isAttendanceAlreadyMarked(userId)) {
              // Trigger animation state
              setAttendanceMarking(true);

              // Try marking today's attendance
              const result = await markAttendance(userId);

              // Add user to marked attendance list if successful
              if (result.attendanceMarked) {
                addToMarkedAttendanceUsers(userId);

                // Create a new record
                const newRecord = {
                  name: matchFound.name,
                  time: result.inTime || result.outTime,
                  date: result.date,
                  status: result.attendanceStatus,
                  type: result.inTime && !result.outTime ? "in" : "out",
                  timestamp: new Date(),
                };

                // Show toast notification
                toast.success(
                  `Attendance ${
                    newRecord.type === "in" ? "check-in" : "check-out"
                  } marked for ${matchFound.name}`
                );

                // Update recent attendance records
                setRecentAttendance((prev) => {
                  const withoutDuplicate = prev.filter(
                    (r) =>
                      !(
                        r.name === newRecord.name &&
                        r.date === result.date &&
                        r.type === newRecord.type
                      )
                  );
                  return [newRecord, ...withoutDuplicate].slice(0, 10); // Keep last 10 records
                });
              } else if (result.error) {
                toast.error(`Failed to mark attendance: ${result.error}`);
              }

              setTimeout(() => setAttendanceMarking(false), 1500);
            } else {
              console.log(
                `Attendance already marked for ${matchFound.name}, skipping`
              );
            }

            // Create and store match
            const matchInfo = {
              name: matchFound.name,
              distance: matchFound.distance,
              document: matchFound.document,
              source: "api_call",
              attendance: isAttendanceAlreadyMarked(userId)
                ? { attendanceMarked: true }
                : null,
            };

            const newEntry = createFaceCacheEntry({
              hash: detectedHash,
              isMatched: true,
              matchInfo,
              attendanceMarked: isAttendanceAlreadyMarked(userId),
              descriptor: matchFound.descriptor,
            });

            addToFaceCache(detectedHash, newEntry);

            setMatchStatus("matched");
            return matchInfo;
          } else {
            // No match was found despite getting documents from DB
            toast.error("Face not recognized in our system");

            const newEntry = createFaceCacheEntry({
              hash: detectedHash,
              isMatched: false,
            });

            addToFaceCache(detectedHash, newEntry);

            setMatchStatus("unknown");
            return { name: "Unknown", distance: 0 };
          }
        } else {
          // No documents found in DB
          toast.error("No matching face found in database");

          const newEntry = createFaceCacheEntry({
            hash: detectedHash,
            isMatched: false,
          });

          addToFaceCache(detectedHash, newEntry);

          setMatchStatus("unknown");
          return { name: "Unknown", distance: 0 };
        }
      } catch (error) {
        console.error("Error matching face:", error);
        toast.error(`Error: ${error.message || "Failed to match face"}`);
        setMatchStatus(null);
        return null;
      } finally {
        // Reset the API call flag once the call is complete
        apiCallInProgressRef.current = false;
      }
    } catch (error) {
      console.error("Error in face matching process:", error);
      apiCallInProgressRef.current = false;
      return null;
    } finally {
      setAnalyzing(false);
      apiCallInProgressRef.current = false;
    }
  };

  // Helper: Given a detection and a list of documents, find the best matching document
  const matchWithDocuments = (detection, documents) => {
    if (!detection || !detection.descriptor || !Array.isArray(documents)) {
      console.error("Invalid input to matchWithDocuments");
      return null;
    }

    const threshold = 0.4;
    let bestMatch = null;
    let bestDistance = threshold;

    for (const doc of documents) {
      if (!doc.descriptor || !Array.isArray(doc.descriptor)) continue;

      const storedDescriptors = doc.descriptor
        .map((desc) => {
          try {
            return Object.values(JSON.parse(desc));
          } catch (e) {
            console.error("Error parsing descriptor:", e);
            return null;
          }
        })
        .filter((d) => d);

      for (const storedDesc of storedDescriptors) {
        if (detection.descriptor.length !== storedDesc.length) continue;

        const distance = faceapi.euclideanDistance(
          detection.descriptor,
          storedDesc
        );

        // Find the best (lowest distance) match
        if (distance < bestDistance) {
          bestMatch = {
            name: doc.name,
            distance,
            descriptor: storedDesc,
            document: doc, // Store the entire document for reference
          };
          bestDistance = distance;
        }
      }
    }

    return bestMatch;
  };

  const markAttendance = async (userId) => {
    try {
      const now = new Date();
      const formattedTodaysDate = format(now, "yyyy-MM-dd");
      const currentTime = format(now, "HH:mm");

      // Determine if it's time to mark outTime (after 13:00)
      const isAfter1PM = now.getHours() >= 13;

      // Fetch current attendance data in one call
      const data = await attendanceService.getUserAttendance(
        userId,
        profile.batchId
      );
      const attendanceRecords = data?.attendanceRecords || [];
      const todaysAttendance = attendanceRecords.find(
        (record) => record.date === formattedTodaysDate
      );

      // If attendance exists for today
      if (todaysAttendance) {
        // If after 1:00 PM and outTime is not set, update the outTime
        if (isAfter1PM && !todaysAttendance.outTime) {
          const updatedRecord = {
            ...todaysAttendance,
            outTime: currentTime,
          };

          // Update the existing record with outTime
          await attendanceService.markUserAttendance({
            userId,
            batchId: profile.batchId,
            attendanceRecords: [updatedRecord],
          });

          console.log("Out-time marked successfully");
          return {
            ...updatedRecord,
            attendanceMarked: true,
          };
        }

        console.log("Attendance already marked for today");
        return {
          ...todaysAttendance,
          attendanceMarked: true,
        };
      }

      // Create new attendance record
      const newRecord = {
        date: formattedTodaysDate,
        attendanceStatus: "Present",
        inTime: currentTime,
        outTime: isAfter1PM ? currentTime : "", // Set outTime immediately if after 1:00 PM
      };

      // Structure for the complete record
      const record = {
        userId,
        batchId: profile.batchId,
        attendanceRecords: [newRecord], //PUSH THIS NEW RECORD
      };

      // Mark attendance
      await attendanceService.markUserAttendance(record);

      console.log("Attendance marked successfully");
      return {
        ...newRecord,
        attendanceMarked: true,
      };
    } catch (error) {
      console.error("Attendance marking error:", error);
      return {
        attendanceMarked: false,
        userId,
        error: error.message,
      };
    }
  };

  // Also update the resetCaches function to clear the marked attendance users
  const resetCaches = () => {
    resetCache(); // Reset face cache
    resetDbCache(); //Reset Db Cache
    setMarkedAttendanceUsers(new Set());
    markedAttendanceUsersRef.current = new Set();
    setApiCallCount(0);
    setMatchStatus(null);
    setResultMessage("");
    toast.success("Recognition system reset successfully");
  };

  // Clear recent attendance records
  const clearAttendanceLog = () => {
    setRecentAttendance([]);
    toast.success("Attendance log cleared");
  };

  // Set up detection interval that uses the integrated face detection
  useEffect(() => {
    let intervalId;
    // Update detection every 500ms with match attempt integration
    intervalId = setInterval(async () => {
      await detectFace(attemptMatch);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [detectFace]); // Remove unnecessary dependencies

  // Determine status color based on match status
  const getStatusColor = () => {
    switch (matchStatus) {
      case "matched":
        return "text-green-500";
      case "unknown":
        return "text-red-500";
      case "loading":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  // Format time for display
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";

    const minutesAgo = Math.floor(
      (new Date() - new Date(timestamp)) / (1000 * 60)
    );

    if (minutesAgo < 1) return "Just now";
    if (minutesAgo === 1) return "1 minute ago";
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo === 1) return "1 hour ago";
    if (hoursAgo < 24) return `${hoursAgo} hours ago`;

    return format(new Date(timestamp), "MMM dd, HH:mm");
  };

  const cacheStats = getCacheStats();
  // Use cache stats for display
  const dbCacheStats = getDbCacheStats();

  return (
    <div className="flex flex-col gap-6 bg-white  rounded-lg">
      {/* Top Section - Header and Attendance List */}
      <div className="bg-gray-200  rounded-lg shadow-sm  p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
          <h2 className="text-xl font-bold text-gray-800">Face Recognition</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={resetCaches}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
            >
              <RefreshCw size={16} className="mr-1" />
              Reset
            </button>
            <button
              onClick={clearAttendanceLog}
              className="flex items-center bg-white hover:bg-white text-gray-700 px-3 py-1 rounded-md text-sm transition-colors duration-200"
            >
              <Clock size={16} className="mr-1" />
              Clear Log
            </button>
          </div>
        </div>

        {/* Status and Processing Messages */}
        <div className="mb-4">
          {resultMessage && (
            <div
              className={`flex items-center p-3 mb-2 rounded-md bg-gray-50 ${getStatusColor()}`}
            >
              {matchStatus === "matched" && (
                <UserCheck size={20} className="mr-2" />
              )}
              {matchStatus === "unknown" && (
                <UserX size={20} className="mr-2" />
              )}
              {matchStatus === "loading" && (
                <RefreshCw size={20} className="mr-2 animate-spin" />
              )}
              {!matchStatus && <AlertCircle size={20} className="mr-2" />}
              <p className="text-sm font-medium">{resultMessage}</p>
            </div>
          )}

          {analyzing && (
            <div className="flex items-center justify-center p-2 bg-blue-50 rounded-md">
              <RefreshCw
                size={16}
                className="text-blue-500 animate-spin mr-2"
              />
              <span className="text-sm text-blue-500">Processing...</span>
            </div>
          )}
        </div>

        {/* Attendance Log */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-semibold text-gray-700 flex items-center">
              <Calendar size={16} className="mr-2" />
              Recent Attendance
            </h3>
            <span className="text-xs text-gray-500">
              {recentAttendance.length} records
            </span>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {recentAttendance.map((record, index) => (
                <div
                  key={`${record.name}-${record.date}-${record.type}-${index}`}
                  className={`flex items-center justify-between p-2 rounded-md ${
                    record.type === "in" ? "bg-green-50" : "bg-blue-50"
                  } border-l-4 ${
                    record.type === "in"
                      ? "border-green-500"
                      : "border-blue-500"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-1.5 rounded-full mr-3 ${
                        record.type === "in"
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {record.type === "in" ? (
                        <UserCheck size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{record.name}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{record.date}</span>
                        <span className="mx-1">•</span>
                        <span>{record.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(record.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Statistics */}
      <div className="bg-gray-200 rounded-lg shadow-sm p-4">
        <h3 className="text-md font-semibold text-gray-700 mb-3">
          System Statistics
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-md transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Face Cache</p>
              <span className="text-sm font-semibold">{cacheStats.size}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Hit Rate: {cacheStats.hitRate}
            </div>
          </div>
          <div className="bg-white p-3 rounded-md transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">DB Cache</p>
              <span className="text-sm font-semibold">{dbCacheStats.size}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
               Hit Rate:{" "}
              {dbCacheStats.hitRate}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">API Calls</p>
              <span className="text-sm font-semibold">{apiCallCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Absolute positioned attendance marking animation */}
      {attendanceMarking && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center justify-center">
              <div className="bg-green-500 text-white rounded-full p-2 mr-3">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-green-700 font-semibold">
                  Marking Attendance
                </h3>
                <p className="text-green-600 text-sm">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchFaceMode;
