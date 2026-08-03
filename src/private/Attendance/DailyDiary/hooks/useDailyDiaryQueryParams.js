import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format, parse } from "date-fns";

const VALID_TABS = ["monthly", "weekly", "daily"];

export function useDailyDiaryQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse active tab parameter ('monthly' | 'weekly' | 'daily')
  const tabParam = searchParams.get("tab");
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : "monthly";

  // Parse selected month parameter ('yyyy-MM')
  const monthParam = searchParams.get("month");
  const currentMonth = useMemo(() => {
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      try {
        const parsedDate = parse(monthParam, "yyyy-MM", new Date());
        if (!isNaN(parsedDate.getTime())) return parsedDate;
      } catch (e) {
        // fallback to current date
      }
    }
    return new Date();
  }, [monthParam]);

  // Handler to update active tab in URL search query
  const setActiveTab = useCallback(
    (newTab) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (VALID_TABS.includes(newTab)) {
          next.set("tab", newTab);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Handler to update selected month in URL search query
  const setCurrentMonth = useCallback(
    (newMonth) => {
      const monthStr = format(newMonth, "yyyy-MM");
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("month", monthStr);
        return next;
      });
    },
    [setSearchParams]
  );

  return {
    activeTab,
    setActiveTab,
    currentMonth,
    setCurrentMonth,
    searchParams,
    setSearchParams,
  };
}
