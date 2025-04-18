import { useEffect, useState } from "react";
import { Query } from "appwrite";

import { faceService } from "../../../../../appwrite/faceService";
import {
  generateBinaryHash,
  generateHashQuery,
  generateHashArray,
} from "./util";

const AddFaceMode = ({ captureFace, captureLoading, faceDetected }) => {
  const [samples, setSamples] = useState([]);
  const [registrationName, setRegistrationName] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "info"
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if face hash already exists in database
  const checkFaceExists = async (hash) => {
    const hashArray = generateHashArray(hash);
    const query = generateHashQuery(hashArray);

    try {
      const existingFaces = await faceService.getMatches([
        query,
        Query.limit(1),
        Query.select("name"),
      ]);

      return existingFaces.documents.length > 0;
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
      const faceExists = await checkFaceExists(hash);

      if (faceExists) {
        setResultMessage(
          "This face is already registered in the system. Try a different angle."
        );
        setMessageType("error");
        return;
      }

      // Face not in database, add to samples
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

    if (!registrationName.trim()) {
      setResultMessage("Please enter a unique name.");
      setMessageType("error");
      return;
    }

    if (samples.length !== 5) {
      setResultMessage("Please add exactly 5 face samples before saving.");
      setMessageType("error");
      return;
    }

    try {
      // Extract hashes and descriptors from samples
      const hashes = samples.map((sample) => sample.hash);
      const stringDescriptors = samples.map((sample) =>
        JSON.stringify(sample.descriptor)
      );

      // Check if name already exists
      const nameExists = await faceService.getMatches([
        Query.equal("name", registrationName),
        Query.limit(1),
      ]);

      if (nameExists.documents.length > 0) {
        setResultMessage(
          "This name is already registered. Please use a different name."
        );
        setMessageType("error");
        return;
      }

      // Store face data in Appwrite
      await faceService.storeFaces({
        name: registrationName.trim(),
        hash: hashes,
        descriptor: stringDescriptors,
      });

      setResultMessage("Face registered successfully!");
      setMessageType("success");

      // Reset the fields
      setSamples([]);
      setRegistrationName("");
    } catch (error) {
      console.error("Error saving face data:", error);
      setResultMessage("Error saving face data. Please try again.");
      setMessageType("error");
    }
  };

  // We don't need the detectFace function here anymore as we're using the faceDetected prop
  // Remove the useEffect that was previously running face detection at intervals

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Register New Face
        </h2>
        <p className="text-gray-600">
          Take 5 different angles of your face to register
        </p>
      </div>

      {/* Registration form */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Registration Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter unique name"
            value={registrationName}
            onChange={(e) => setRegistrationName(e.target.value)}
          />
        </div>

        {/* Samples progress */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Face Samples
            </span>
            <span className="text-sm font-medium text-gray-700">
              {samples.length} / 5
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(samples.length / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Result message */}
        {resultMessage && (
          <div
            className={`p-3 rounded-lg ${
              messageType === "success"
                ? "bg-green-100 text-green-800"
                : messageType === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {resultMessage}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 mt-2">
        <button
          className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition duration-200 ${
            isVerifying || samples.length >= 5 || captureLoading
              ? "bg-gray-400 cursor-not-allowed"
              : faceDetected
              ? "bg-blue-500 hover:bg-blue-600"
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
          {isVerifying || captureLoading ? "Processing..." : "Add Face Sample"}
        </button>

        <button
          className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition duration-200 ${
            samples.length === 5
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={handleSaveRegistration}
          disabled={samples.length !== 5}
        >
          Save Registration
        </button>
      </div>
    </div>
  );
};

export default AddFaceMode;
