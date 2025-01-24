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

const ProfileForm = () => {
  const [collegeData, setCollegeData] = useState([]);
  const [tradeData, setTradeData] = useState([]);
  const [batchesData, setBatchesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmiting, setIsSubmitting] = useState(false);
  const [othersProfile, setOthersProfile] = useState(null);

  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const { register, handleSubmit, reset } = useForm();
  const navigate = useNavigate();

  const { userId } = useParams();
  const user = useSelector(selectUser);
  const existingProfile = useSelector(selectProfile);

  const isTeacher = user.labels.includes("Teacher");
  const isStudent = !isTeacher;

  // Define which fields students can edit
  const studentEditableFields = [
    "DOB",
    "email",
    "phone",
    "parentContact",
    "address",
    "profileImage",
  ];

  const isFieldEditable = (fieldName) => {
    if (!existingProfile) return true; // Allow all fields for new profiles
    if (isTeacher) return true; // Teachers can edit everything
    return studentEditableFields.includes(fieldName); // Students can only edit specific fields
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch reference data
        const [colleges, trades, batches] = await Promise.all([
          collegeService.listColleges(),
          tradeService.listTrades(),
          batchService.listBatches(),
        ]);

        setCollegeData(colleges.documents);
        setTradeData(trades.documents);
        setBatchesData(batches.documents);

        // Handle profile data based on different scenarios
        let profileData = null;

        if (userId) {
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

      if (userId) {
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
        data.userName = user.name;
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
          <div className="md:col-span-2">
            <label className="block text-gray-600">Username</label>
            <input
              type="text"
              {...register("userName")}
              disabled={!isFieldEditable("userName")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>
          {/* Personal Information */}
          <div>
            <label className="block text-gray-600">Date of Birth</label>
            <input
              type="date"
              {...register("DOB")}
              disabled={!isFieldEditable("DOB")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>

          <div>
            <label className="block text-gray-600">Email</label>
            <input
              type="email"
              {...register("email")}
              disabled={!isFieldEditable("email")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>

          <div>
            <label className="block text-gray-600">Phone</label>
            <input
              type="number"
              {...register("phone")}
              disabled={!isFieldEditable("phone")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>

          <div>
            <label className="block text-gray-600">Parent Contact</label>
            <input
              type="number"
              {...register("parentContact")}
              disabled={!isFieldEditable("parentContact")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-600">Address</label>
            <textarea
              {...register("address")}
              disabled={!isFieldEditable("address")}
              rows={3}
              className="mt-1  block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>

          {/* Academic Information */}
          <div>
            <label className="block text-gray-600">Student ID</label>
            <input
              type="text"
              {...register("studentId")}
              disabled={!isFieldEditable("studentId")}
              className="mt-1  block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>

          <div>
            <label className="block text-gray-600">
              College <span className="text-red-500">*</span>
            </label>
            <select
              {...register("collegeId")}
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
              {...register("tradeId")}
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

          <div>
            <label className="block text-gray-600">
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              {...register("batchId")}
              disabled={!isFieldEditable("batchId")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            >
              <option value="">Select Batch</option>
              {batchesData.map((batch) => (
                <option key={batch.$id} value={batch.$id}>
                  {batch.BatchName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-600">Enrollment Date</label>
            <input
              type="date"
              {...register("enrolledAt")}
              disabled={!isFieldEditable("enrolledAt")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>

          {isTeacher && (
            <>
              <div>
                <label className="block text-gray-600">Assigned Batches</label>
                <input
                  type="text"
                  {...register("assignedBatches")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                />
              </div>

              <div>
                <label className="block text-gray-600">Specialization</label>
                <input
                  type="text"
                  {...register("specialization")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-gray-600">Grade Level</label>
                <input
                  type="text"
                  {...register("gradeLevel")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-600">Enrollment Status</label>
            <select
              {...register("enrollmentStatus")}
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
            <label className="block text-gray-600">Status</label>
            <select
              {...register("status")}
              disabled={!isFieldEditable("status")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-600">Profile Image URL</label>
            <input
              type="text"
              {...register("profileImage")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            />
          </div>
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
