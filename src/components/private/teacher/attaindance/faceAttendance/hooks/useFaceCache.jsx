import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Custom hook for managing face recognition cache
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.maxCacheSize - Maximum number of entries in the cache
 * @param {number} options.expiryTimeMs - Time in milliseconds before a cache entry expires
 * @param {number} options.distanceThreshold - Threshold for face similarity (0-1)
 * @returns {Object} - Face cache management functions and state
 */
const useFaceCache = ({
  maxCacheSize = 100,
  expiryTimeMs = 30 * 60 * 1000, // 30 minutes
  distanceThreshold = 0.6,
  faceapi
} = {}) => {
  // Cache state
  const [faceCache, setFaceCache] = useState(new Map());
  // Performance metrics
  const [cacheLookups, setCacheLookups] = useState(0);
  const [cacheHits, setCacheHits] = useState(0);
  
  // Refs for accessing latest values without re-renders
  const faceCacheRef = useRef(new Map());
  const cacheOperationInProgressRef = useRef(false);
  
  // Update ref when cache state changes
  useEffect(() => {
    faceCacheRef.current = faceCache;
  }, [faceCache]);

  /**
   * Creates a standardized face cache entry
   */
  const createFaceCacheEntry = useCallback(({
    hash,
    isMatched,
    matchInfo = null,
    attendanceMarked = false,
    descriptor,
  }) => {
    return {
      detectedHash: hash,
      isMatched,
      attendanceMarked,
      descriptor,
      timestamp: Date.now(),
      message: isMatched
        ? {
            name: matchInfo.name,
            distance: matchInfo.distance,
            confidence: ((1 - matchInfo.distance) * 100).toFixed(1) + '%',
            matchSource: matchInfo.source || "unknown",
          }
        : { name: "Unknown", distance: 1 },
    };
  }, []);

  /**
   * Checks if a face is in the cache
   */
  const checkFaceCache = useCallback((hashArray, detection, setMatchStatus) => {
    if (!hashArray || !Array.isArray(hashArray)) {
      return false;
    }
    
    // Increment lookup counter
    setCacheLookups(prev => prev + 1);
    
    const currentFaceCache = faceCacheRef.current;
    let partialMatchFound = false;
    
    for (const [cacheHash, cacheEntry] of currentFaceCache.entries()) {
      // Check if any hash in the array is included in a cached hash
      if (hashArray.some((hash) => cacheHash.includes(hash))) {
        // Increment hit counter when cache is hit
        setCacheHits(prev => prev + 1);
        partialMatchFound = true;
        
        // If there's a detection object and the cache entry was previously matched
        if (detection && cacheEntry.isMatched && cacheEntry.descriptor) {
          try {
            // Calculate new distance between current detection and cached descriptor
            const currentDistance = faceapi.euclideanDistance(detection.descriptor, cacheEntry.descriptor);
            
            // Only return as matched if the distance is below threshold (more similar)
            if (currentDistance <= distanceThreshold) {
              setMatchStatus && setMatchStatus("matched");
              return {
                ...cacheEntry.message,
                distance: currentDistance,
                confidence: ((1 - currentDistance) * 100).toFixed(1) + '%'
              };
            } else {
              // The face has drifted too much from cached version
              setMatchStatus && setMatchStatus("unknown");
              return { 
                name: "Unknown", 
                distance: currentDistance,
                note: "Face detected but similarity too low"
              };
            }
          } catch (error) {
            console.error("Error calculating face distance:", error);
            // Fall back to original cache decision if distance calculation fails
            if (cacheEntry.isMatched) {
              setMatchStatus && setMatchStatus("matched");
              return cacheEntry.message;
            }
          }
        } 
        
        // If no detection object or no descriptor in cache entry
        // fall back to original cached result
        if (cacheEntry.isMatched) {
          setMatchStatus && setMatchStatus("matched");
          return cacheEntry.message;
        } else {
          setMatchStatus && setMatchStatus("unknown");
          return cacheEntry.message;
        }
      }
    }
  
    // No match in cache
    return partialMatchFound ? false : false;
  }, [distanceThreshold, faceapi]);

  /**
   * Adds a face to the cache
   */
  const addToFaceCache = useCallback((hash, entry) => {
    if (cacheOperationInProgressRef.current) {
      return; // Skip if another operation is in progress
    }

    cacheOperationInProgressRef.current = true;
    
    try {
      const newFaceCache = new Map(faceCacheRef.current);
      newFaceCache.set(hash, entry);
      
      setFaceCache(newFaceCache);
      faceCacheRef.current = newFaceCache;
      
      // Clean up cache if it exceeds size limit
      if (newFaceCache.size > maxCacheSize) {
        cleanupCache();
      }
    } finally {
      cacheOperationInProgressRef.current = false;
    }
  }, [maxCacheSize]);

  /**
   * Cleans up expired and excess cache entries
   */
  const cleanupCache = useCallback(() => {
    if (cacheOperationInProgressRef.current) {
      return; // Skip if another operation is in progress
    }

    cacheOperationInProgressRef.current = true;
    
    try {
      const now = Date.now();
      const newFaceCache = new Map();
      
      // Keep only non-expired entries
      for (const [hash, entry] of faceCacheRef.current.entries()) {
        if (entry.timestamp && now - entry.timestamp < expiryTimeMs) {
          newFaceCache.set(hash, entry);
        }
      }
      
      // If cache is still too large, remove oldest entries
      if (newFaceCache.size > maxCacheSize) {
        const sortedEntries = [...newFaceCache.entries()]
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toKeep = sortedEntries.slice(-maxCacheSize);
        newFaceCache.clear();
        
        for (const [hash, entry] of toKeep) {
          newFaceCache.set(hash, entry);
        }
      }
      
      setFaceCache(newFaceCache);
      faceCacheRef.current = newFaceCache;
    } finally {
      cacheOperationInProgressRef.current = false;
    }
  }, [expiryTimeMs, maxCacheSize]);

  /**
   * Reset the cache and metrics
   */
  const resetCache = useCallback(() => {
    if (cacheOperationInProgressRef.current) {
      return; // Skip if another operation is in progress
    }

    cacheOperationInProgressRef.current = true;
    
    try {
      setFaceCache(new Map());
      faceCacheRef.current = new Map();
      setCacheLookups(0);
      setCacheHits(0);
    } finally {
      cacheOperationInProgressRef.current = false;
    }
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    const hitRate = cacheLookups > 0 ? (cacheHits / cacheLookups) * 100 : 0;
    
    return {
      size: faceCache.size,
      lookups: cacheLookups,
      hits: cacheHits,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }, [faceCache.size, cacheLookups, cacheHits]);

  // Schedule periodic cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupCache, expiryTimeMs / 2);
    return () => clearInterval(cleanupInterval);
  }, [cleanupCache, expiryTimeMs]);

  return {
    // State
    faceCache,
    // Methods
    checkFaceCache,
    addToFaceCache,
    createFaceCacheEntry,
    cleanupCache,
    resetCache,
    // Stats
    getCacheStats,
  };
};

export default useFaceCache;