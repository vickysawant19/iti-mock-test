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
    <Card className="shadow-sm border-gray-200 dark:border-gray-800">
      <CardHeader className="py-4 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 shrink-0">
              Instructor Daily Diary
            </h2>
            <div className="flex items-center gap-2">
              <label
                htmlFor="month-picker"
                className="text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                Select Month:
              </label>
              <input
                id="month-picker"
                type="month"
                min={minMonthString}
                value={monthString}
                onChange={handleChange}
                className="px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary text-sm w-full sm:w-auto transition-shadow"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full sm:w-auto">
            <Button
              variant="default"
              size="sm"
              onClick={onExport}
              disabled={isExporting}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors mt-4 sm:mt-0"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export to Excel"}
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
