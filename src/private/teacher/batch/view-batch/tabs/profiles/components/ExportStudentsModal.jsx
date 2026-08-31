import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
  FileSpreadsheet,
  Download,
  CheckSquare,
  Square,
  Users,
  Filter,
  X,
  Sparkles,
  GraduationCap,
  PhoneCall,
  UserCheck,
  Activity,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export const COLUMN_CATEGORIES = [
  {
    id: "academic",
    title: "Academic & Enrollment",
    icon: GraduationCap,
    columns: [
      { id: "studentId", label: "Roll Number / ID", defaultChecked: true },
      { id: "registerId", label: "Registration ID", defaultChecked: true },
      { id: "userName", label: "Full Name", defaultChecked: true },
      { id: "role", label: "Trade / Role", defaultChecked: true },
      { id: "status", label: "Enrollment Status", defaultChecked: true },
      { id: "enrolledAt", label: "Admission Date", defaultChecked: true },
    ],
  },
  {
    id: "contact",
    title: "Contact Details",
    icon: PhoneCall,
    columns: [
      { id: "email", label: "Email Address", defaultChecked: true },
      { id: "phone", label: "Phone Number", defaultChecked: true },
      { id: "parentContact", label: "Parent/Guardian Contact", defaultChecked: true },
      { id: "address", label: "Permanent Address", defaultChecked: false },
    ],
  },
  {
    id: "personal",
    title: "Personal Details",
    icon: UserCheck,
    columns: [
      { id: "DOB", label: "Date of Birth", defaultChecked: true },
      { id: "fatherName", label: "Father's Name", defaultChecked: false },
      { id: "motherName", label: "Mother's Name", defaultChecked: false },
      { id: "gender", label: "Gender", defaultChecked: false },
      { id: "category", label: "Category / Caste", defaultChecked: false },
      { id: "aadhaarNumber", label: "Aadhaar Number", defaultChecked: false },
      { id: "gradeLevel", label: "Qualification / Grade", defaultChecked: false },
      { id: "bloodGroup", label: "Blood Group", defaultChecked: false },
    ],
  },
  {
    id: "realtime",
    title: "Live Activity Meta",
    icon: Activity,
    columns: [
      { id: "presenceStatus", label: "Live Online Status", defaultChecked: false },
    ],
  },
];

const ALL_COLUMNS = COLUMN_CATEGORIES.flatMap((cat) => cat.columns);
const DEFAULT_SELECTED = ALL_COLUMNS.filter((col) => col.defaultChecked).map((col) => col.id);

const formatDateVal = (val) => {
  if (!val) return "N/A";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return format(d, "dd/MM/yyyy");
  } catch {
    return String(val);
  }
};

const getValueForColumn = (student, colId) => {
  switch (colId) {
    case "studentId":
      return student.studentId || student.rollNumber || student.rollNo || "N/A";
    case "registerId":
      return student.registerId || student.registrationNumber || "N/A";
    case "userName":
      return student.userName || student.name || "N/A";
    case "role":
      return Array.isArray(student.role)
        ? student.role.join(", ")
        : student.role || "Trainee";
    case "status":
      return student.status || "Inactive";
    case "enrolledAt":
      return formatDateVal(student.enrolledAt || student.enrollmentDate || student.joinedAt);
    case "email":
      return student.email || "N/A";
    case "phone":
      return student.phone || student.phoneNumber || "N/A";
    case "parentContact":
      return student.parentContact || "N/A";
    case "address":
      return student.address || "N/A";
    case "DOB":
      return formatDateVal(student.DOB);
    case "fatherName":
      return student.fatherName || "N/A";
    case "motherName":
      return student.motherName || "N/A";
    case "gender":
      return student.gender || "N/A";
    case "category":
      return student.category || student.caste || "N/A";
    case "aadhaarNumber":
      return student.aadhaarNumber || student.aadhar || "N/A";
    case "gradeLevel":
      return student.gradeLevel || student.qualification || "N/A";
    case "bloodGroup":
      return student.bloodGroup || "N/A";
    case "presenceStatus":
      return student.presenceStatus
        ? student.presenceStatus.charAt(0).toUpperCase() + student.presenceStatus.slice(1)
        : "Offline";
    default:
      return student[colId] ?? "N/A";
  }
};

