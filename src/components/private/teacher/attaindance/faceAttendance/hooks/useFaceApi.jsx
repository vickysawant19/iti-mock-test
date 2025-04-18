// src/hooks/useFaceApi.js
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
  const detectIntervalRef = useRef(null);

  // 1. Load models once
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        const nets = [
          faceapi.nets.tinyFaceDetector,
          faceapi.nets.faceLandmark68Net,
          faceapi.nets.faceRecognitionNet,
        ];
        for (let i = 0; i < nets.length; i++) {
          await nets[i].loadFromUri(MODEL_URL);
          setModelLoadingProgress(Math.round(((i + 1) / nets.length) * 100));
        }
        setModelsLoading(false);
        // small pause so UI has time to render video
        setTimeout(() => setIsInitializing(false), 500);
      } catch (err) {
        setModelError(err);
        setModelsLoading(false);
        setIsInitializing(false);
      }
    };
    loadModels();
  }, []);

  // 2. Resize canvas buffer to exactly match its CSS/display size
  const resizeCanvas = useCallback(() => {
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    // get the on-screen display size of the video container
    const { width, height } = video.getBoundingClientRect();

    // set the drawing buffer to the same dimensions
    canvas.width = width;
    canvas.height = height;

    // ensure CSS size matches too
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    return { width, height };
  }, [webcamRef, canvasRef]);

  // 3. Core detection routine
  const detectFace = useCallback(async () => {
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
      return;
    }

    // 3a. Make sure canvas buffer matches display
    const dims = resizeCanvas();
    if (!dims) return;

    // 3b. Tell faceapi about this mapping
    faceapi.matchDimensions(canvas, dims);

    // 3c. Run detection + landmarks
    const result = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    setFaceDetected(!!result);

    // 3d. Draw results
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (result) {
      const resized = faceapi.resizeResults(result, dims);
      faceapi.draw.drawDetections(canvas, resized);
      // faceapi.draw.drawFaceLandmarks(canvas, resized);
    }
  }, [
    webcamRef,
    canvasRef,
    cameraEnabled,
    modelsLoading,
    isInitializing,
    resizeCanvas,
  ]);

  // 4. Start/stop the interval based on cameraEnabled
  useEffect(() => {
    if (cameraEnabled && !modelsLoading && !isInitializing) {
      detectFace();
      detectIntervalRef.current = setInterval(detectFace, 500);
    } else {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
      setFaceDetected(false);
    }
    return () => clearInterval(detectIntervalRef.current);
  }, [cameraEnabled, modelsLoading, isInitializing, detectFace]);

  // 5. Keep canvas in sync on window resize
  useEffect(() => {
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // 6. captureFace remains unchanged
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
      setCaptureError(`Capture failed: ${err.message}`);
      return null;
    } finally {
      setCaptureLoading(false);
    }
  }, [webcamRef, modelsLoading, isInitializing]);

  // 7. clearCanvas helper
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef]);

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
    faceapi,
  };
};

export default useFaceApi;
