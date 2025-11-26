import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { FormProvider, useForm } from "react-hook-form";
import { json, useNavigate, useParams } from "react-router-dom";
import { Query } from "appwrite";
import { ArrowLeft, Save } from "lucide-react";

import batchService from "@/appwrite/batchService";
import userProfileService from "@/appwrite/userProfileService";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { selectUser } from "@/store/userSlice";
import { addProfile, selectProfile } from "@/store/profileSlice";

import AcademicAndBatchSection from "./AcademicAndBatchSection";
import PersonalDetailsSection from "./PersonalDetailsSection";
import Loader from "@/components/components/Loader";

const ProfileForm = () => {
  const [batchesData, setBatchesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [othersProfile, setOthersProfile] = useState(null);
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState("create"); // "create" or "edit"

  const dispatch = useDispatch();
  const methods = useForm();
  const navigate = useNavigate();

  const { userId } = useParams();
  const user = useSelector(selectUser);
  const existingProfile = useSelector(selectProfile);

  // Fetch colleges and trades via RTK Query
  const { data: collegesResponse, isLoading: isCollegesLoading } =
    useListCollegesQuery();
  const collegeData = collegesResponse?.documents || [];
  const { data: tradesResponse, isLoading: isTradesLoading } =
    useListTradesQuery();
  const tradeData = tradesResponse?.documents || [];

  const isTeacher = user.labels.includes("Teacher");
  const isStudent = !isTeacher;

  const isUserProfile = userId !== undefined;
  const isEditingOwnProfile = !isUserProfile && existingProfile;
  const isEditingStudentProfile = isTeacher && isUserProfile;

  // Define which fields students can edit
  const studentEditableFields = [
    "DOB",
    "email",
    "phone",
    "parentContact",
    "address",
    "profileImage",
    "registerId",
    "studentId",
    "collegeId",
    "batchId",
    "tradeId",
    "allBatchIds",
  ];

  const isFieldEditable = (fieldName) => {
    if (formMode === "create") return true; // All fields editable in create mode
    if (isTeacher) return true; // Teachers can edit everything in edit mode
    // Students in edit mode can only edit specific fields
    return studentEditableFields.includes(fieldName);
  };

  const fetchBatchData = async () => {
    try {
      if (methods.watch("tradeId") && methods.watch("collegeId")) {
        const queryFilters = [
          Query.select(["$id", "BatchName"]),
          Query.equal("collegeId", methods.watch("collegeId")),
          Query.equal("tradeId", methods.watch("tradeId")),
          Query.equal("isActive", true),
        ];
        if (isTeacher && !isUserProfile) {
          queryFilters.push(
            Query.equal("teacherId", existingProfile?.userId || user.$id)
          );
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
        methods.setValue("batchId", batchId);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [methods.watch("tradeId"), methods.watch("collegeId")]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Handle profile data based on different scenarios
        let profileData = null;

        if (isUserProfile) {
          // Scenario 1: Editing another user's profile (admin/teacher function)
          const userProfile = await userProfileService.getUserProfile(userId);
          setOthersProfile(userProfile);
          profileData = userProfile;
          setFormMode("edit");
        } else if (existingProfile) {
          // Scenario 2: Editing current user's profile
          profileData = existingProfile;
          setFormMode("edit");
        } else {
          // Scenario 3: Creating new profile
          setFormMode("create");
        }

        if (profileData) {
          console.log("profile data", profileData);
          // Format dates for the form
          const formattedData = {
            ...profileData,
            DOB: profileData.DOB ? profileData.DOB.split("T")[0] : "",
            enrolledAt: profileData.enrolledAt
              ? profileData.enrolledAt.split("T")[0]
              : "",
            collegeId: profileData.collegeId?.$id || profileData.collegeId,
            tradeId: profileData.tradeId?.$id || profileData.tradeId,
            allBatchIds: profileData.allBatchIds
              ? profileData.allBatchIds.map((item) =>
                  typeof item === "string" ? JSON.parse(item) : item
                )
              : [],
          };
          methods.reset(formattedData);
        } else {
          methods.reset({
            userId: isTeacher && isUserProfile ? "" : user.$id,
            userName: isTeacher && isUserProfile ? "" : user.name,
            email: isTeacher && isUserProfile ? "" : user.email,
            phone: isTeacher && isUserProfile ? "" : user.phone,
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
  }, [methods.reset, userId, existingProfile]);

  const handleProfileSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      let updatedProfile;
      let newBatchData;

      data.allBatchIds = data.allBatchIds.map((itm) => JSON.stringify(itm));

      if (
        data.BatchName &&
        data.batchId === "" &&
        isTeacher &&
        !isUserProfile
      ) {
        newBatchData = await batchService.createBatch({
          BatchName: data.BatchName,
          teacherId: user.$id,
          teacherName: data.userName,
          isActive: data.isActive ?? true,
          collegeId: data.collegeId,
          tradeId: data.tradeId,
          start_date: data.start_date,
          end_date: data.end_date,
        });
        data.batchId = newBatchData.$id;
        setBatchesData((prev) => [...prev, newBatchData]);
      }

      if (isUserProfile) {
        // Updating another user's profile
        updatedProfile = await userProfileService.updateUserProfile(
          othersProfile.$id,
          data
        );
        toast.success("Profile updated successfully!");
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
          {
            ...data,
          }
        );
        dispatch(addProfile(updatedProfile));
        toast.success("Profile updated successfully!");
        navigate("/profile/edit");
      } else {
        console.log("create new profile");
        // Creating new profile
        data.role = user.labels;
        data.userId = user.$id;
        data.userName = data.userName || user.name;
        updatedProfile = await userProfileService.createUserProfile(data);
        dispatch(addProfile(updatedProfile));
        toast.success("Profile created successfully!");
        navigate("/profile/edit");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isCollegesLoading || isTradesLoading) {
    return <Loader isLoading={true} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isTeacher
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              }`}
            >
              {isTeacher ? "Teacher" : "Student"}
            </div>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formMode === "edit" ? "Edit Profile" : "Create Profile"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isEditingOwnProfile
              ? "Manage your personal and academic information"
              : isEditingStudentProfile
              ? "Update student profile details"
              : "Set up your profile information"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center text-red-700 dark:text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
            {error}
          </div>
        )}

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(handleProfileSubmit)}
            className="space-y-6"
          >
            <PersonalDetailsSection
              isFieldEditable={isFieldEditable}
              formMode={formMode}
            />

            <AcademicAndBatchSection
              collegeData={collegeData}
              tradeData={tradeData}
              batchesData={batchesData}
              isTeacher={isTeacher}
              isStudent={isStudent}
              isUserProfile={isUserProfile}
              isFieldEditable={isFieldEditable}
              formMode={formMode}
              fetchBatchData={fetchBatchData}
            />

            <div className="sticky bottom-6 z-10 pt-4">
              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-blue-600 dark:bg-blue-600 text-white py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 dark:hover:bg-blue-700 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center font-semibold text-lg disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={20} className="mr-2" />
                    {formMode === "edit" ? "Save Changes" : "Create Profile"}
                  </>
                )}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ProfileForm;
