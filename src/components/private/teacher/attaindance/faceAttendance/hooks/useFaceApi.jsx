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

  // Add refs to track animation frame and smooth drawing
  const animationFrameRef = useRef(null);
  const lastMatchResultRef = useRef(null);

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

  // 8. Improved canvas clearing
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Reset match result reference
      lastMatchResultRef.current = null;
    }
  }, [canvasRef]);

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

  // 3. Anti-flickering draw function with double buffering technique
  const drawDetectionResults = useCallback(
    (detection, matchResult = null) => {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Store the current match result for comparison
      const currentMatchResult = matchResult ? { ...matchResult } : null;

      // Use requestAnimationFrame for smoother rendering
      animationFrameRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        const video = webcamRef.current?.video;

        if (!canvas || !video) return;

        // Get canvas context
        const ctx = canvas.getContext("2d");

        // First check if we have something to draw
        if (!detection) {
          // If no detection, clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setResultMessage("");
          lastMatchResultRef.current = null;
          return;
        }

        // Make sure canvas dimensions match the video
        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight,
        };

        // Set canvas dimensions if they don't match
        if (
          canvas.width !== displaySize.width ||
          canvas.height !== displaySize.height
        ) {
          canvas.width = displaySize.width;
          canvas.height = displaySize.height;
          faceapi.matchDimensions(canvas, displaySize);
        }

        // Double buffering technique to reduce flickering
        // Create an off-screen canvas for drawing
        const offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = canvas.width;
        offScreenCanvas.height = canvas.height;
        const offCtx = offScreenCanvas.getContext("2d");

        // Resize detection results to match display size
        const resizedDetection = faceapi.resizeResults(detection, displaySize);

        // Clear the off-screen canvas first
        offCtx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);

        // Draw on off-screen canvas
        // Draw standard faceapi detection box
        faceapi.draw.drawDetections(offScreenCanvas, [resizedDetection]);

        // Draw additional info if we have match results
        if (matchResult) {
          const { x, y, width, height } = resizedDetection.detection.box;
          const isMatched = matchResult.name !== "Unknown";

          // Draw colored box based on match status
          offCtx.lineWidth = 2;
          offCtx.strokeStyle = isMatched ? "#10B981" : "#EF4444"; // green for match, red for unknown
          offCtx.strokeRect(x, y, width, height);

          // Calculate info box position (above face)
          const boxY = Math.max(y - 50, 10);
          const boxHeight = 40;

          // Draw semi-transparent background for text
          offCtx.fillStyle = isMatched
            ? "rgba(16, 185, 129, 0.8)" // green with opacity
            : "rgba(239, 68, 68, 0.8)"; // red with opacity
          offCtx.fillRect(x, boxY, width, boxHeight);

          // Draw text
          offCtx.font = "bold 14px sans-serif";
          offCtx.fillStyle = "#FFFFFF";
          offCtx.fillText(matchResult.name, x + 5, boxY + 25);

          // Set result message only if it changed
          const prevName = lastMatchResultRef.current?.name;
          const currentName = matchResult.name;

          if (isMatched) {
            const confidenceScore = Math.round(
              (1 - matchResult.distance) * 100
            );

            // Only update the message if the name or confidence changed significantly
            if (
              prevName !== currentName ||
              !lastMatchResultRef.current?.distance ||
              Math.abs(
                (1 - lastMatchResultRef.current.distance) * 100 -
                  confidenceScore
              ) > 3
            ) {
              setResultMessage(
                `Matched: ${matchResult.name} (${confidenceScore}% confidence)`
              );
            }
          } else if (prevName !== currentName) {
            setResultMessage("Unknown face detected");
          }
        } else if (detection) {
          setResultMessage("Processing face...");
        }

        // Now copy the off-screen canvas to the visible canvas (reduces flickering)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offScreenCanvas, 0, 0);

        // Save current match result for next comparison
        lastMatchResultRef.current = currentMatchResult;
      });
    },
    [canvasRef, webcamRef]
  );

  // 4. Optimized face detection with improved performance
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
        drawDetectionResults(null); // Ensure canvas is cleared
        return null;
      }

      // Throttle detections (don't run if less than 200ms since last detection)
      const now = Date.now();
      if (lastDetectionRef.current && now - lastDetectionRef.current < 200) {
        return detectionResult;
      }

      lastDetectionRef.current = now;

      try {
        // Configure faceapi with dimensions
        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight,
        };

        // Ensure canvas dimensions match video
        if (
          canvas.width !== displaySize.width ||
          canvas.height !== displaySize.height
        ) {
          canvas.width = displaySize.width;
          canvas.height = displaySize.height;
          faceapi.matchDimensions(canvas, displaySize);
        }

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

        let matchResult = null;

        // If a match callback is provided, attempt to match the face
        if (typeof attemptMatchCallback === "function" && detection) {
          matchResult = await attemptMatchCallback(detection);
        }

        // Always draw detection results, even if no match
        drawDetectionResults(detection, matchResult);

        return detection;
      } catch (error) {
        console.error("Error during face detection:", error);
        setResultMessage("Error processing face");
        drawDetectionResults(null); // Clear canvas on error
        return null;
      }
    },
    [
      webcamRef,
      canvasRef,
      cameraEnabled,
      modelsLoading,
      isInitializing,
      drawDetectionResults,
      detectionResult,
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
      drawDetectionResults(null); // Ensure canvas is cleared when disabled
    }

    // Clean up on unmount
    return () => {
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    cameraEnabled,
    modelsLoading,
    isInitializing,
    detectFace,
    drawDetectionResults,
  ]);

  // 6. Window resize handling
  useEffect(() => {
    // Debounced resize handler
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const dimensions = resizeCanvas();
        // Force redraw after resize
        if (dimensions && detectionResult) {
          drawDetectionResults(detectionResult, lastMatchResultRef.current);
        }
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [resizeCanvas, drawDetectionResults, detectionResult]);

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
    drawDetectionResults,
  };
};

export default useFaceApi;
