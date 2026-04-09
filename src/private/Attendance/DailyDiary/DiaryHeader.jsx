import React from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

export default function DiaryHeader({
  selectedMonth,
  onMonthChange,
  onExport,
  isExporting,
  onRefresh, // Pass refresh callback for Add Diary Form
  batchStartDate,
}) {
  // input type="month" expects "YYYY-MM"
  const monthString = format(selectedMonth, "yyyy-MM");
  const minMonthString = batchStartDate ? format(new Date(batchStartDate), "yyyy-MM") : undefined;

  const handleChange = (e) => {
    const value = e.target.value;
    if (value) {
      // value is "YYYY-MM", convert to Date
      const [year, month] = value.split("-");
      onMonthChange(new Date(year, month - 1, 1));
    }
  };

  return (
    <Card className="rounded-t-none rounded-b-[22px] shadow-lg border-gray-200 dark:border-gray-800 border-t-0 relative z-20 mb-6">
      <CardHeader className="py-4 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 pl-2">
              Month
            </span>
            <input
              id="month-picker"
              type="month"
              min={minMonthString}
              value={monthString}
              onChange={handleChange}
              className="px-3 py-1.5 rounded-md shadow-sm bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-800 dark:text-gray-200 w-full sm:w-auto outline-none transition-all"
            />
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-4 rounded-[10px] shadow-sm transition-all active:scale-95 flex-shrink-0"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export to Excel"}
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
