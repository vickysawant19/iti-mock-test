import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Users, UserPlus, FileText } from "lucide-react";
import { selectUser } from "@/store/userSlice";
import batchService from "@/appwrite/batchService";
import { Query } from "appwrite";

import ManageStudentsList from "./ManageStudentsList";
import AddStudentForm from "./AddStudentForm";
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";

const AddStudents = () => {
  const user = useSelector(selectUser);
  const teacherId = user?.$id;

  const [activeTab, setActiveTab] = useState("manage"); // 'manage' or 'add'
  const [teacherBatches, setTeacherBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const selectedBatchData = teacherBatches.find((b) => b.$id === selectedBatch) || null;

  // Load teacher batches
  useEffect(() => {
    if (!teacherId) return;
    const fetchBatches = async () => {
      try {
        const res = await batchService.listBatches([
          Query.equal("teacherId", teacherId),
        ]);
        const batches = res.documents || [];
        setTeacherBatches(batches);
        if (batches.length > 0 && !selectedBatch) {
          setSelectedBatch(batches[0].$id);
        }
      } catch (err) {
        console.error("AddStudents: error fetching batches:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatches();
  }, [teacherId]);

  if (!isLoading && teacherBatches.length === 0) {
    return (
      <div className="p-4 md:p-6 pb-24">
        <NoBatchTeacherView isTeacher={true} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 text-slate-900 min-h-screen dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header and Batch Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/20 dark:shadow-none">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                Student Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your batch enrollments and approve student requests
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 pt-4 md:pt-0 border-t border-slate-100 dark:border-slate-800 md:border-none">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Active Batch:
            </span>
            <div className="relative">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="appearance-none bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 block w-48 p-2.5 pr-8 transition-all shadow-inner"
              >
                {teacherBatches.map((b) => (
                  <option key={b.$id} value={b.$id}>
                    {b.BatchName || b.$id}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/60 rounded-2xl w-full sm:w-fit gap-1.5 shadow-sm backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 w-full sm:w-auto ${
              activeTab === "manage"
                ? "bg-white text-blue-600 dark:bg-slate-800 dark:text-blue-400 shadow-sm border border-slate-200/20 dark:border-slate-700/50"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40"
            }`}
          >
            <FileText className="w-4 h-4" />
            Manage Students
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 w-full sm:w-auto ${
              activeTab === "add"
                ? "bg-white text-blue-600 dark:bg-slate-800 dark:text-blue-400 shadow-sm border border-slate-200/20 dark:border-slate-700/50"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Add New Student
          </button>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
          {activeTab === "manage" ? (
            <ManageStudentsList selectedBatch={selectedBatch} batchData={selectedBatchData} />
          ) : (
             <AddStudentForm defaultBatchId={selectedBatch} />
          )}
        </div>

      </div>
    </div>
  );
};

export default AddStudents;