const ExportStudentsModal = ({
  isOpen,
  onClose,
  allStudents = [],
  filteredStudents = [],
  batchData,
  isFiltered = false,
}) => {
  const [scope, setScope] = useState(isFiltered ? "filtered" : "all");
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED);

  // Synchronize initial scope state when filter status changes
  React.useEffect(() => {
    if (isOpen) {
      setScope(isFiltered ? "filtered" : "all");
    }
  }, [isOpen, isFiltered]);

  const targetList = useMemo(() => {
    return scope === "filtered" ? filteredStudents : allStudents;
  }, [scope, filteredStudents, allStudents]);

  const isAllSelected = selectedColumns.length === ALL_COLUMNS.length;
  const isNoneSelected = selectedColumns.length === 0;

  const handleToggleColumn = (colId) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handlePresetSelect = (presetType) => {
    if (presetType === "all") {
      setSelectedColumns(ALL_COLUMNS.map((c) => c.id));
    } else if (presetType === "basic") {
      setSelectedColumns(["studentId", "registerId", "userName", "role", "status", "enrolledAt"]);
    } else if (presetType === "contact") {
      setSelectedColumns([
        "studentId",
        "userName",
        "email",
        "phone",
        "parentContact",
        "address",
        "fatherName",
        "DOB",
      ]);
    } else if (presetType === "clear") {
      setSelectedColumns([]);
    }
  };

  const handleExportExcel = async () => {
    if (targetList.length === 0) {
      toast.error("No student records available to export.");
      return;
    }

    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column to export.");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const batchName = batchData?.BatchName || batchData?.name || "Batch";
      const tradeName = batchData?.tradeName || "N/A";
      const exportDate = format(new Date(), "dd/MM/yyyy HH:mm");

      // Construct JSON data rows matching selected columns
      const excelRows = targetList.map((student, idx) => {
        const row = { "S.No": idx + 1 };
        selectedColumns.forEach((colId) => {
          const colDef = ALL_COLUMNS.find((c) => c.id === colId);
          if (colDef) {
            row[colDef.label] = getValueForColumn(student, colId);
          }
        });
        return row;
      });

      // Create sheet starting at row 5 (A5)
      const worksheet = XLSX.utils.json_to_sheet(excelRows, { origin: "A5" });

      // Add Batch Header Metadata in rows 1 to 3
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [`STUDENT PROFILES ROSTER - ${batchName.toUpperCase()}`],
          [`Trade: ${tradeName}`, `Export Date: ${exportDate}`, `Total Students: ${targetList.length}`],
          [], // Empty gap
        ],
        { origin: "A1" }
      );

      // Calculate dynamic column widths
      const colWidths = [{ wch: 6 }]; // S.No width
      selectedColumns.forEach((colId) => {
        const colDef = ALL_COLUMNS.find((c) => c.id === colId);
        const maxContentLen = Math.max(
          colDef ? colDef.label.length : 10,
          ...targetList.map((s) => String(getValueForColumn(s, colId)).length)
        );
        colWidths.push({ wch: Math.min(Math.max(maxContentLen + 4, 12), 45) });
      });
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students Roster");

      const sanitizedBatchName = batchName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const dateStr = format(new Date(), "yyyy-MM-dd");
      const fileName = `${sanitizedBatchName}_Students_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, fileName);

      toast.success(`Successfully exported ${targetList.length} student records to Excel!`);
      onClose();
    } catch (err) {
      console.error("Failed to export Excel file:", err);
      toast.error("Failed to generate Excel file. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 no-scrollbar"
      >
        {/* Modal Header */}
        <DialogHeader className="p-5 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200/80 dark:border-slate-800 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Export Student Details
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  Excel (.xlsx)
                </Badge>
              </DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Select target roster and choose columns to include in the spreadsheet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-5 space-y-6">
          {/* Section 1: Scope Selection */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              1. Select Student Roster Scope
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  scope === "all"
                    ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 ring-2 ring-blue-500/20 shadow-sm"
                    : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    All Batch Students
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Export complete roster for this batch
                  </p>
                </div>
                <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black shrink-0">
                  {allStudents.length}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setScope("filtered")}
                disabled={filteredStudents.length === 0}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  scope === "filtered"
                    ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 ring-2 ring-blue-500/20 shadow-sm"
                    : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                } ${filteredStudents.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Filtered Roster Only
                    {isFiltered && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Matches current search / presence filter
                  </p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-black shrink-0 border border-amber-500/30">
                  {filteredStudents.length}
                </Badge>
              </button>
            </div>
          </div>

          {/* Section 2: Preset Quick Selectors */}
          <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                2. Select Export Columns ({selectedColumns.length} / {ALL_COLUMNS.length})
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePresetSelect("all")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                    isAllSelected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Columns
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect("basic")}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect("contact")}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Contact & Personal
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect("clear")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                    isNoneSelected
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  }`}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Categorized Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COLUMN_CATEGORIES.map((category) => {
                const CategoryIcon = category.icon;
                const categoryColIds = category.columns.map((c) => c.id);
                const isCategoryAllSelected = categoryColIds.every((id) =>
                  selectedColumns.includes(id)
                );

                const handleToggleCategory = () => {
                  if (isCategoryAllSelected) {
                    setSelectedColumns((prev) =>
                      prev.filter((id) => !categoryColIds.includes(id))
                    );
                  } else {
                    setSelectedColumns((prev) => [
                      ...prev,
                      ...categoryColIds.filter((id) => !prev.includes(id)),
                    ]);
                  }
                };

                return (
                  <div
                    key={category.id}
                    className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {category.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleCategory}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {isCategoryAllSelected ? "Deselect Group" : "Select Group"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {category.columns.map((col) => {
                        const checked = selectedColumns.includes(col.id);
                        return (
                          <label
                            key={col.id}
                            className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => handleToggleColumn(col.id)}
                            />
                            <span>{col.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold hidden sm:block">
            Ready to export <span className="text-blue-600 dark:text-blue-400">{targetList.length}</span> students with <span className="text-blue-600 dark:text-blue-400">{selectedColumns.length}</span> columns
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={selectedColumns.length === 0 || targetList.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Excel (.xlsx)
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportStudentsModal;
