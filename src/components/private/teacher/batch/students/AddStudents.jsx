import React, { useState, useEffect, forwardRef } from "react";
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
import { appwriteService } from "../../../../../appwrite/appwriteConfig";
import batchService from "../../../../../appwrite/batchService";
import { Query } from "appwrite";
import collegeService from "../../../../../appwrite/collageService";
import tradeservice from "../../../../../appwrite/tradedetails";
import userProfileService from "../../../../../appwrite/userProfileService";
import { toast } from "react-toastify";
import CustomInput from "./CustomInput";

const AddStudents = () => {
  // State for tracking search/create mode and data
  const [mode, setMode] = useState("search"); // 'search' or 'create'
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [collegeData, setCollegeData] = useState([]);
  const [tradeData, setTradeData] = useState([]);
  const [batchesData, setBatchesData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSearchResult, setUserSearchResult] = useState(null);
  const [existingProfile, setExsistingProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false); // New loading state for user creation

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

  const {
    register,
    handleSubmit,
    watch,
    reset: resetProfileForm,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: "Active",
      enrollmentStatus: "Active",
      isActive: true,
    },
  });

  // Watch for changes in college and trade selections
  const selectedCollegeId = watch("collegeId");
  const selectedTradeId = watch("tradeId");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [colleges, trades] = await Promise.all([
          collegeService.listColleges(),
          tradeservice.listTrades(),
        ]);

        setCollegeData(colleges.documents || []);
        setTradeData(trades.documents || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    if (showProfileForm && collegeData.length === 0 && tradeData.length === 0) {
      fetchData();
    }
  }, [showProfileForm]);

  // Fetch batches when both college and trade are selected
  useEffect(() => {
    const fetchBatches = async () => {
      if (!selectedCollegeId || !selectedTradeId) return;

      setIsLoadingBatches(true);
      try {
        const data = await batchService.listBatches([
          Query.equal("collegeId", selectedCollegeId),
          Query.equal("tradeId", selectedTradeId),
        ]);
        setBatchesData(data.documents || []);
      } catch (error) {
        console.error("Error fetching batches:", error);
        toast.error("Failed to load batches");
        setBatchesData([]);
      } finally {
        setIsLoadingBatches(false);
      }
    };

    if (selectedCollegeId && selectedTradeId) {
      fetchBatches();
    } else {
      setBatchesData([]);
    }
  }, [selectedCollegeId, selectedTradeId]);

  // Handler for searching a user
  const onSearchUser = async (data) => {
    setIsSearching(true);
    setUserSearchResult(null);
    resetProfileForm();

    try {
      const func = appwriteService.getFunctions();
      const { responseBody } = await func.createExecution(
        "678e7277002e1d5c9b9b",
        JSON.stringify({ action: "getUserIdByEmail", email: data.searchEmail })
      );

      const response = JSON.parse(responseBody);

      if (response.data) {
        setUserSearchResult(response.data);
        
        // Check if user has existing profile
        try {
          const userProfile = await userProfileService.getUserProfile(
            response.data.$id
          );
          if (userProfile) {
            // Pre-fill old profile form with user data
            setExsistingProfile(userProfile);
            resetProfileForm({
              ...userProfile,
              DOB: userProfile.DOB?.split("T")[0] || "",
              enrolledAt: userProfile.enrolledAt?.split("T")[0] || "",
              role: userProfile.role || ["Student"],
              status: "Active",
              enrollmentStatus: "Active",
              isActive: true,
            });
          } else {
            // Pre-fill new profile form with user data
            const user = response.data;
            resetProfileForm({
              userId: user.$id,
              userName: user.name || "",
              email: user.email || "",
              phone: user.phone || "",
              role: user.labels || ["Student"],
              status: "Active",
              enrollmentStatus: "Active",
              isActive: true,
            });
          }
        } catch (profileError) {
          // If profile doesn't exist, continue with new profile setup
          const user = response.data;
          resetProfileForm({
            userId: user.$id,
            userName: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            role: user.labels || ["Student"],
            status: "Active",
            enrollmentStatus: "Active",
            isActive: true,
          });
        }
      } else {
        toast.info("No user found with that email address");
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      toast.error("Failed to search for user");
    } finally {
      setIsSearching(false);
    }
  };

  // Handler for creating a new user
  const onCreateUser = async (data) => {
    setIsCreatingUser(true);
    setExsistingProfile(null);
    
    try {
      const func = appwriteService.getFunctions();
      const { responseBody } = await func.createExecution(
        "678e7277002e1d5c9b9b",
        JSON.stringify({ 
          action: "createAccount", 
          ...data,
          // Add country code if provided, default to India (+91)
          countryCode: data.countryCode || "91"
        })
      );
      
      const response = JSON.parse(responseBody);
      
      if (response.success) {
        setUserSearchResult(response.data);
        resetProfileForm({
          userId: response.data.$id,
          userName: response.data.name || data.name,
          email: response.data.email || data.email,
          phone: response.data.phone || data.phone,
          role: ["Student"],
          status: "Active",
          enrollmentStatus: "Active",
          isActive: true,
        });
        setShowProfileForm(true);
        toast.success("User account created successfully!");
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

  // Handler for submitting the profile
  const handleProfileSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = [
        "userName",
        "DOB",
        "email",
        "phone",
        "parentContact",
        "address",
        "collegeId",
        "tradeId",
        "batchId",
        "enrolledAt",
      ];

      const missingFields = requiredFields.filter((field) => !data[field]);
      if (missingFields.length > 0) {
        toast.error(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
        return;
      }

      if (!data.userId) {
        toast.error("User data missing! Try searching the user again!");
        return;
      }

      if (existingProfile) {
        await userProfileService.updateUserProfile(existingProfile.$id, data);
        toast.success("Student profile updated successfully");
      } else {
        await userProfileService.createUserProfile(data);
        toast.success("Student profile added successfully");
      }

      // Reset forms and state
      resetProfileForm();
      resetCreateForm();
      setExsistingProfile(null);
      setShowProfileForm(false);
      setMode("search");
      setUserSearchResult(null);
    } catch (error) {
      console.error("Error creating user profile:", error);
      toast.error(error.message || "Failed to create student profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset function for switching modes
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setShowProfileForm(false);
    setUserSearchResult(null);
    setExsistingProfile(null);
    resetProfileForm();
    resetCreateForm();
  };

  return (
    <div className="p-6 bg-white shadow-md max-w-6xl mx-auto text-black min-h-screen dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">
        Add Student
      </h1>

      {/* Search/Create Toggle */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => handleModeSwitch("search")}
          disabled={isCreatingUser || isSubmitting}
          className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === "search"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Search className="w-5 h-5 mr-2" />
          Search Existing User
        </button>
        <button
          onClick={() => handleModeSwitch("create")}
          disabled={isCreatingUser || isSubmitting}
          className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === "create"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Create New User
        </button>
      </div>

      {/* Search User Form */}
      {mode === "search" && !showProfileForm && (
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
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter email address"
                  disabled={isSearching}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...registerSearch("searchEmail", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
              </div>
              {searchErrors.searchEmail && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {searchErrors.searchEmail.message}
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
                <p className="text-gray-600 dark:text-gray-300">Searching for user...</p>
              </div>
            </div>
          ) : userSearchResult ? (
            <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg dark:bg-green-900/20 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    {userSearchResult.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{userSearchResult.email}</p>
                  {userSearchResult.phone && (
                    <p className="text-gray-600 dark:text-gray-300">{userSearchResult.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowProfileForm(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200 flex items-center"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Select & Continue
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Create User Form */}
      {mode === "create" && !showProfileForm && (
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
              <label className="block text-gray-600 mb-1 dark:text-gray-300">Role</label>
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
      {showProfileForm ? (
        isLoading ? (
          <div className="flex justify-center items-center mt-4 py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300">Loading form data...</p>
            </div>
          </div>
        ) : (
          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 dark:text-white">
              {existingProfile ? "Update Student Profile" : "Complete Student Profile"}
            </h2>

            <form
              onSubmit={handleSubmit(handleProfileSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CustomInput
                  label="Full Name"
                  extraclass="md:col-span-2 lg:col-span-3"
                  required={true}
                  type="text"
                  disabled={isSubmitting}
                  error={errors.userName?.message}
                  {...register("userName", {
                    required: "Full name is required",
                  })}
                />

                {/* Personal Information */}
                <CustomInput
                  label="Date of Birth"
                  required={true}
                  type="date"
                  disabled={isSubmitting}
                  error={errors.DOB?.message}
                  {...register("DOB", {
                    required: "Date of birth is required",
                  })}
                />

                <CustomInput
                  label="Email"
                  type="email"
                  required={true}
                  disabled={isSubmitting}
                  error={errors.email?.message}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />

                <CustomInput
                  label="Phone"
                  type="tel"
                  required={true}
                  disabled={isSubmitting}
                  error={errors.phone?.message}
                  {...register("phone", {
                    required: "Phone is required",
                  })}
                />

                <CustomInput
                  label="Parent Contact"
                  type="tel"
                  required={true}
                  disabled={isSubmitting}
                  error={errors.parentContact?.message}
                  {...register("parentContact", {
                    required: "Parent contact is required",
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: "Invalid phone number format",
                    },
                  })}
                />

                <div className="md:col-span-2">
                  <label className="block text-gray-600 dark:text-gray-300">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("address", {
                      required: "Address is required",
                    })}
                    rows={3}
                    disabled={isSubmitting}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  {errors.address && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Academic Information */}
                <CustomInput
                  label="Student ID/Roll Number"
                  type="text"
                  disabled={isSubmitting}
                  error={errors.studentId?.message}
                  {...register("studentId")}
                />

                <CustomInput
                  label="Registration ID"
                  type="text"
                  disabled={isSubmitting}
                  error={errors.registerId?.message}
                  {...register("registerId")}
                />

                <div className="md:col-span-2">
                  <label className="block text-gray-600 dark:text-gray-300">
                    College <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("collegeId", {
                      required: "College is required",
                    })}
                    disabled={isSubmitting}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select College</option>
                    {collegeData.map((college) => (
                      <option key={college.$id} value={college.$id}>
                        {college.collageName}
                      </option>
                    ))}
                  </select>
                  {errors.collegeId && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.collegeId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-600 dark:text-gray-300">
                    Trade <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("tradeId", { required: "Trade is required" })}
                    disabled={isSubmitting}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Trade</option>
                    {tradeData.map((trade) => (
                      <option key={trade.$id} value={trade.$id}>
                        {trade.tradeName}
                      </option>
                    ))}
                  </select>
                  {errors.tradeId && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.tradeId.message}
                    </p>
                  )}
                </div>

                {/* Batch Selection Section */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300">
                    Batch <span className="text-red-500">*</span>
                  </label>
                  <div className="text-gray-500 italic text-xs mb-1 dark:text-gray-400">
                    (If your batch is not available, please create a batch.)
                  </div>
                  <select
                    {...register("batchId", { required: "Batch is required" })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={isLoadingBatches || isSubmitting}
                  >
                    <option value="">
                      {isLoadingBatches ? "Loading batches..." : "Select Batch"}
                    </option>
                    {batchesData.map((batch) => (
                      <option key={batch.$id} value={batch.$id}>
                        {batch.BatchName}
                      </option>
                    ))}
                  </select>
                  {isLoadingBatches && (
                    <div className="mt-1 flex items-center text-blue-500 text-sm">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Loading batches...
                    </div>
                  )}
                  {errors.batchId && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.batchId.message}
                    </p>
                  )}
                </div>

                <CustomInput
                  required={true}
                  label="Enrollment Date"
                  type="date"
                  disabled={isSubmitting}
                  error={errors.enrolledAt?.message}
                  {...register("enrolledAt", {
                    required: "Enrollment date is required",
                  })}
                />

                <CustomInput
                  label="Profile Image URL"
                  type="text"
                  disabled={isSubmitting}
                  {...register("profileImage")}
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-6">
                <button
                  disabled={isSubmitting || isLoadingBatches}
                  type="submit"
                  className="flex-1 md:flex-none md:px-8 bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {existingProfile ? "Updating Profile..." : "Creating Profile..."}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {existingProfile ? "Update Student Profile" : "Create Student Profile"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowProfileForm(false);
                    setUserSearchResult(null);
                    setExsistingProfile(null);
                    resetProfileForm();
                  }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )
      ) : null}

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

export default AddStudents;