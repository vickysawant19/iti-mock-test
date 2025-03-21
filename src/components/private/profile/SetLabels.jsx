import React, { useState } from "react";
import { FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { addUser, selectUser } from "../../../store/userSlice";
import { appwriteService } from "../../../appwrite/appwriteConfig";
import { toast } from "react-toastify";

const SetLabels = () => {
  const user = useSelector(selectUser);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  const handleLabelSelection = (label) => {
    setSelectedLabel(label);
  };

  const handleSubmit = async () => {
    if (!selectedLabel) {
      alert("Please select a label before proceeding.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await appwriteService.functions.createExecution(
        "678e7277002e1d5c9b9b",
        JSON.stringify({
          action: "updateLabels",
          userId: user.$id,
          labels: [selectedLabel],
        })
      );
      const parsedResponse = JSON.parse(response.responseBody);
      if(parsedResponse.error) {
        toast.error(`Error : ${parsedResponse.error}`)
      }
      dispatch(addUser(parsedResponse.data));
    } catch (error) {
      console.error("Error updating labels", error);
      alert("An error occurred while updating labels. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-xl font-bold mb-4 text-center">Select Your Role</h2>
        <div className="flex justify-around mb-6">
          <div
            className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border transition-all ${
              selectedLabel === "Student"
                ? "border-blue-500 bg-blue-100"
                : "border-gray-300"
            }`}
            onClick={() => handleLabelSelection("Student")}
          >
            <FaUserGraduate
              size={48}
              className={
                selectedLabel === "Student" ? "text-blue-500" : "text-gray-400"
              }
            />
            <span className="mt-2 font-medium">Student</span>
          </div>
          <div
            className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border transition-all ${
              selectedLabel === "Teacher"
                ? "border-green-500 bg-green-100"
                : "border-gray-300"
            }`}
            onClick={() => handleLabelSelection("Teacher")}
          >
            <FaChalkboardTeacher
              size={48}
              className={
                selectedLabel === "Teacher" ? "text-green-500" : "text-gray-400"
              }
            />
            <span className="mt-2 font-medium">Teacher</span>
          </div>
        </div>
        <button
          className={`w-full py-2 px-4 rounded-lg transition-all text-white ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default SetLabels;
