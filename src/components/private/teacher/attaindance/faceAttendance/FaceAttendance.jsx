// src/components/FaceAttendance.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import AddFaceMode from "./AddFaces";
import MatchFaceMode from "./MatchFaces";
import useFaceApi from "./hooks/useFaceApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import { UserPlus, UserSearch } from "lucide-react";

const FaceAttendance = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [mode, setMode] = useState("add"); // "add" or "match"

  const videoConstraints = {
    width: 512,
    height: 512,
    facingMode: "user",
  };

  // Pass cameraEnabled into the hook so detection only runs when it's true
  const {
    modelsLoading,
    modelLoadingProgress,
    modelError,
    isInitializing,
    captureFace,
    captureLoading,
    captureError,
    faceDetected,
    clearCanvas,
    resizeCanvas,
    detectFace,
    resultMessage,
    setResultMessage,
    faceapi,
  } = useFaceApi({ webcamRef, canvasRef, cameraEnabled });

  // Show toast on capture errors
  useEffect(() => {
    if (captureError) {
      toast.error(captureError);
    }
  }, [captureError]);

  const toggleCamera = useCallback(() => {
    setCameraEnabled((was) => {
      const now = !was;
      if (now) {
        toast.success("Camera activated");
        // give the webcam a moment to start
        setTimeout(resizeCanvas, 500);
      }
      return now;
    });
  }, [resizeCanvas]);

  const handleWebcamLoad = useCallback(() => {
    if (webcamRef.current?.video) {
      setTimeout(resizeCanvas, 500);
    }
  }, [resizeCanvas]);

  if (modelError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="p-4 bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center mb-3 text-red-500">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-center text-gray-800 mb-2">
            Error Loading Models
          </h2>
          <p className="text-gray-600 text-center text-sm">
            {modelError.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 ">
      <div className="  bg-white rounded-lg p-4 flex flex-col gap-4 w-full">
        <div className="flex justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-center  text-gray-800">
            Face Attendance System
          </h1>
          <button
            onClick={toggleCamera}
            className={`max-w-xs  py-2 px-4 rounded-lg text-sm font-medium transition duration-200 ${
              cameraEnabled
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {cameraEnabled ? "Disable Camera" : "Enable Camera"}
          </button>
        </div>

        {/* Model loading progress */}
        {modelsLoading && (
          <div className="">
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">
                Loading face detection models
              </span>
              <span className="text-xs font-medium text-gray-700">
                {modelLoadingProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${modelLoadingProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Please wait while we initialize the face detection system
            </p>
          </div>
        )}

        {/* Initialization spinner */}
        {!modelsLoading && isInitializing && (
          <div className="mb-6 flex justify-center items-center">
            <ClipLoader />
            <span className="text-sm font-medium text-gray-700">
              Initializing face detection...
            </span>
          </div>
        )}
      </div>

      {/* Main UI */}
      {!modelsLoading && !isInitializing && cameraEnabled && (
        <div className=" bg-white p-4 rounded-lg mt-4 flex flex-col justify-center  lg:flex-row gap-6  ">
          {/* Left Column - Camera Section */}
          <div className="w-full lg:w-1/2 ">
            <div className="rounded-md p-3 w-full max-w-md">
              <div className="relative bg-gray-200 rounded-lg shadow-inner p-2 flex items-stretch gap-2">
                {/* Active background highlight that animates */}
                <div
                  className={`absolute top-1 bottom-1 w-1/2 rounded-lg bg-blue-500 shadow-md transition-all duration-300 ease-in-out ${
                    mode === "add" ? "left-1" : "left-1/2 -ml-1"
                  }`}
                />

                {/* Add Face Button */}
                <button
                  onClick={() => setMode("add")}
                  className={`relative flex-1 py-2 rounded-lg text-sm font-medium transition duration-200 z-10 flex items-center justify-center gap-2 ${
                    mode === "add"
                      ? "text-white"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  <UserPlus
                    className={`transition-transform duration-300 ${
                      mode === "add" ? "scale-110" : "scale-100"
                    }`}
                    size={20}
                  />
                  <span
                    className={`transition-all duration-300 ${
                      mode === "add" ? "font-bold" : ""
                    }`}
                  >
                    Add Face
                  </span>
                </button>

                {/* Match Face Button */}
                <button
                  onClick={() => setMode("match")}
                  className={`relative flex-1 py-2 rounded-lg text-sm font-medium transition duration-200 z-10 flex items-center justify-center gap-2 ${
                    mode === "match"
                      ? "text-white"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  <UserSearch
                    className={`transition-transform duration-300 ${
                      mode === "match" ? "scale-110" : "scale-100"
                    }`}
                    size={20}
                  />
                  <span
                    className={`transition-all duration-300 ${
                      mode === "match" ? "font-bold" : ""
                    }`}
                  >
                    Match Face
                  </span>
                </button>
              </div>
            </div>

            {/* Webcam + Canvas */}
            <div className="mb-6 flex justify-center items-center s pt-4">
              <div className="relative w-full max-w-xs">
                <div className="relative pb-[100%] overflow-hidden">
                  <div
                    className={`absolute inset-0 rounded-full w-full h-full object-contain border-4 overflow-hidden flex items-center justify-center bg-black ${
                      faceDetected ? "border-green-400" : "border-slate-300"
                    }`}
                  >
                    {/* Webcam Video Feed */}
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      videoConstraints={videoConstraints}
                      mirrored={false}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Canvas Overlay */}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full z-10"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      faceDetected
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300"
                    }`}
                  >
                    {faceDetected ? "Face Detected" : "No Face Detected"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form Section */}
          <div className="w-full lg:w-1/2  rounded-xl shadow-sm  h-full">
            <div className="w-full rounded-xl h-full bg-slate-200">
              {mode === "add" ? (
                <AddFaceMode
                  captureFace={captureFace}
                  captureLoading={captureLoading}
                  faceDetected={faceDetected}
                />
              ) : (
                <MatchFaceMode
                  faceapi={faceapi}
                  detectFace={detectFace}
                  resultMessage={resultMessage}
                  setResultMessage={setResultMessage}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceAttendance;
