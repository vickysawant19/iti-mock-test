import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Users, UserPlus, FileText } from "lucide-react";
import { selectUser } from "@/store/userSlice";
import batchService from "@/appwrite/batchService";
import { Query } from "appwrite";

import ManageStudentsList from "./ManageStudentsList";
import AddStudentForm from "./AddStudentForm";

const AddStudents = () => {
  const user = useSelector(selectUser);
  const teacherId = user?.$id;

  const [activeTab, setActiveTab] = useState("manage"); // 'manage' or 'add'
  const [teacherBatches, setTeacherBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");

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
      }
    };
    fetchBatches();
  }, [teacherId]);

  return (
    <div className="p-6 bg-slate-50 text-slate-900 min-h-screen dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header and Batch Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Management</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your batch enrollments and approve student requests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Batch:
            </span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              {teacherBatches.map((b) => (
                <option key={b.$id} value={b.$id}>
                  {b.BatchName || b.$id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl w-fit dark:bg-slate-900 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "manage"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            Manage Students
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "add"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Add New Student
          </button>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
          {activeTab === "manage" ? (
            <ManageStudentsList selectedBatch={selectedBatch} />
          ) : (
             <AddStudentForm defaultBatchId={selectedBatch} />
          )}
        </div>

      </div>
    </div>
  );
};

export default AddStudents;
