import { Query } from "appwrite";
import { useEffect, useRef, useState } from "react";
import { generateBinaryHash } from "./util";
import { faceService } from "../../../../../appwrite/faceService";
import {
  UserCheck,
  UserX,
  Database,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const MatchFaceMode = ({
  faceapi,
  detectFace,
  resultMessage,
  setResultMessage,
}) => {
  const [matchStatus, setMatchStatus] = useState(null); // 'matched', 'unknown', 'loading', null
  // Cache for detected faces
  const [faceCache, setFaceCache] = useState(new Map());
  // Cache for database responses
  const [dbResponseCache, setDbResponseCache] = useState(new Map());
  // Ref to track if an API call is currently in progress
  const apiCallInProgressRef = useRef(false);
  // Use refs to access the latest cache values without re-rendering
  const faceCacheRef = useRef(new Map());
  const dbResponseCacheRef = useRef(new Map());
  // Track total API calls
  const [apiCallCount, setApiCallCount] = useState(0);
  // Track if we're analyzing a face
  const [analyzing, setAnalyzing] = useState(false);

  // Update the refs whenever cache states change
  useEffect(() => {
    faceCacheRef.current = faceCache;
  }, [faceCache]);

  useEffect(() => {
    dbResponseCacheRef.current = dbResponseCache;
  }, [dbResponseCache]);

  // Standardized function to create face cache entry
  const createFaceCacheEntry = (hash, isMatched, matchInfo = null) => {
    return {
      detectedHash: hash,
      isMatched: isMatched,
      attendanceMarked: false,
      message: isMatched
        ? {
            name: matchInfo.name,
            distance: matchInfo.distance,
            matchSource: matchInfo.source || "unknown",
            document: matchInfo.document || null,
          }
        : { name: "Unknown", distance: 1 },
    };
  };

  // Check if face is in DB response cache - optimized to return all matching documents at once
  const checkDbCache = (hashArray) => {
    const currentDbCache = dbResponseCacheRef.current;
    console.log("Checking DB cache with hash chunks:", hashArray);

    // Collect all matching documents
    const matchingDocuments = new Set();

    for (const dbHash of currentDbCache.keys()) {
      for (const hash of hashArray) {
        if (dbHash.includes(hash)) {
          const documents = currentDbCache.get(dbHash);
          if (Array.isArray(documents)) {
            documents.forEach((doc) => matchingDocuments.add(doc));
          }
        }
      }
    }

    if (matchingDocuments.size === 0) {
      console.log("No match found in DB cache");
      return null;
    }

    console.log(`Found ${matchingDocuments.size} unique documents in DB cache`);
    return Array.from(matchingDocuments);
  };

  // Store documents in DB cache - optimized to avoid duplicates
  const storeInDbCache = (documents) => {
    if (!documents || !Array.isArray(documents) || documents.length === 0)
      return;

    console.log(`Storing ${documents.length} documents in DB cache`);
    const currentDbCache = new Map(dbResponseCacheRef.current);

    documents.forEach((doc) => {
      if (doc.hash && Array.isArray(doc.hash)) {
        // For each hash in the document, store the entire document list
        doc.hash.forEach((hashKey) => {
          const existingDocs = currentDbCache.get(hashKey) || [];
          // Add document if not already in the list
          if (
            !existingDocs.some((existingDoc) => existingDoc.$id === doc.$id)
          ) {
            currentDbCache.set(hashKey, [...existingDocs, doc]);
          }
        });
        console.log(
          `Cached document "${doc.name}" with ${doc.hash.length} hash entries`
        );
      }
    });

    // Update both state and ref
    setDbResponseCache(currentDbCache);
    dbResponseCacheRef.current = currentDbCache;
  };

  // This function attempts a match, first checking the face cache,
  // then DB cache, and finally calling the API if needed.
  const attemptMatch = async (detection) => {
    if (!detection || !detection.descriptor) {
      console.error("Invalid detection object");
      return null;
    }

    setAnalyzing(true);

    try {
      const detectedHash = generateBinaryHash(detection.descriptor);
      // Create an array of hash chunks (3 chunks of 20 bits each)
      const hashArray = (detectedHash.match(/.{1,20}/g) || []).slice(0, 3);
      const currentFaceCache = faceCacheRef.current;

      // STEP 1: Check if the face is already in the face cache
      console.log("Total keys in face cache:", currentFaceCache.size);

      // Try to find an exact hash match first (most efficient)
      if (currentFaceCache.has(detectedHash)) {
        const cachedEntry = currentFaceCache.get(detectedHash);
        console.log("Exact hash match found in face cache");

        // If already matched, return the cached result
        if (cachedEntry.isMatched) {
          setMatchStatus("matched");
          return cachedEntry.message;
        } else {
          // If not matched, check with DB cache again
          console.log("Face previously unmatched, checking DB cache again");
          // Continue to DB cache checking (don't return here)
        }
      }

      // Try to find a partial hash match
      let partialMatchFound = false;
      for (const [cacheHash, cacheEntry] of currentFaceCache.entries()) {
        if (hashArray.some((hash) => cacheHash.includes(hash))) {
          console.log("Partial hash match found in face cache");

          // If already matched, return the cached result
          if (cacheEntry.isMatched) {
            partialMatchFound = true;
            setMatchStatus("matched");
            return cacheEntry.message;
          } else {
            // If not matched, we'll continue to DB checking
            partialMatchFound = true;
            console.log("Face previously unmatched, continuing to DB check");
            break;
          }
        }
      }

      if (!partialMatchFound) {
        console.log("No match in face cache, checking DB cache");
      }

      // STEP 2: Check if we have matching documents in the DB cache
      const cachedDocuments = checkDbCache(hashArray);

      if (cachedDocuments && cachedDocuments.length > 0) {
        console.log(
          `Found ${cachedDocuments.length} documents in DB cache, attempting to match`
        );
        const matchFound = matchWithDocuments(detection, cachedDocuments);

        if (matchFound) {
          console.log("Match found in DB cache for:", matchFound.name);

          // Create and store the match in face cache
          const matchInfo = {
            name: matchFound.name,
            distance: matchFound.distance,
            document: matchFound.document,
            source: "db_cache",
          };

          // Update face cache with the new match
          const newEntry = createFaceCacheEntry(detectedHash, true, matchInfo);
          const newFaceCache = new Map(currentFaceCache);
          newFaceCache.set(detectedHash, newEntry);
          setFaceCache(newFaceCache);
          faceCacheRef.current = newFaceCache;

          setMatchStatus("matched");
          return matchInfo;
        } else {
          console.log("Documents found in DB cache but no face match");

          // Store as unmatched
          const newEntry = createFaceCacheEntry(detectedHash, false);
          const newFaceCache = new Map(currentFaceCache);
          newFaceCache.set(detectedHash, newEntry);
          setFaceCache(newFaceCache);
          faceCacheRef.current = newFaceCache;

          setMatchStatus("unknown");
          return { name: "Unknown", distance: 1 };
        }
      }

      console.log(
        "No matching documents in DB cache; preparing to query database"
      );

      // STEP 3: Don't call API if a call is already in progress
      if (apiCallInProgressRef.current) {
        console.log("API call already in progress; skipping this attempt");
        return null;
      }

      // Mark API call as in progress
      apiCallInProgressRef.current = true;
      setMatchStatus("loading");

      // Build query from hash chunks
      const queries = hashArray.map((chunk) => Query.contains("hash", chunk));
      try {
        // Increment API call counter
        setApiCallCount((prevCount) => prevCount + 1);

        const response = await faceService.getMatches([
          Query.or(queries),
          Query.limit(10), // Increased limit to get more potential matches
        ]);

        if (response.total > 0 && Array.isArray(response.documents)) {
          // Store all documents in DB cache for future use
          storeInDbCache(response.documents);

          const matchFound = matchWithDocuments(detection, response.documents);

          if (matchFound) {
            console.log("Match found from API for:", matchFound.name);

            // Create and store match
            const matchInfo = {
              name: matchFound.name,
              distance: matchFound.distance,
              document: matchFound.document,
              source: "api_call",
            };

            const newEntry = createFaceCacheEntry(
              detectedHash,
              true,
              matchInfo
            );

            const newFaceCache = new Map(currentFaceCache);
            newFaceCache.set(detectedHash, newEntry);
            setFaceCache(newFaceCache);
            faceCacheRef.current = newFaceCache;

            setMatchStatus("matched");
            return matchInfo;
          } else {
            // No match was found despite getting documents from DB
            console.log("Documents found from API but no face match");

            const newEntry = createFaceCacheEntry(detectedHash, false);

            const newFaceCache = new Map(currentFaceCache);
            newFaceCache.set(detectedHash, newEntry);
            setFaceCache(newFaceCache);
            faceCacheRef.current = newFaceCache;

            setMatchStatus("unknown");
            return { name: "Unknown", distance: 0 };
          }
        } else {
          // No documents found in DB
          console.log("No documents found in database - storing as unknown");

          const newEntry = createFaceCacheEntry(detectedHash, false);

          const newFaceCache = new Map(currentFaceCache);
          newFaceCache.set(detectedHash, newEntry);
          setFaceCache(newFaceCache);
          faceCacheRef.current = newFaceCache;

          setMatchStatus("unknown");
          return { name: "Unknown", distance: 0 };
        }
      } catch (error) {
        console.error("Error matching face:", error);
        setMatchStatus(null);
        return null;
      } finally {
        // Reset the API call flag once the call is complete
        apiCallInProgressRef.current = false;
      }
    } finally {
      setAnalyzing(false);
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
            document: doc, // Store the entire document for reference
          };
          bestDistance = distance;
        }
      }
    }

    return bestMatch;
  };

  // Function to mark attendance
  const markAttendance = (faceHash) => {
    if (faceCacheRef.current.has(faceHash)) {
      const newCache = new Map(faceCacheRef.current);
      const faceData = { ...newCache.get(faceHash) };

      // Update the attendance field
      faceData.attendanceMarked = true;
      newCache.set(faceHash, faceData);

      // Update both state and ref
      setFaceCache(newCache);
      faceCacheRef.current = newCache;

      return true;
    }
    return false;
  };

  // Function to reset caches
  const resetCaches = () => {
    setFaceCache(new Map());
    setDbResponseCache(new Map());
    faceCacheRef.current = new Map();
    dbResponseCacheRef.current = new Map();
    setApiCallCount(0);
    setMatchStatus(null);
    setResultMessage("");
  };

  // Set up detection interval that uses the integrated face detection
  useEffect(() => {
    let intervalId;

    // Update detection every 500ms with match attempt integration
    intervalId = setInterval(async () => {
      await detectFace(attemptMatch);
    }, 500);

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

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Face Recognition</h2>
        <button
          onClick={resetCaches}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
        >
          <RefreshCw size={16} className="mr-1" />
          Reset
        </button>
      </div>

      {/* Status message */}
      {resultMessage && (
        <div
          className={`flex items-center p-3 mb-4 rounded-md bg-gray-50 ${getStatusColor()}`}
        >
          {matchStatus === "matched" && (
            <UserCheck size={20} className="mr-2" />
          )}
          {matchStatus === "unknown" && <UserX size={20} className="mr-2" />}
          {matchStatus === "loading" && (
            <RefreshCw size={20} className="mr-2 animate-spin" />
          )}
          {!matchStatus && <AlertCircle size={20} className="mr-2" />}
          <p className="text-sm font-medium">{resultMessage}</p>
        </div>
      )}

      {/* Statistics grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Face Cache</p>
            <span className="text-sm font-semibold">{faceCache.size}</span>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">DB Cache</p>
            <span className="text-sm font-semibold">
              {dbResponseCache.size}
            </span>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">API Calls</p>
            <span className="text-sm font-semibold">{apiCallCount}</span>
          </div>
        </div>
      </div>

      {/* Processing indicator */}
      {analyzing && (
        <div className="flex items-center justify-center p-2 mb-4">
          <RefreshCw size={16} className="text-blue-500 animate-spin mr-2" />
          <span className="text-sm text-blue-500">Processing...</span>
        </div>
      )}

      {/* Database info */}
      <div className="flex items-center text-xs text-gray-500 mt-2">
        <Database size={14} className="mr-1" />
        <span>Face recognition powered by Appwrite</span>
      </div>
    </div>
  );
};

export default MatchFaceMode;
