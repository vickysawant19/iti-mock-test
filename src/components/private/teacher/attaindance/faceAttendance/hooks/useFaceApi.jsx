import { useState, useEffect, useCallback, useRef } from "react";
import * as faceapi from "face-api.js";

const useFaceApi = ({ webcamRef, canvasRef, cameraEnabled }) => {
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [modelError, setModelError] = useState(null);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [detectionResult, setDetectionResult] = useState(null);
  const [resultMessage, setResultMessage] = useState("");
  const detectIntervalRef = useRef(null);
  const lastDetectionRef = useRef(null);

  // 1. Load models once with improved progress tracking
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        const nets = [
          { net: faceapi.nets.tinyFaceDetector, name: "Face Detector" },
          { net: faceapi.nets.faceLandmark68Net, name: "Landmarks" },
          { net: faceapi.nets.faceRecognitionNet, name: "Recognition" },
        ];

        for (let i = 0; i < nets.length; i++) {
          await nets[i].net.loadFromUri(MODEL_URL);
          setModelLoadingProgress(Math.round(((i + 1) / nets.length) * 100));
        }

        console.log("All models loaded successfully");
        setModelsLoading(false);
        // Small pause so UI has time to render video
        setTimeout(() => setIsInitializing(false), 500);
      } catch (err) {
        console.error("Error loading models:", err);
        setModelError(err);
        setModelsLoading(false);
        setIsInitializing(false);
      }
    };

    loadModels();
  }, []);

  // 2. Improved canvas resize function with error handling
  const resizeCanvas = useCallback(() => {
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.warn("Video or canvas not ready for resize");
      return null;
    }

    try {
      // Get video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Get the on-screen display size of the video container
      const { width: displayWidth, height: displayHeight } =
        video.getBoundingClientRect();

      // Set the drawing buffer to match video dimensions
      canvas.width = displayWidth || videoWidth;
      canvas.height = displayHeight || videoHeight;

      // Ensure CSS size matches display size
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      return {
        videoWidth,
        videoHeight,
        displayWidth,
        displayHeight,
      };
    } catch (error) {
      console.error("Error resizing canvas:", error);
      return null;
    }
  }, [webcamRef, canvasRef]);

  // 3. Draw detection results on canvas
  const drawDetectionResults = useCallback(
    (detection, matchResult = null) => {
      const canvas = canvasRef.current;
      const video = webcamRef.current?.video;

      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detection) return;

      const { displayWidth, displayHeight } = resizeCanvas();

      // Resize detection results to match display size
      const resizedDetection = faceapi.resizeResults(detection, {
        width: displayWidth,
        height: displayHeight,
      });

      // Draw standard faceapi detection box
      faceapi.draw.drawDetections(canvas, [resizedDetection]);

      // Draw additional info if we have match results
      if (matchResult) {
        const { x, y, width, height } = resizedDetection.detection.box;
        const isMatched = matchResult.name !== "Unknown";

        // Draw colored box based on match status
        ctx.lineWidth = 2;
        ctx.strokeStyle = isMatched ? "#10B981" : "#EF4444"; // green for match, red for unknown
        ctx.strokeRect(x, y, width, height);

        // Calculate info box position (above face)
        const boxY = Math.max(y - 50, 10);
        const boxHeight = 40;

        // Draw semi-transparent background for text
        ctx.fillStyle = isMatched
          ? "rgba(16, 185, 129, 0.8)" // green with opacity
          : "rgba(239, 68, 68, 0.8)"; // red with opacity
        ctx.fillRect(x, boxY, width, boxHeight);

        // Draw text
        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(matchResult.name, x + 5, boxY + 25);

        // Set result message
        if (isMatched) {
          const confidenceScore = Math.round((1 - matchResult.distance) * 100);
          setResultMessage(
            `Matched: ${matchResult.name} (${confidenceScore}% confidence)`
          );
        } else {
          setResultMessage("Unknown face detected");
        }
      } else if (detection) {
        setResultMessage("Processing face...");
      }
    },
    [canvasRef, webcamRef]
  );

  // 4. Optimized face detection with integrated drawing
  const detectFace = useCallback(
    async (attemptMatchCallback = null) => {
      // Skip if elements not ready or models still loading
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      if (
        !cameraEnabled ||
        !video ||
        video.readyState !== 4 ||
        !canvas ||
        modelsLoading ||
        isInitializing
      ) {
        setFaceDetected(false);
        setResultMessage("");
        return null;
      }

      // Throttle detections (don't run if less than 200ms since last detection)
      const now = Date.now();
      if (lastDetectionRef.current && now - lastDetectionRef.current < 200) {
        return lastDetectionRef.current;
      }

      lastDetectionRef.current = now;

      // Make sure canvas buffer matches display
      resizeCanvas();

      try {
        // Configure faceapi with dimensions
        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight,
        };
        faceapi.matchDimensions(canvas, displaySize);

        // Run detection + landmarks + descriptor
        const detection = await faceapi
          .detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320, // Smaller for better performance
              scoreThreshold: 0.5,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        setFaceDetected(!!detection);
        setDetectionResult(detection);

        // Clear canvas
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          let matchResult = null;

          // If a match callback is provided, attempt to match the face
          if (typeof attemptMatchCallback === "function") {
            matchResult = await attemptMatchCallback(detection);
          }

          // Draw detection results with or without match information
          drawDetectionResults(detection, matchResult);

          return detection;
        } else {
          // No face detected, clear result message
          setResultMessage("");
          return null;
        }
      } catch (error) {
        console.error("Error during face detection:", error);
        setResultMessage("Error processing face");
        return null;
      }
    },
    [
      webcamRef,
      canvasRef,
      cameraEnabled,
      modelsLoading,
      isInitializing,
      resizeCanvas,
      drawDetectionResults,
    ]
  );

  // 5. Improved interval management
  useEffect(() => {
    if (cameraEnabled && !modelsLoading && !isInitializing) {
      // Initial detection
      detectFace();

      // Clear any existing interval before setting a new one
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
      }

      // Set new interval (500ms is good balance between performance and responsiveness)
      detectIntervalRef.current = setInterval(() => detectFace(), 500);
    } else {
      // Clean up interval when not needed
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
        detectIntervalRef.current = null;
      }
      setFaceDetected(false);
    }

    // Clean up on unmount
    return () => {
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
      }
    };
  }, [cameraEnabled, modelsLoading, isInitializing, detectFace]);

  // 6. Window resize handling
  useEffect(() => {
    // Debounced resize handler
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [resizeCanvas]);

  // 7. Enhanced captureFace with better error handling
  const captureFace = useCallback(async () => {
    const video = webcamRef.current?.video;

    if (!video || video.readyState !== 4) {
      setCaptureError("Webcam not ready");
      return null;
    }

    if (modelsLoading || isInitializing) {
      setCaptureError("Models still loading");
      return null;
    }

    try {
      setCaptureLoading(true);
      setCaptureError("");

      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (result) {
        setFaceDetected(true);
        return result;
      } else {
        setFaceDetected(false);
        setCaptureError("No face detected");
        return null;
      }
    } catch (err) {
      console.error("Face capture failed:", err);
      setCaptureError(`Capture failed: ${err.message}`);
      return null;
    } finally {
      setCaptureLoading(false);
    }
  }, [webcamRef, modelsLoading, isInitializing]);

  // 8. Improved canvas clearing with context saving/restoring
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [canvasRef]);

  // 9. Get current face descriptor
  const getCurrentFaceDescriptor = useCallback(async () => {
    const video = webcamRef.current?.video;

    if (!video || video.readyState !== 4) {
      return null;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection;
    } catch (error) {
      console.error("Error getting face descriptor:", error);
      return null;
    }
  }, [webcamRef]);

  return {
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
    faceapi,
    getCurrentFaceDescriptor,
    detectionResult,
    resultMessage,
    setResultMessage,
    drawDetectionResults, // New function for custom drawing logic
  };
};

export default useFaceApi;
