import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FormProvider, useForm } from "react-hook-form";
import { json, useNavigate, useParams } from "react-router-dom";
import { Query } from "appwrite";
import { ArrowLeft, Save } from "lucide-react";

import tradeService from "../../../appwrite/tradedetails";
import batchService from "../../../appwrite/batchService";
import userProfileService from "../../../appwrite/userProfileService";
import collegeService from "../../../appwrite/collageService";
import { selectUser } from "../../../store/userSlice";
import { addProfile, selectProfile } from "../../../store/profileSlice";

import BatchManagementSection from "./BatchManagementSection";
import AcademicInformationSection from "./AcadamicInformationSection";
import PersonalDetailsSection from "./PersonalDetailsSection";
import Loader from "@/components/components/Loader";

const ProfileForm = () => {
  const [collegeData, setCollegeData] = useState([]);
  const [tradeData, setTradeData] = useState([]);
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
          // Format dates for the form
          const formattedData = {
            ...profileData,
            DOB: profileData.DOB ? profileData.DOB.split("T")[0] : "",
            enrolledAt: profileData.enrolledAt
              ? profileData.enrolledAt.split("T")[0]
              : "",
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
        navigate("/profile/edit");
      } else {
        console.log("create new profile");
        // Creating new profile
        data.role = user.labels;
        data.userId = user.$id;
        data.userName = data.userName || user.name;
        updatedProfile = await userProfileService.createUserProfile(data);
        dispatch(addProfile(updatedProfile));
        navigate("/profile/edit");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

  return (
    <div className=" bg-gray-50 dark:bg-gray-900 p-6 ">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-600"
        >
          <ArrowLeft size={18} className="mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center">
          {formMode === "edit" ? "Edit Profile" : "Create Profile"}
          {isEditingStudentProfile && " (Student)"}
        </h1>
        <div className="w-20"></div> {/* Spacer for alignment */}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-400 p-4 mb-6">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Role Badge */}
      <div className="flex mb-6 items-center">
        <div
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            isTeacher
              ? "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300"
              : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
          }`}
        >
          {isTeacher ? "Teacher" : "Student"}
        </div>

        {formMode === "edit" && (
          <span className="ml-3 text-gray-500 dark:text-gray-400 text-sm">
            {isEditingOwnProfile
              ? "Editing your own profile"
              : isEditingStudentProfile
              ? "Editing student profile"
              : "Editing profile"}
          </span>
        )}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleProfileSubmit)}>
          <PersonalDetailsSection
            isFieldEditable={isFieldEditable}
            formMode={formMode}
          />

          <AcademicInformationSection
            collegeData={collegeData}
            tradeData={tradeData}
            isFieldEditable={isFieldEditable}
            formMode={formMode}
          />

          <BatchManagementSection
            batchesData={batchesData}
            isTeacher={isTeacher}
            isStudent={isStudent}
            isUserProfile={isUserProfile}
            isFieldEditable={isFieldEditable}
            formMode={formMode}
            fetchBatchData={fetchBatchData}
          />

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full bg-blue-500 dark:bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition duration-200 flex items-center justify-center disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            <Save size={20} className="mr-2" />
            {isSubmitting
              ? "Processing..."
              : formMode === "edit"
              ? "Update Profile"
              : "Create Profile"}
          </button>
        </form>
      </FormProvider>
    </div>
  );
};

export default ProfileForm;
