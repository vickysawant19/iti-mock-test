import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Custom hook for managing database response cache in face recognition system
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.maxCacheSize - Maximum number of entries in the cache
 * @param {number} options.expiryTimeMs - Time in milliseconds before a cache entry expires
 * @returns {Object} - DB cache management functions and state
 */
const useDbFaceCache = ({
  maxCacheSize = 500,
  expiryTimeMs = 60 * 60 * 1000, // 60 minutes
} = {}) => {
  // Cache state
  const [dbCache, setDbCache] = useState(new Map());
  // Performance metrics
  const [dbLookups, setDbLookups] = useState(0);
  const [dbHits, setDbHits] = useState(0);
  
  // Refs for accessing latest values without re-renders
  const dbCacheRef = useRef(new Map());
  const dbOperationInProgressRef = useRef(false);
  
  // Update ref when cache state changes
  useEffect(() => {
    dbCacheRef.current = dbCache;
  }, [dbCache]);

  /**
   * Checks if documents matching the hash array exist in DB cache
   * Returns all matching documents at once
   * 
   * @param {Array} hashArray - Array of hash chunks to search for
   * @returns {Array|null} - Array of matching documents or null if none found
   */
  const checkDbCache = useCallback((hashArray) => {
    if (!hashArray || !Array.isArray(hashArray) || hashArray.length === 0) {
      return null;
    }
    
    // Increment lookup counter
    setDbLookups(prev => prev + 1);
    
    const currentDbCache = dbCacheRef.current;
    
    // Collect all matching documents (using Set to avoid duplicates)
    const matchingDocuments = new Set();
    let foundMatch = false;

    for (const dbHash of currentDbCache.keys()) {
      for (const hash of hashArray) {
        if (dbHash.includes(hash)) {
          const documents = currentDbCache.get(dbHash);
          if (Array.isArray(documents)) {
            foundMatch = true;
            documents.forEach((doc) => matchingDocuments.add(doc));
          }
        }
      }
    }

    if (matchingDocuments.size === 0) {
      return null;
    }

    // Increment hit counter when cache is hit
    if (foundMatch) {
      setDbHits(prev => prev + 1);
    }
    
    return Array.from(matchingDocuments);
  }, []);

  /**
   * Stores documents in DB cache, optimized to avoid duplicates
   * 
   * @param {Array} documents - Documents to store in cache
   */
  const storeInDbCache = useCallback((documents) => {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return;
    }

    if (dbOperationInProgressRef.current) {
      return; // Skip if another operation is in progress
    }

    dbOperationInProgressRef.current = true;
    
    try {
      const currentDbCache = new Map(dbCacheRef.current);
      const now = Date.now();

      documents.forEach((doc) => {
        if (doc.hash && Array.isArray(doc.hash)) {
          // For each hash in the document, store the entire document list
          doc.hash.forEach((hashKey) => {
            const existingDocs = currentDbCache.get(hashKey) || [];
            
            // Add document if not already in the list
            if (!existingDocs.some((existingDoc) => existingDoc.$id === doc.$id)) {
              // Add timestamp for cache expiration
              const docWithTimestamp = { 
                ...doc, 
                _cacheTimestamp: now 
              };
              
              currentDbCache.set(hashKey, [...existingDocs, docWithTimestamp]);
            }
          });
        }
      });

      // Update both state and ref
      setDbCache(currentDbCache);
      dbCacheRef.current = currentDbCache;
      
      // Clean up cache if it exceeds size limit
      if (currentDbCache.size > maxCacheSize) {
        cleanupDbCache();
      }
    } finally {
      dbOperationInProgressRef.current = false;
    }
  }, [maxCacheSize]);

  /**
   * Cleans up expired and excess DB cache entries
   */
  const cleanupDbCache = useCallback(() => {
    if (dbOperationInProgressRef.current) {
      return; // Skip if another operation is in progress
    }

    dbOperationInProgressRef.current = true;
    
    try {
      const now = Date.now();
      const newDbCache = new Map();
      
      // Clean expired entries
      for (const [hash, documents] of dbCacheRef.current.entries()) {
        if (!Array.isArray(documents)) continue;
        
        // Filter out expired documents
        const validDocs = documents.filter(doc => 
          doc._cacheTimestamp && (now - doc._cacheTimestamp) < expiryTimeMs
        );
        
        if (validDocs.length > 0) {
          newDbCache.set(hash, validDocs);
        }
      }
      
      // If cache is still too large, remove oldest entries
      if (newDbCache.size > maxCacheSize) {
        // Sort entries by oldest timestamp (of the newest doc in each hash group)
        const sortedEntries = [...newDbCache.entries()]
          .sort((a, b) => {
            const aNewestTime = Math.max(...a[1].map(doc => doc._cacheTimestamp || 0));
            const bNewestTime = Math.max(...b[1].map(doc => doc._cacheTimestamp || 0));
            return aNewestTime - bNewestTime;
          });
        
        const toKeep = sortedEntries.slice(-maxCacheSize);
        newDbCache.clear();
        
        for (const [hash, docs] of toKeep) {
          newDbCache.set(hash, docs);
        }
      }
      
      setDbCache(newDbCache);
      dbCacheRef.current = newDbCache;
    } finally {
      dbOperationInProgressRef.current = false;
    }
  }, [expiryTimeMs, maxCacheSize]);

  /**
   * Reset the DB cache and metrics
   */
  const resetDbCache = useCallback(() => {
    if (dbOperationInProgressRef.current) {
      return; // Skip if another operation is in progress
    }

    dbOperationInProgressRef.current = true;
    
    try {
      setDbCache(new Map());
      dbCacheRef.current = new Map();
      setDbLookups(0);
      setDbHits(0);
    } finally {
      dbOperationInProgressRef.current = false;
    }
  }, []);

  /**
   * Get cache statistics
   */
  const getDbCacheStats = useCallback(() => {
    // Count total cached documents
    let totalDocuments = 0;
    dbCacheRef.current.forEach(docs => {
      if (Array.isArray(docs)) {
        totalDocuments += docs.length;
      }
    });
    
    const hitRate = dbLookups > 0 ? (dbHits / dbLookups) * 100 : 0;
    
    return {
      size: dbCache.size,
      totalDocuments,
      lookups: dbLookups,
      hits: dbHits,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }, [dbCache.size, dbLookups, dbHits]);

  /**
   * Get a document by ID from the cache
   */
  const getDocumentById = useCallback((id) => {
    if (!id) return null;
    
    for (const [, documents] of dbCacheRef.current.entries()) {
      if (!Array.isArray(documents)) continue;
      
      const found = documents.find(doc => doc.$id === id);
      if (found) return found;
    }
    
    return null;
  }, []);

  // Schedule periodic cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupDbCache, expiryTimeMs / 2);
    return () => clearInterval(cleanupInterval);
  }, [cleanupDbCache, expiryTimeMs]);

  return {
    // State
    dbCache,
    // Methods
    checkDbCache,
    storeInDbCache,
    cleanupDbCache,
    resetDbCache,
    getDocumentById,
    // Stats
    getDbCacheStats,
  };
};

export default useDbFaceCache;