import React, { useState, useEffect, forwardRef } from "react";
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
} from "lucide-react";
import { appwriteService } from "@/appwrite/appwriteConfig";
import batchService from "@/appwrite/batchService";
import { Query } from "appwrite";
import studentSearchService from "@/appwrite/studentSearchService";
import userProfileService from "@/appwrite/userProfileService";
import batchRequestService from "@/appwrite/batchRequestService";
import { toast } from "react-toastify";
import EmbeddedProfileForm from "@/private/profile/EmbeddedProfileForm";

const AddStudentForm = ({ defaultBatchId }) => {
  // State for tracking search/create mode and data
  const [mode, setMode] = useState("search"); // 'search' or 'create'
  const [selectedUserIdForEdit, setSelectedUserIdForEdit] = useState(null);
  const [batchesData, setBatchesData] = useState([]);
  const [selectedBatchForAdd, setSelectedBatchForAdd] = useState(defaultBatchId || "");
  const [userSearchResult, setUserSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false); // New loading state for user creation
  const [isSendingRequest, setIsSendingRequest] = useState(null); // Track which user ID is being sent a request

  // Sync defaultBatchId changes
  useEffect(() => {
    if (defaultBatchId) setSelectedBatchForAdd(defaultBatchId);
  }, [defaultBatchId]);

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
          setUserSearchResult(filtered);
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
          status: "Active",
          enrollmentStatus: "Active",
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

    try {
      const func = appwriteService.getFunctions();
      const { responseBody } = await func.createExecution(
        "678e7277002e1d5c9b9b",
        JSON.stringify({
          action: "createAccount",
          ...data,
          // Add country code if provided, default to India (+91)
          countryCode: data.countryCode || "91",
        }),
      );

      const response = JSON.parse(responseBody);

      if (response.success) {
        setUserSearchResult([response.data]);
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
    setUserSearchResult(null);
    resetCreateForm();
  };

  const handleProfileComplete = () => {
    setSelectedUserIdForEdit(null);
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
        <div className="bg-gray-50 p-4 rounded-lg mb-6 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-700 mb-4 dark:text-gray-200">
            Search for Existing User
          </h2>
          <form
            onSubmit={handleSubmitSearch(onSearchUser)}
            className="flex items-end space-x-4"
          >
            <div className="flex-grow">
              <label className="block text-gray-600 mb-1 dark:text-gray-300">
                Email Address or Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter email address or name"
                  disabled={isSearching}
                  className={`pl-10 block w-full border ${
                    searchErrors.searchString
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                  {...registerSearch("searchString", {
                    required: "Email or name is required",
                  })}
                />
              </div>
              {searchErrors.searchString && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {searchErrors.searchString.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Search className="w-5 h-5 mr-2" />
              )}
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>

          {/* Search Results */}
          {isSearching ? (
            <div className="flex justify-center items-center mt-4 py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-300">
                  Searching for user...
                </p>
              </div>
            </div>
          ) : userSearchResult && userSearchResult.length > 0 ? (
            <div className="mt-4 space-y-3">
              <h3 className="font-medium text-gray-700 dark:text-gray-200">
                Found {userSearchResult.length} matches:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSearchResult.map((result) => (
                  <div key={result.$id || result.userId} className="p-4 border border-green-200 bg-green-50 rounded-lg dark:bg-green-900/20 dark:border-green-700 flex flex-col justify-between">
                    <div className="mb-3">
                      <h3 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                        {result.userName || result.name || "Unknown"}
                        {result.noProfile && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                            No Profile
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {result.email}
                      </p>
                      {result.phone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {result.phone}
                        </p>
                      )}
                    </div>
                     <div className="flex flex-col gap-2 mt-2">
                       <button
                         onClick={() => handleSendRequest(result)}
                         disabled={isSendingRequest === (result.$id || result.userId)}
                         className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 flex items-center justify-center font-medium shadow-sm disabled:opacity-50"
                       >
                         {isSendingRequest === (result.$id || result.userId) ? (
                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                         ) : (
                           <AlertCircle className="w-4 h-4 mr-2" />
                         )}
                         Send Batch Request
                       </button>
                       {(result.noProfile || !result.isProfileComplete) && (
                         <button
                           onClick={() => setSelectedUserIdForEdit(result.userId || result.$id)}
                           disabled={isSendingRequest === (result.$id || result.userId)}
                           className="w-full px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition duration-200 flex items-center justify-center font-medium disabled:opacity-50"
                         >
                           <UserPlus className="w-4 h-4 mr-2" />
                           Complete full profile
                         </button>
                       )}
                     </div>
                  </div>
                ))}
              </div>
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
                <input
                  type="password"
                  placeholder="Enter password"
                  disabled={isCreatingUser}
                  className="block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...registerCreate("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
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
            onSuccess={handleProfileComplete}
            onCancel={() => setSelectedUserIdForEdit(null)}
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
