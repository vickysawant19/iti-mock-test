import React, { useState, useEffect } from "react";
import batchService from "../../../../../appwrite/batchService";
import LoadingState from "../components/LoadingState";

const EditProgressCard = ({
  progressData,
  setProgressdata,
  setEditMode,
  setBatchData,
  batchData,
}) => {
  const [selectedPage, setSelectedPage] = useState(0);
  const [formData, setFormData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when component mounts or progressData changes
  useEffect(() => {
    if (progressData?.pages && progressData.pages.length > 0) {
      initializeFormData();
    }
  }, [progressData, selectedPage]);

  const calculateMarks = (presentDays, absentDays, min, max) => {
    if (presentDays === 0) return "";
    const totalDays = presentDays + absentDays;
    const attendanceRatio = totalDays === 0 ? 0 : presentDays / totalDays;

    // Scale marks based on attendance ratio
    const marks = min + (max - min) * attendanceRatio;

    // Round it to nearest integer for realism
    return Math.round(marks);
  };

  const initializeFormData = () => {
    const pageData = progressData.pages[selectedPage] || [];

    const initializedData = pageData?.data?.map((monthEntry) => {
      const [month, data] = monthEntry;
      const { presentDays = 0, absentDays = 0 } = data;

      return {
        ...data,
        month,
        theory: data.theory || calculateMarks(presentDays, absentDays, 80, 95),
        practical:
          data.practical || calculateMarks(presentDays, absentDays, 200, 245),
      };
    });

    setFormData(initializedData);
  };

  const handleInputChange = (index, field, value) => {
    const updatedFormData = [...formData];
    updatedFormData[index][field] =
      field === "theory" || field === "practical"
        ? value
        : parseInt(value) || 0;
    setFormData(updatedFormData);
  };

  const handlePageChange = (e) => {
    setSelectedPage(parseInt(e.target.value));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Create a copy of the original progressData

      const updatedProgressData = { ...progressData };

      // Update only the selected page with new form data
      updatedProgressData.pages[selectedPage].data = formData.map((item) => {
        // Create a new object without month property for storing in the array
        const dataObj = { ...item };
        delete dataObj.month;
        return [item.month, dataObj];
      });

      // Update local state
      setProgressdata(updatedProgressData);

      // Prepare data for Appwrite update
      // Get existing batchMarks array or initialize it
      let batchMarks = [];

      // Try to parse existing batchMarks if they exist
      if (batchData.batchMarks) {
        try {
          if (typeof batchData.batchMarks === "string") {
            batchMarks = JSON.parse(batchData.batchMarks);
          } else if (Array.isArray(batchData.batchMarks)) {
            // Handle case where batchMarks might be an array of strings
            batchMarks = batchData.batchMarks.map((item) =>
              typeof item === "string" ? JSON.parse(item) : item
            );
          }
        } catch (e) {
          console.log("Error parsing batchMarks:", e);
          batchMarks = [];
        }
      }

      // Check if this user already exists in batchMarks
      const existingUserIndex = batchMarks.findIndex(
        (mark) => mark && mark.userId === progressData.userId
      );

      // Get existing marks for this user or initialize empty array
      let existingMarks = [];
      if (existingUserIndex !== -1 && batchMarks[existingUserIndex].marks) {
        existingMarks = batchMarks[existingUserIndex].marks;
      }

      // Create formatted student data with only theory and practical marks for current page
      const currentPageMarks = formData.map((item) => {
        // Only include theory and practical fields
        const markData = {
          theory: item.theory !== "" ? item.theory : "",
          practical: item.practical !== "" ? item.practical : "",
        };

        return [item.month, markData];
      });

      // Merge existing marks with new marks
      const mergedMarks = [...existingMarks];

      // Update or add new marks
      currentPageMarks.forEach(([month, markData]) => {
        // Check if month already exists in marks
        const existingMonthIndex = mergedMarks.findIndex(
          ([existingMonth]) => existingMonth === month
        );

        if (existingMonthIndex !== -1) {
          // Update existing month data
          mergedMarks[existingMonthIndex] = [month, markData];
        } else {
          // Add new month data
          mergedMarks.push([month, markData]);
        }
      });

      // Update or add user data with merged marks
      if (existingUserIndex !== -1) {
        // Update existing user's data
        batchMarks[existingUserIndex] = {
          userId: progressData.userId,
          marks: mergedMarks,
        };
      } else {
        // Add new user data
        batchMarks.push({
          userId: progressData.userId,
          marks: mergedMarks,
        });
      }

      // Stringify each item in the batchMarks array
      const stringifiedBatchMarks = batchMarks.map((item) =>
        JSON.stringify(item)
      );

      // Update batch data in Appwrite
      const updatedBatch = await batchService.updateBatch(batchData.$id, {
        batchMarks: stringifiedBatchMarks,
      });

      // Update local batch data state with marks
      setBatchData(updatedBatch);

      // Exit edit mode
      setEditMode(false);
    } catch (error) {
      console.log("Error saving data:", error);
      setEditMode(false);
    } finally {
      setIsSaving(false);
    }
  };

  // If progressData is not available yet, show loading
  if (!progressData || !progressData.pages) {
    return <LoadingState />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Edit Progress</h2>
        <div className="flex items-center">
          <label htmlFor="pageSelect" className="mr-2 text-gray-700">
            Select Page:
          </label>
          <select
            id="pageSelect"
            className="border rounded-md p-2 bg-white text-gray-800"
            value={selectedPage}
            onChange={handlePageChange}
          >
            {progressData.pages.map((_, index) => (
              <option key={index} value={index}>
                Page {index + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Month</th>
              <th className="border p-3 text-left">Theory Marks</th>
              <th className="border p-3 text-left">Practical Marks</th>
            </tr>
          </thead>
          <tbody>
            {formData.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="border p-3">{item.month}</td>
                <td className="border p-3">
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={item.theory}
                    onChange={(e) =>
                      handleInputChange(index, "theory", e.target.value)
                    }
                    placeholder="Enter theory marks"
                  />
                </td>
                <td className="border p-3">
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={item.practical}
                    onChange={(e) =>
                      handleInputChange(index, "practical", e.target.value)
                    }
                    placeholder="Enter practical marks"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={handleSave}
        >
          {isSaving ? "Saving... " : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default EditProgressCard;
