import React from "react";
import { format } from "date-fns";
import { Download, Calendar, Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DiaryHeader({
  selectedMonth,
  onMonthChange,
  onExport,
  onPrint,
  isExporting,
  onRefresh,
  batchStartDate,
}) {
  // input type="month" expects "YYYY-MM"
  const monthString = format(selectedMonth, "yyyy-MM");
  const minMonthString = batchStartDate ? format(new Date(batchStartDate), "yyyy-MM") : undefined;

  const handleChange = (e) => {
    const value = e.target.value;
    if (value) {
      const [year, month] = value.split("-");
      onMonthChange(new Date(year, month - 1, 1));
    }
  };

  return (
    <Card className="rounded-none shadow-xs border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md relative z-20 m-0 transition-all">
      <CardContent className="p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Month Selector Group */}
          <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-100/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-2 pl-2 text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Month:
              </span>
            </div>
            <input
              id="month-picker"
              type="month"
              min={minMonthString}
              value={monthString}
              onChange={handleChange}
              className="px-3 py-1.5 rounded-lg shadow-2xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-xs font-extrabold text-slate-800 dark:text-slate-200 w-full sm:w-auto outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Export & Print Action Buttons */}
          {(onPrint || onExport) && (
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {onPrint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrint}
                  disabled={isExporting}
                  className="flex-1 sm:flex-none w-full sm:w-auto bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 rounded-xl shadow-2xs transition-all active:scale-95 h-10 text-xs flex items-center gap-2"
                >
                  <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <span>Print PDF</span>
                </Button>
              )}
              {onExport && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onExport}
                  disabled={isExporting}
                  className="flex-1 sm:flex-none w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl shadow-2xs transition-all active:scale-95 h-10 text-xs flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
