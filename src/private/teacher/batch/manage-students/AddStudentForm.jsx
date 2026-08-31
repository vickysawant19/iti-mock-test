import React, { useState, useEffect, useMemo, forwardRef } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { useForm } from "react-hook-form";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  User,
  Check,
  Loader2,
  AlertCircle,
  GraduationCap,
  BookOpen,
  UserCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { appwriteService } from "@/services/core/appwriteClient";
import batchService from "@/services/batch/batchService";
import { Query } from "appwrite";
import studentSearchService from "@/services/auth/studentSearchService";
import userProfileService from "@/services/auth/userProfileService";
import batchRequestService from "@/services/batch/batchRequestService";
import batchStudentService from "@/services/batch/batchStudentService";
import { toast } from "react-toastify";
import EmbeddedProfileForm from "@/private/profile/EmbeddedProfileForm";
import conf from "@/config/config";

const AddStudentForm = ({ defaultBatchId, teacherBatches = [] }) => {
  // State for tracking search/create mode and data
  const [mode, setMode] = useState("search"); // 'search' or 'create'
  const [selectedUserIdForEdit, setSelectedUserIdForEdit] = useState(null);
  const [selectedUserInitialData, setSelectedUserInitialData] = useState(null);
  const [batchesData, setBatchesData] = useState([]);
  const [selectedBatchForAdd, setSelectedBatchForAdd] = useState(defaultBatchId || "");
  const [userSearchResult, setUserSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false); // New loading state for user creation
  const [isSendingRequest, setIsSendingRequest] = useState(null); // Track which user ID is being sent a request
  const [showPassword, setShowPassword] = useState(false);

  // Batch name mapping dictionary { [batchId]: batchName }
  const [batchMap, setBatchMap] = useState({});

  // Sync defaultBatchId and populate initial batchMap from teacherBatches
  useEffect(() => {
    if (defaultBatchId) setSelectedBatchForAdd(defaultBatchId);
  }, [defaultBatchId]);

  useEffect(() => {
    const map = {};
    if (teacherBatches && teacherBatches.length > 0) {
      teacherBatches.forEach((b) => {
        if (b.$id) {
          map[b.$id] = b.BatchName || b.name || b.$id;
        }
      });
      setBatchMap((prev) => ({ ...map, ...prev }));
    }
  }, [teacherBatches]);

  // Group search results by Enrolled Batches (Current Teacher Batch at top, Other Batches, No Active Enrollments)
  const groupedSearchResults = useMemo(() => {
    if (!userSearchResult || !Array.isArray(userSearchResult)) return null;

    const currentBatchStudents = [];
    const otherBatchesStudents = [];
    const noEnrollmentStudents = [];

    userSearchResult.forEach((student) => {
      const enrolledList = student.enrolledList || [];
      const isEnrolledInCurrent = enrolledList.some(
        (e) => e.batchId === selectedBatchForAdd
      );

      if (isEnrolledInCurrent) {
        currentBatchStudents.push(student);
      } else if (enrolledList.length > 0) {
        otherBatchesStudents.push(student);
      } else {
        noEnrollmentStudents.push(student);
      }
    });

    const targetBatchName = batchMap[selectedBatchForAdd] || "Selected Batch";

    return [
      {
        id: "current",
        title: `Enrolled in Current Batch (${targetBatchName})`,
        students: currentBatchStudents,
        icon: GraduationCap,
        badgeStyle: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      },
      {
        id: "other",
        title: "Enrolled in Other Batches",
        students: otherBatchesStudents,
        icon: BookOpen,
        badgeStyle: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      },
      {
        id: "none",
        title: "No Active Batch Enrollments",
        students: noEnrollmentStudents,
        icon: UserCheck,
        badgeStyle: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700",
      },
    ].filter((group) => group.students.length > 0);
  }, [userSearchResult, selectedBatchForAdd, batchMap]);

  // Get the logged-in teacher's ID to record who approved the student
  const currentUser = useSelector(selectUser);

  // Fetch colleges and trades via RTK Query
  // DELETED manual fetch logic as handled downstream.

  // Form hooks
  const {
    register: registerSearch,
    handleSubmit: handleSubmitSearch,
    formState: { errors: searchErrors },
  } = useForm();

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm({
    defaultValues: {
      labels: ["Student"],
    },
  });

  // Watch for changes in college and trade selections
  // DELETED manual form hooks as they are handled by EmbeddedProfileForm

  const onSearchUser = async (data) => {
    setIsSearching(true);
    setUserSearchResult(null);
    setSelectedUserIdForEdit(null);

    try {
      // Use the unified search service finding multiple users
      const results = await studentSearchService.searchStudents(data.searchString);

      if (results && results.length > 0) {
        // Filter out roles: Teacher and admin
        const filtered = results.filter(u => {
          const roles = Array.isArray(u.role) ? u.role : (u.role ? [u.role] : []);
          const labels = Array.isArray(u.labels) ? u.labels : (u.labels ? [u.labels] : []);
          const allRoles = [...roles, ...labels].map(r => r.toLowerCase());
          return !allRoles.includes("teacher") && !allRoles.includes("admin");
        });

        if (filtered.length > 0) {
          // Enrich each student with their batch enrollments and batch requests
          const enrichedResults = await Promise.all(
            filtered.map(async (student) => {
              const uId = student.userId || student.$id;
              let enrolledList = [];
              let requestedList = [];
              try {
                enrolledList = await batchStudentService.getStudentBatches(uId);
              } catch (err) {
                console.warn("Error fetching student batches:", err);
              }
              try {
                requestedList = await batchRequestService.getStudentRequests(uId);
              } catch (err) {
                console.warn("Error fetching student requests:", err);
              }
              return {
                ...student,
                enrolledList,
                requestedList,
              };
            })
          );

          // Collect all referenced batch IDs to resolve missing batch names
          const referencedBatchIds = new Set();
          enrichedResults.forEach((s) => {
            (s.enrolledList || []).forEach((e) => e.batchId && referencedBatchIds.add(e.batchId));
            (s.requestedList || []).forEach((r) => r.batchId && referencedBatchIds.add(r.batchId));
          });

          // Fetch missing batch names
          const missingIds = Array.from(referencedBatchIds).filter((id) => !batchMap[id]);
          if (missingIds.length > 0) {
            try {
              const fetchedBatches = await batchService.getBatchesByIds(missingIds);
              setBatchMap((prev) => {
                const updated = { ...prev };
                fetchedBatches.forEach((b) => {
                  if (b.$id) {
                    updated[b.$id] = b.BatchName || b.name || b.$id;
                  }
                });
                return updated;
              });
            } catch (err) {
              console.warn("Error resolving batch names:", err);
            }
          }

          setUserSearchResult(enrichedResults);
        } else {
          toast.info("No matching students found");
        }
      } else {
        toast.info("No users found matching that name or email");
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      toast.error("Failed to search for user");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userResult) => {
    const uId = userResult.userId || userResult.$id;
    setIsSendingRequest(uId);
    
    try {
      if (!selectedBatchForAdd) {
        toast.error("Please select a batch from the Top Dropdown first.");
        return;
      }
      
      // If no profile, create a blank one implicitly
      if (userResult.noProfile) {
        await userProfileService.createUserProfile({
          userId: uId,
          userName: userResult.userName || userResult.name || "",
          email: userResult.email || "",
          phone: userResult.phone || "",
          role: ["Student"],
          onboardingStep: 1, 
          isProfileComplete: false
        });
      }
      
      // Send the request
      await batchRequestService.sendRequest(selectedBatchForAdd, uId, "teacher");
      toast.success("Request sent to student successfully!");
      
      // Remove from the current searched view so it's clean
      setUserSearchResult(prev => prev.filter(r => (r.userId || r.$id) !== uId));
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to send request.");
    } finally {
      setIsSendingRequest(null);
    }
  };

  // Handler for creating a new user
  const onCreateUser = async (data) => {
    setIsCreatingUser(true);
    setSelectedUserIdForEdit(null);
    setSelectedUserInitialData(null);

    try {
      const func = appwriteService.getFunctions();
      const { responseBody } = await func.createExecution(
        conf.userManageFunctionId,
        JSON.stringify({
          action: "createAccount",
          ...data,
          // Add country code if provided, default to India (+91)
          countryCode: data.countryCode || "91",
        }),
      );

      const response = JSON.parse(responseBody);

      if (response.success) {
        const newUserObj = {
          $id: response.data.$id,
          userId: response.data.$id,
          userName: data.name || response.data.name || "",
          name: data.name || response.data.name || "",
          email: data.email || response.data.email || "",
          phone: data.phone || response.data.phone || "",
        };
        setUserSearchResult([newUserObj]);
        setSelectedUserInitialData(newUserObj);
        setSelectedUserIdForEdit(response.data.$id);
        toast.success("User account created successfully! Please complete profile.");
      } else {
        throw new Error(response.error || "Failed to create user account");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user account");
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Reset function for switching modes
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setSelectedUserIdForEdit(null);
    setSelectedUserInitialData(null);
    setUserSearchResult(null);
    resetCreateForm();
  };

  const handleProfileComplete = () => {
    setSelectedUserIdForEdit(null);
    setSelectedUserInitialData(null);
    setUserSearchResult(null);
    setMode("search");
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">

      {/* Search/Create Toggle */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleModeSwitch("search")}
          disabled={isCreatingUser}
          className={`px-4 py-1.5 flex items-center gap-1.5 text-xs font-medium rounded-full capitalize transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${
            mode === "search"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Search Existing User
        </button>
        <button
          onClick={() => handleModeSwitch("create")}
          disabled={isCreatingUser}
          className={`px-4 py-1.5 flex items-center gap-1.5 text-xs font-medium rounded-full capitalize transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${
            mode === "create"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Create New User
        </button>
      </div>

      {/* Search User Form */}
      {mode === "search" && !selectedUserIdForEdit && (
        <div className="bg-gray-50 p-4 sm:p-5 rounded-xl mb-6 dark:bg-gray-800 border border-slate-200/80 dark:border-slate-700 space-y-4">
          
          {/* Target Batch Banner & Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Target Batch for Request
                </span>
                <p className="text-xs font-black text-blue-900 dark:text-blue-300">
                  {batchMap[selectedBatchForAdd] || "No Batch Selected"}
                </p>
              </div>
            </div>

            {teacherBatches.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Change Target:
                </label>
                <select
                  value={selectedBatchForAdd}
                  onChange={(e) => setSelectedBatchForAdd(e.target.value)}
                  className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-blue-500/20"
                >
                  {teacherBatches.map((b) => (
                    <option key={b.$id} value={b.$id}>
                      {b.BatchName || b.name || b.$id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">
            Search for Existing User
          </h2>
          <form
            onSubmit={handleSubmitSearch(onSearchUser)}
            className="flex items-end space-x-4"
          >
            <div className="flex-grow">
              <label className="block text-xs font-bold text-gray-600 mb-1 dark:text-gray-300">
                Email Address or Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter email address or name"
                  disabled={isSearching}
                  className={`pl-9 block w-full border ${
                    searchErrors.searchString
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-xl shadow-xs focus:ring-2 focus:ring-blue-500/20 text-xs p-2.5 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white`}
                  {...registerSearch("searchString", {
                    required: "Email or name is required",
                  })}
                />
              </div>
              {searchErrors.searchString && (
                <p className="mt-1 text-red-500 text-xs flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {searchErrors.searchString.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 flex items-center font-bold text-xs shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>

          {/* Search Results Grouped by Enrolled Batches */}
          {isSearching ? (
            <div className="flex justify-center items-center mt-4 py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Searching for users and fetching batch records...
                </p>
              </div>
            </div>
          ) : groupedSearchResults && groupedSearchResults.length > 0 ? (
            <div className="mt-6 space-y-6">
              {groupedSearchResults.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center gap-2">
                        <GroupIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          {group.title}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${group.badgeStyle}`}>
                        {group.students.length} {group.students.length === 1 ? "Student" : "Students"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.students.map((result) => {
                        const uId = result.userId || result.$id;
                        const targetBatchName = batchMap[selectedBatchForAdd] || "Selected Batch";

                        // Resolve student's enrolled batch names
                        const enrolledBatches = (result.enrolledList || [])
                          .map((e) => ({
                            batchId: e.batchId,
                            name: batchMap[e.batchId] || e.batchId,
                          }))
                          .filter((b) => b.batchId);

                        // Resolve student's batch request names & statuses
                        const requestedBatches = (result.requestedList || [])
                          .map((r) => ({
                            batchId: r.batchId,
                            name: batchMap[r.batchId] || r.batchId,
                            status: r.status,
                          }))
                          .filter((r) => r.batchId);

                        const isAlreadyEnrolled = enrolledBatches.some((b) => b.batchId === selectedBatchForAdd);
                        const pendingReq = requestedBatches.find(
                          (r) => r.batchId === selectedBatchForAdd && r.status === "pending"
                        );

                        return (
                          <div
                            key={uId}
                            className="p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl flex flex-col justify-between shadow-xs space-y-3"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                  {result.userName || result.name || "Unknown"}
                                  {result.noProfile && (
                                    <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-full border border-amber-300/50">
                                      No Profile
                                    </span>
                                  )}
                                </h3>
                              </div>

                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {result.email || "No email"}
                              </p>

                              {result.phone && (
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                  Phone: {result.phone}
                                </p>
                              )}

                              {/* Enrolled Batches Badge List */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                  Enrolled Batches:
                                </span>
                                {enrolledBatches.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {enrolledBatches.map((b) => (
                                      <span
                                        key={b.batchId}
                                        className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200/80 dark:border-emerald-800/80"
                                      >
                                        {b.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                    No active batch enrollments
                                  </span>
                                )}
                              </div>

                              {/* Requested Batches Badge List */}
                              {requestedBatches.length > 0 && (
                                <div className="pt-1">
                                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                    Batch Requests:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {requestedBatches.map((r) => (
                                      <span
                                        key={r.batchId}
                                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                          r.status === "approved"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : r.status === "pending"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}
                                      >
                                        {r.name} ({r.status})
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Controls */}
                            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                              {isAlreadyEnrolled ? (
                                <div className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  Enrolled in {targetBatchName}
                                </div>
                              ) : pendingReq ? (
                                <div className="w-full px-3 py-2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  Request Pending for {targetBatchName}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSendRequest(result)}
                                  disabled={isSendingRequest === uId}
                                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 flex items-center justify-center font-extrabold text-xs shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
                                >
                                  {isSendingRequest === uId ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                  )}
                                  Send Request for {targetBatchName}
                                </button>
                              )}

                              {(result.noProfile || (isAlreadyEnrolled && !result.isProfileComplete)) && (
                                <button
                                  onClick={() => {
                                    setSelectedUserInitialData(result);
                                    setSelectedUserIdForEdit(uId);
                                  }}
                                  disabled={isSendingRequest === uId}
                                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition duration-200 flex items-center justify-center font-bold text-xs disabled:opacity-50 cursor-pointer"
                                >
                                  <UserPlus className="w-4 h-4 mr-2 text-slate-500" />
                                  Complete Full Profile
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      {/* Create User Form */}
      {mode === "create" && !selectedUserIdForEdit && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-700 mb-4 dark:text-gray-200">
            Create New User
          </h2>
          <form
            onSubmit={handleSubmitCreate(onCreateUser)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1 dark:text-gray-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter full name"
                    disabled={isCreatingUser}
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    {...registerCreate("name", {
                      required: "Name is required",
                    })}
                  />
                </div>
                {createErrors.name && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {createErrors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-600 mb-1 dark:text-gray-300">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter email address"
                    disabled={isCreatingUser}
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    {...registerCreate("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                </div>
                {createErrors.email && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {createErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-600 mb-1 dark:text-gray-300">
                  Country Code
                </label>
                <input
                  type="text"
                  placeholder="91 (India)"
                  disabled={isCreatingUser}
                  className="block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...registerCreate("countryCode")}
                />
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  Default: 91 (India)
                </p>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 dark:text-gray-300">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    disabled={isCreatingUser}
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    {...registerCreate("phone", {
                      required: "Phone is required",
                      pattern: {
                        value: /^[0-9]{7,15}$/,
                        message: "Phone number must be 7-15 digits",
                      },
                    })}
                  />
                </div>
                {createErrors.phone && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {createErrors.phone.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-600 mb-1 dark:text-gray-300">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    disabled={isCreatingUser}
                    className="block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    {...registerCreate("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none p-1 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {createErrors.password && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {createErrors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-1 dark:text-gray-300">
                Role
              </label>
              <div className="bg-blue-100 py-1 px-3 rounded-md inline-flex items-center dark:bg-blue-900/20">
                <span className="dark:text-blue-200">Student</span>
                <Check className="w-4 h-4 ml-2 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                Default role is set to Student
              </p>
            </div>

            <button
              type="submit"
              disabled={isCreatingUser}
              className="w-full md:w-auto px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 flex items-center justify-center disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isCreatingUser ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create User & Continue
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Student Profile Form */}
      {selectedUserIdForEdit && (
        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 dark:text-white">
            Complete Student Profile
          </h2>
          <EmbeddedProfileForm 
            explicitUserId={selectedUserIdForEdit}
            defaultBatchId={selectedBatchForAdd}
            initialData={selectedUserInitialData}
            onSuccess={handleProfileComplete}
            onCancel={() => {
              setSelectedUserIdForEdit(null);
              setSelectedUserInitialData(null);
            }}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {/* {(isCreatingUser || isSubmitting) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center dark:bg-gray-800">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2 dark:text-white">
              {isCreatingUser ? "Creating User Account" : "Saving Profile"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {isCreatingUser 
                ? "Please wait while we create the user account..." 
                : "Please wait while we save the student profile..."}
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default AddStudentForm;
