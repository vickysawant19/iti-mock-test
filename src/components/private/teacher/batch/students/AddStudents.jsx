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
    setValue,
    getValues,
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
        const userProfile = await userProfileService.getUserProfile(
          response.data.$id
        );
        if (userProfile) {
          // Pre-fill old profile form with user data
          setExsistingProfile(userProfile);
          resetProfileForm({
            ...userProfile,
            DOB: userProfile.DOB.split("T")[0],
            enrolledAt: userProfile.enrolledAt.split("T")[0],
            role: userProfile.role || ["Student"],
          });
        } else {
          // Pre-fill new profile form with user data
          const user = response.data;
          console.log(user);
          resetProfileForm({
            userId: user.$id,
            userName: user.name,
            email: user.email,
            phone: user.phone,
            role: user.labels,
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
    setExsistingProfile(null);
    try {
      const func = appwriteService.getFunctions();
      const { responseBody } = await func.createExecution(
        "678e7277002e1d5c9b9b",
        JSON.stringify({ action: "createAccount", ...data })
      );
      const response = JSON.parse(responseBody);
      if (response.success) {
        setUserSearchResult(response.data);
        resetProfileForm({
          userId: response.data.$id,
          userName: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
        });
        setShowProfileForm(true);
      } else {
        throw Error(response.error);
      }
    } catch (error) {
      toast.error(error.message);
      console.log("Error", error);
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
        setIsSubmitting(false);
        return;
      }

      if (!data.userId) {
        toast.error("User data missing! \nTry searching the user again!");
      }
      if (existingProfile) {
        await userProfileService.updateUserProfile(data.$id, data);
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

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Student</h1>

      {/* Search/Create Toggle */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => {
            setMode("search");
            setShowProfileForm(false);
            setUserSearchResult(null);
          }}
          className={`flex items-center px-4 py-2 rounded-md ${
            mode === "search"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Search className="w-5 h-5 mr-2" />
          Search Existing User
        </button>
        <button
          onClick={() => {
            setMode("create");
            setShowProfileForm(false);
            setUserSearchResult(null);
          }}
          className={`flex items-center px-4 py-2 rounded-md ${
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
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            Search for Existing User
          </h2>
          <form
            onSubmit={handleSubmitSearch(onSearchUser)}
            className="flex items-end space-x-4"
          >
            <div className="flex-grow">
              <label className="block text-gray-600 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
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
                <p className="mt-1 text-red-500 text-sm">
                  {searchErrors.searchEmail.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 flex items-center"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Search className="w-5 h-5 mr-2" />
              )}
              Search
            </button>
          </form>

          {/* Search Results */}
          {isSearching ? (
            <div className="flex justify-center items-center mt-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : userSearchResult ? (
            <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">
                    {userSearchResult.name}
                  </h3>
                  <p className="text-gray-600">{userSearchResult.email}</p>
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
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            Create New User
          </h2>
          <form
            onSubmit={handleSubmitCreate(onCreateUser)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter full name"
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                    {...registerCreate("name", {
                      required: "Name is required",
                    })}
                  />
                </div>
                {createErrors.name && (
                  <p className="mt-1 text-red-500 text-sm">
                    {createErrors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
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
                  <p className="mt-1 text-red-500 text-sm">
                    {createErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                    {...registerCreate("phone", {
                      required: "Phone is required",
                    })}
                  />
                </div>
                {createErrors.phone && (
                  <p className="mt-1 text-red-500 text-sm">
                    {createErrors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                  {...registerCreate("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                {createErrors.password && (
                  <p className="mt-1 text-red-500 text-sm">
                    {createErrors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Role</label>
              <div className="bg-blue-100 py-1 px-3 rounded-md inline-flex items-center">
                <span>Student</span>
                <Check className="w-4 h-4 ml-2 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Default role is set to Student
              </p>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 flex items-center justify-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Create User & Continue
            </button>
          </form>
        </div>
      )}

      {/* Student Profile Form */}

      {showProfileForm ? (
        isLoading ? (
          <div className="flex justify-center items-center mt-4 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Complete Student Profile
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
                  error={errors.DOB?.message}
                  {...register("DOB", {
                    required: "Date of birth is required",
                  })}
                />

                <CustomInput
                  label="Email"
                  type="email"
                  required={true}
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
                  error={errors.phone?.message}
                  {...register("phone", {
                    required: "Phone is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Phone number must be 10 digits",
                    },
                  })}
                />

                <CustomInput
                  label="Parent Contact"
                  type="tel"
                  required={true}
                  error={errors.parentContact?.message}
                  {...register("parentContact", {
                    required: "Parent contact is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Phone number must be 10 digits",
                    },
                  })}
                />

                <div className="md:col-span-2">
                  <label className="block text-gray-600">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("address", {
                      required: "Address is required",
                    })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                  />
                  {errors.address && (
                    <p className="mt-1 text-red-500 text-sm">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Academic Information */}
                <CustomInput
                  label="Student ID/Roll Number"
                  type="text"
                  error={errors.studentId?.message}
                  {...register("studentId")}
                />

                <CustomInput
                  label="Registration ID"
                  type="text"
                  error={errors.registerId?.message}
                  {...register("registerId")}
                />

                <div className="md:col-span-2">
                  <label className="block text-gray-600">
                    College <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("collegeId", {
                      required: "College is required",
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                  >
                    <option value="">Select College</option>
                    {collegeData.map((college) => (
                      <option key={college.$id} value={college.$id}>
                        {college.collageName}
                      </option>
                    ))}
                  </select>
                  {errors.collegeId && (
                    <p className="mt-1 text-red-500 text-sm">
                      {errors.collegeId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-600">
                    Trade <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("tradeId", { required: "Trade is required" })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                  >
                    <option value="">Select Trade</option>
                    {tradeData.map((trade) => (
                      <option key={trade.$id} value={trade.$id}>
                        {trade.tradeName}
                      </option>
                    ))}
                  </select>
                  {errors.tradeId && (
                    <p className="mt-1 text-red-500 text-sm">
                      {errors.tradeId.message}
                    </p>
                  )}
                </div>

                {/* Batch Selection Section */}
                <div>
                  <label className="block text-gray-600">
                    Batch <span className="text-red-500">*</span>
                  </label>
                  <div className="text-gray-500 italic text-xs mb-1">
                    (If your batch is not available, please create a batch.)
                  </div>
                  <select
                    {...register("batchId", { required: "Batch is required" })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                    disabled={isLoadingBatches}
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
                  {errors.batchId && (
                    <p className="mt-1 text-red-500 text-sm">
                      {errors.batchId.message}
                    </p>
                  )}
                </div>

                <CustomInput
                  required={true}
                  label="Enrollment Date"
                  type="date"
                  error={errors.enrolledAt?.message}
                  {...register("enrolledAt", {
                    required: "Enrollment date is required",
                  })}
                />

                <CustomInput
                  label="Profile Image URL"
                  type="text"
                  {...register("profileImage")}
                />
              </div>

              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 mt-6 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  "Create Student Profile"
                )}
              </button>
            </form>
          </div>
        )
      ) : null}
    </div>
  );
};

export default AddStudents;
