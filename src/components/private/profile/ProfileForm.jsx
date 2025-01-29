import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import tradeService from "../../../appwrite/tradedetails";
import batchService from "../../../appwrite/batchService";
import userProfileService from "../../../appwrite/userProfileService";
import collegeService from "../../../appwrite/collageService";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { selectUser } from "../../../store/userSlice";
import { addProfile, selectProfile } from "../../../store/profileSlice";
import { Query } from "appwrite";
import CustomInput from "../../components/CustomInput";

const ProfileForm = () => {
  const [collegeData, setCollegeData] = useState([]);
  const [tradeData, setTradeData] = useState([]);
  const [batchesData, setBatchesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmiting, setIsSubmitting] = useState(false);
  const [othersProfile, setOthersProfile] = useState(null);

  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const navigate = useNavigate();

  const { userId } = useParams();
  const user = useSelector(selectUser);
  const existingProfile = useSelector(selectProfile);

  const isTeacher = user.labels.includes("Teacher");
  const isStudent = !isTeacher;
  const isUserProfile = userId !== undefined;

  // Define which fields students can edit
  const studentEditableFields = [
    "DOB",
    "email",
    "phone",
    "parentContact",
    "address",
    "profileImage",
    "registerId",
  ];

  const isFieldEditable = (fieldName) => {
    if (!existingProfile) return true; // Allow all fields for new profiles
    if (isTeacher) return true; // Teachers can edit everything
    return studentEditableFields.includes(fieldName); // Students can only edit specific fields
  };

  const fetchFeildData = async () => {
    try {
      if (watch("tradeId") && watch("collegeId")) {
        const queryFilters = [
          Query.equal("collegeId", watch("collegeId")),
          Query.equal("tradeId", watch("tradeId")),
          Query.equal("isActive", true),
        ];
        if (isTeacher && !isUserProfile) {
          queryFilters.push(Query.equal("teacherId", existingProfile.userId));
        }
        const response = await batchService.listBatches(queryFilters);
        setBatchesData(response.documents);
        const batchExists = response.documents.some(
          (doc) =>
            doc.$id === (existingProfile?.batchId || othersProfile?.batchId)
        );
        const batchId = batchExists
          ? existingProfile?.batchId || othersProfile?.batchId
          : "";
        setValue("batchId", batchId);
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
  };

  useEffect(() => {
    fetchFeildData();
  }, [watch("tradeId"), watch("collegeId")]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch reference data
        const [colleges, trades] = await Promise.all([
          collegeService.listColleges(),
          tradeService.listTrades(),
        ]);

        setCollegeData(colleges.documents);
        setTradeData(trades.documents);

        // Handle profile data based on different scenarios
        let profileData = null;

        if (isUserProfile) {
          // Scenario 1: Editing another user's profile (admin/teacher function)
          const userProfile = await userProfileService.getUserProfile(userId);
          setOthersProfile(userProfile);

          profileData = userProfile;
        } else if (existingProfile) {
          // Scenario 2: Editing current user's profile
          profileData = existingProfile;
        }
        // Scenario 3: Creating new profile (handled by default form state)

        if (profileData) {
          // Format dates for the form
          const formattedData = {
            ...profileData,
            DOB: profileData.DOB ? profileData.DOB.split("T")[0] : "",
            enrolledAt: profileData.enrolledAt
              ? profileData.enrolledAt.split("T")[0]
              : "",
          };
          reset(formattedData);
        } else {
          console.log("Welcome New User");
          reset({
            userId: user.$id,
            userName: user.name,
            email: user.email,
            phone: user.phone,
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [reset, userId, existingProfile]);

  const handleProfileSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      let updatedProfile;
      let newBatchData;
      if (data.batchName !== "" && data.batchId === "" && isTeacher) {
        newBatchData = await batchService.createBatch({
          BatchName: data.BatchName,
          teacherId: user.$id,
          teacherName: data.userName,
          isActive: data.isActive,
          collegeId: data.collegeId,
          tradeId: data.tradeId,
          start_date: data.start_date,
          end_date: data.end_date,
        });
        data.batchId = newBatchData.$id;
        setBatchesData((prev) => [...prev, newBatchData]);
      }
      if (isUserProfile) {
        console.log("updating other user ", userId);
        // Updating another user's profile
        updatedProfile = await userProfileService.updateUserProfile(
          othersProfile.$id,
          data
        );
        navigate(-1);
      } else if (existingProfile) {
        // Updating current user's profile
        if (isStudent) {
          // Preserve non-editable fields for students
          Object.keys(existingProfile).forEach((key) => {
            if (!studentEditableFields.includes(key)) {
              data[key] = existingProfile[key];
            }
          });
        }
        updatedProfile = await userProfileService.updateUserProfile(
          existingProfile.$id,
          data
        );
        dispatch(addProfile(updatedProfile));
        navigate("/profile");
      } else {
        // Creating new profile
        data.role = user.labels;
        data.userId = user.$id;
        data.userName = data.userName || user.name;
        updatedProfile = await userProfileService.createUserProfile(data);
        dispatch(addProfile(updatedProfile));
        navigate("/profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full animate-spin border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {existingProfile ? "Edit Your Profile" : "Create Your Profile"}
      </h1>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      <form onSubmit={handleSubmit(handleProfileSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            label={"Username"}
            extraclass={"md:col-span-2"}
            required={true}
            type="text"
            {...register("userName", { required: true })}
            disabled={!isFieldEditable("userName")}
          />
          {/* Personal Information */}
          <CustomInput
            label={"Date of Birth"}
            required={true}
            type="date"
            {...register("DOB", { required: true })}
            disabled={!isFieldEditable("DOB")}
          />
          <CustomInput
            label={"Email"}
            type="email"
            required={true}
            {...register("email", { required: true })}
            disabled={!isFieldEditable("email")}
          />
          <CustomInput
            label={"Phone"}
            type="number"
            required={true}
            {...register("phone", { required: true })}
            disabled={!isFieldEditable("phone")}
          />
          <CustomInput
            label={"Parent Contact"}
            type="number"
            required={true}
            {...register("parentContact", { required: true })}
            disabled={!isFieldEditable("parentContact")}
          />
          <div className="md:col-span-2">
            <label className="block text-gray-600">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("address", { required: true })}
              disabled={!isFieldEditable("address")}
              rows={3}
              className="mt-1  block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>
          {/* Academic Information */}
          <CustomInput
            label={"Student ID"}
            type="text"
            {...register("studentId")}
            disabled={!isFieldEditable("studentId")}
          />
          <CustomInput
            label={"Registration ID"}
            type="text"
            {...register("registerId")}
            disabled={!isFieldEditable("registerId")}
          />
          <div className="md:col-span-2">
            <label className="block text-gray-600">
              College <span className="text-red-500">*</span>
            </label>
            <select
              {...register("collegeId", { required: true })}
              disabled={!isFieldEditable("collegeId")}
              className="mt-1  block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            >
              <option value="">Select College</option>
              {collegeData.map((college) => (
                <option key={college.$id} value={college.$id}>
                  {college.collageName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-600">
              Trade <span className="text-red-500">*</span>
            </label>
            <select
              {...register("tradeId", { required: true })}
              disabled={!isFieldEditable("tradeId")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            >
              <option value="">Select Trade</option>
              {tradeData.map((trade) => (
                <option key={trade.$id} value={trade.$id}>
                  {trade.tradeName}
                </option>
              ))}
            </select>
          </div>
          {/* /* Batch Selection and Creation Section */}
          <div className="">
            <label className="block text-gray-600">
              Batch
              {isStudent ? (
                <span className="text-red-500">*</span>
              ) : (
                <div className="text-gray-500 italic text-sm">
                  (If Your batch Not available. Please create a batch.)
                </div>
              )}
            </label>

            <select
              {...register("batchId", {
                required: isStudent,
              })}
              disabled={!isFieldEditable("batchId")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
              value={watch("batchId") || ""}
              onChange={(e) => setValue("batchId", e.target.value)}
            >
              <option value="">Select Batch</option>
              {batchesData.length > 0 &&
                batchesData.map((batch) => (
                  <option key={batch.$id} value={batch.$id}>
                    {batch.BatchName}
                  </option>
                ))}
            </select>
          </div>
          {/* Batch Creation Section - Only visible for teachers when no batch is selected */}
          {isTeacher && !watch("batchId") && (
            <div className="bg-gray-50 p-4 rounded-lg mt-4 md:col-span-2">
              <h3 className="font-medium mb-3">Create New Batch</h3>
              <div className="space-y-3">
                <CustomInput
                  label={"Batch Name"}
                  type="text"
                  {...register("BatchName")}
                  placeholder="Enter batch name e.g: 2022-2023 - Your Name -"
                />
                <div className="grid grid-cols-2 gap-3">
                  <CustomInput
                    label={"Start Date"}
                    type="date"
                    {...register("start_date")}
                  />

                  <CustomInput
                    label={"End Date"}
                    type="date"
                    {...register("end_date")}
                  />
                </div>
                <div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      {...register("isActive")}
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-600">
                      Batch Status
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
          <CustomInput
            required={true}
            label={"Enrollment Date"}
            type="date"
            {...register("enrolledAt", { required: true })}
            disabled={!isFieldEditable("enrolledAt")}
          />
          <div>
            <label className="block text-gray-600">
              Enrollment Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("enrollmentStatus", { required: true })}
              disabled={!isFieldEditable("enrollmentStatus")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-600">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("status", { required: true })}
              disabled={!isFieldEditable("status")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <CustomInput
            label={"Profile Image URL"}
            type="text"
            {...register("profileImage")}
          />
        </div>

        <button
          disabled={isSubmiting}
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 mt-6 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {existingProfile ? "Update Profile" : "Create Profile"}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
