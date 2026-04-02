import { useState, useEffect, useCallback } from "react";
import { Query } from "appwrite";
import { appwriteService } from "../../../appwrite/appwriteConfig";
import conf from "../../../config/config";

const LIMIT = 100;

export const useTrades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [filter, setFilter] = useState("all"); // "all" | "active" | "inactive"
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCounts = useCallback(async () => {
    try {
      const activeRes = await appwriteService.getAllDocumentsPaginated(
        conf.tradeCollectionId,
        [Query.equal("isActive", true)],
        1,
        0
      );
      const inactiveRes = await appwriteService.getAllDocumentsPaginated(
        conf.tradeCollectionId,
        [Query.equal("isActive", false)],
        1,
        0
      );
      setActiveCount(activeRes.total);
      setInactiveCount(inactiveRes.total);
    } catch (error) {
      console.error("Error fetching trade counts:", error);
    }
  }, []);

  const fetchTrades = useCallback(async (loadMore = false) => {
    if (loading) return;

    setLoading(true);
    const currentOffset = loadMore ? offset : 0;

    let queries = [Query.orderDesc("$createdAt")];

    // Filter by Active/Inactive
    if (filter === "active") {
      queries.push(Query.equal("isActive", true));
    } else if (filter === "inactive") {
      queries.push(Query.equal("isActive", false));
    }

    // Server-side search
    if (searchTerm.trim()) {
      // Searching by tradeName. 
      // Note: This requires a full-text index on tradeName OR it might use substring comparison
      queries.push(Query.contains("tradeName", searchTerm.trim()));
    }

    try {
      const res = await appwriteService.getAllDocumentsPaginated(
        conf.tradeCollectionId,
        queries,
        LIMIT,
        currentOffset
      );

      if (loadMore) {
        setTrades((prev) => [...prev, ...res.documents]);
      } else {
        setTrades(res.documents);
      }

      setOffset(currentOffset + LIMIT);
      setTotal(res.total);
      setHasMore(currentOffset + LIMIT < res.total);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, offset, filter, searchTerm]);

  // Initial fetch and filter/search change
  useEffect(() => {
    // We reset the list when filter or search term changes
    setTrades([]);
    setOffset(0);
    setHasMore(true);
    // Directly calling fetchTrades(false) here might result in using stale offset state
    // because fetchTrades is a callback. 
    // However, fetchTrades(false) forces currentOffset to 0.
    fetchTrades(false);
    fetchCounts();
  }, [filter, searchTerm, fetchCounts]); 

  // Refresh helper
  const refresh = () => {
    setOffset(0);
    setHasMore(true);
    fetchTrades(false);
    fetchCounts();
  };

  return {
    trades,
    loading,
    offset,
    hasMore,
    total,
    activeCount,
    inactiveCount,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    fetchTrades,
    refresh,
  };
};
