import { useEffect, useState } from "react";
import { Query } from "appwrite";
import { faceService } from "../../../../../appwrite/faceService";
import {
  generateBinaryHash,
  generateHashArrayForAdd,
  generateHashQuery,
} from "./util";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../../../store/profileSlice";
import { selectUser } from "../../../../../store/userSlice";
import userProfileService from "../../../../../appwrite/userProfileService";
import CustomSelectData from "../../../../components/customSelectData";
import { User, UserCheck, RefreshCw, Trash2, Camera } from "lucide-react";

const AddFaceMode = ({ captureFace, captureLoading, faceDetected }) => {
  const [samples, setSamples] = useState([]);
  const [resultMessage, setResultMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "info"
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState("add"); // "add" or "update"

  const [studentsProfile, setStudentsProfile] = useState(null);
  const [isProfilesLoading, setIsProfilesLoading] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isTeacher = user.labels?.includes("Teacher");

  // Memoize student data fetch to prevent unnecessary re-fetches
  const fetchStudentsProfiles = async () => {
    if (!profile?.batchId) return;
    setIsProfilesLoading(true);
    try {
      const data = await userProfileService.getBatchUserProfile([
        Query.equal("batchId", profile.batchId),
        Query.select(["userId", "userName", "studentId"]),
        Query.equal("status", "Active"),
      ]);

      const studentIds = data.map((student) => student.userId);
      const faceData = await faceService.getMatches([
        Query.equal("userId", studentIds),
        Query.select(["$id", "userId", "name"]),
      ]);

      const newData = data.map((student) => ({
        ...student,
        faceData: faceData.documents.find(
          (user) => user.userId === student.userId
        ),
      }));

      setStudentsProfile(newData);
    } catch (error) {
      console.log(error);
    } finally {
      setIsProfilesLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsProfiles();
  }, [isTeacher, user]);

  // Check if face hash already exists in database
  const checkFaceExists = async (hash, extraQueries) => {
    const hashArray = generateHashArrayForAdd(hash);
    const query = generateHashQuery(hashArray);

    let queries = [
      query,
      Query.limit(1),
      Query.select(["$id", "userId", "name"]),
    ];

    if (extraQueries) {
      queries.push(...extraQueries);
    }

    try {
      const existingFaces = await faceService.getMatches(queries);
      return existingFaces.documents[0];
    } catch (error) {
      console.error("Error checking face existence:", error);
      return false;
    }
  };

  const handleAddFace = async () => {
    if (!faceDetected || isVerifying || samples.length >= 5) {
      return;
    }

    setResultMessage("");
    setIsVerifying(true);

    try {
      // Using the face detection from our hook
      const detection = await captureFace();

      if (!detection) {
        setResultMessage("No face detected. Please try again.");
        setMessageType("error");
        return;
      }

      // Generate hash for the captured face
      const hash = generateBinaryHash(detection.descriptor);

      // Check if this face already exists
      const faceExists = await checkFaceExists(
        hash,
        mode === "add"
          ? undefined
          : [Query.notEqual("userId", selectedStudentProfile.userId)]
      );

      if (faceExists && faceExists.userId !== selectedStudentProfile.userId) {
        setResultMessage(
          `This face of ${faceExists.name} is already registered in the system. Try a different angle.`
        );
        setMessageType("error");
        return;
      }

      // Face not in database or in update mode, add to samples
      setSamples((prev) => [
        ...prev,
        {
          descriptor: detection.descriptor,
          hash: hash,
        },
      ]);

      setResultMessage(
        `Face sample added. Total samples: ${samples.length + 1}/5`
      );
      setMessageType("success");
    } catch (error) {
      console.error("Error processing face:", error);
      setResultMessage("Error processing face. Please try again.");
      setMessageType("error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveRegistration = async () => {
    setResultMessage("");
    if (!selectedStudentProfile) return;

    if (samples.length !== 5) {
      setResultMessage("Please add exactly 5 face samples before saving.");
      setMessageType("error");
      return;
    }

    setIsSaving(true);

    try {
      // Extract hashes and descriptors from samples
      const hashes = samples.map((sample) => sample.hash);
      const stringDescriptors = samples.map((sample) =>
        JSON.stringify(sample.descriptor)
      );

      const name = selectedStudentProfile.userName
        .split(" ")
        .map((n, i) => (i === 0 ? n : n[0]))
        .join(" ");

      let response = null;

      if (mode === "update" && selectedStudentProfile.faceData) {
        // Update existing face data
        response = await faceService.updateFaceData(
          selectedStudentProfile.faceData.$id,
          {
            name,
            hash: hashes,
            descriptor: stringDescriptors,
          }
        );
        setResultMessage("Face data updated successfully!");
      } else {
        // Store new face data in Appwrite
        response = await faceService.storeFaces({
          name,
          userId: selectedStudentProfile.userId,
          userName: selectedStudentProfile.userName,
          batchId: profile.batchId, // Teacher batchId associated with the student
          hash: hashes,
          descriptor: stringDescriptors,
        });
        setResultMessage("Face registered successfully!");
      }

      setSelectedStudentProfile((prev) => ({ ...prev, faceData: response }));
      setMessageType("success");
      // Reset the fields
      setSamples([]);
      // Refresh the student profiles to update UI
      await fetchStudentsProfiles();
    } catch (error) {
      console.error("Error saving face data:", error);
      setResultMessage("Error saving face data. Please try again.");
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFaceData = async () => {
    if (!selectedStudentProfile?.faceData?.$id) {
      setResultMessage("No face data to delete.");
      setMessageType("error");
      return;
    }

    setIsDeleting(true);
    setResultMessage("");

    try {
      await faceService.deleteFaceData(selectedStudentProfile.faceData.$id);
      setResultMessage("Face data deleted successfully!");
      setSelectedStudentProfile((prev) => ({ ...prev, faceData: null }));
      setMessageType("success");
      setSamples([]);
      setMode("add");

      // Refresh the student profiles to update UI
      await fetchStudentsProfiles();
    } catch (error) {
      console.error("Error deleting face data:", error);
      setResultMessage("Error deleting face data. Please try again.");
      setMessageType("error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectedStudent = (student) => {
    setResultMessage("");
    setSelectedStudentProfile(student);
    setSamples([]);

    // If student has face data, offer update mode
    if (student?.faceData) {
      setMode("update");
    } else {
      setMode("add");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300 },
    },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <div className="flex flex-col gap-6 p-6 dark:bg-gray-900 rounded-lg ">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {mode === "update" ? "Update Face Data" : "Register New Face"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Take 5 different angles of Selected User face to{" "}
          {mode === "update" ? "update" : "register"}
        </p>
      </div>

      <div>
        <CustomSelectData
          value={selectedStudentProfile}
          valueKey="userId"
          labelKey="userName"
          options={studentsProfile || []}
          renderOptionLabel={(option) => (
            <div className="flex justify-between items-center w-full gap-4">
              <span className="text-gray-800 dark:text-gray-100">
                {option.userName}
              </span>
              {option.faceData ? (
                <UserCheck
                  size={18}
                  className="text-green-500 dark:text-green-400"
                />
              ) : (
                <User size={18} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
          )}
          label="User"
          placeholder="Select User"
          disabled={isProfilesLoading}
          onChange={handleSelectedStudent}
        />
      </div>

      {selectedStudentProfile && (
        <div className="space-y-4">
          {/* Mode toggle if face data exists */}
          {selectedStudentProfile.faceData && (
            <div className="flex items-center justify-between mb-4 bg-blue-50 dark:bg-gray-800 p-4 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Face data already exists for this student
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  You can update or delete the existing face data
                </p>
              </div>
              <button
                className="p-2 bg-red-500 text-white rounded-lg flex items-center gap-2 hover:bg-red-600 dark:hover:bg-red-400 transition-colors"
                onClick={handleDeleteFaceData}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Registration form */}
          <div className="space-y-4 mb-4">
            {/* Samples progress */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Face Samples
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {samples.length} / 5
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(samples.length / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Result message */}
            {resultMessage && (
              <div
                className={`p-3 rounded-lg ${
                  messageType === "success"
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                    : messageType === "error"
                    ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300"
                }`}
              >
                {resultMessage}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition duration-200 flex items-center justify-center gap-2 ${
                isVerifying || samples.length >= 5 || captureLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : faceDetected
                  ? "bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={handleAddFace}
              disabled={
                samples.length >= 5 ||
                isVerifying ||
                !faceDetected ||
                captureLoading
              }
            >
              {isVerifying || captureLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Camera size={18} />
                  <span>Add Face Sample</span>
                </>
              )}
            </button>

            <button
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition duration-200 flex items-center justify-center gap-2 ${
                samples.length === 5
                  ? "bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-400"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={handleSaveRegistration}
              disabled={samples.length !== 5 || isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  <span>
                    {mode === "update"
                      ? "Update Registration"
                      : "Save Registration"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFaceMode;
