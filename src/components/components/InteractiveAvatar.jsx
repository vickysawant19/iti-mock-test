/* eslint-disable react/prop-types */
import React, { useState, useRef, forwardRef } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Upload, Trash2, Loader2, Image as ImageIcon, Camera, RefreshCw, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import profileImageService from "@/services/auth/profileImageService";
import OnlineIndicator from "./OnlineIndicator";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { fixProfileImage } from "@/services/core/appwriteClient";

function getShortRelativeTime(lastseen) {
  if (!lastseen) return "";
  const diffMs = Date.now() - new Date(lastseen).getTime();
  if (isNaN(diffMs) || diffMs < 0) return "";
  
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "1m";
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;
  
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo`;
}

const InteractiveAvatar = forwardRef(({
  src,
  fallbackText = "U",
  userId,
  editable = false,
  onImageUpdate,
  className = "w-10 h-10", // Default sizing for nav, easily overridable
  showStatus = false,
  statusSize = "sm",
  userName = "",
  lastseen = null,
}, ref) => {
  const fixedSrc = (() => {
    const fixed = fixProfileImage(src);
    if (!fixed) return fixed;
    try {
      const url = new URL(fixed);
      url.searchParams.delete("width");
      url.searchParams.delete("height");
      return url.toString();
    } catch {
      return fixed;
    }
  })();
  const { getStatus } = useOnlineUsers();
  const isOnline = userId ? getStatus(userId) === "online" : false;
  const status = userId ? getStatus(userId) : "offline";
  const isActive = status === "online" || status === "away";
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [localLastSeen, setLocalLastSeen] = useState(lastseen);

  // Sync with prop updates
  React.useEffect(() => {
    setLocalLastSeen(lastseen);
  }, [lastseen]);

  // Track active state transition to offline
  const wasActiveRef = useRef(isActive);
  React.useEffect(() => {
    if (wasActiveRef.current && !isActive) {
      setLocalLastSeen(new Date().toISOString());
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Reset image error state when image source changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up camera on unmount or close
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Ensure stream is attached to video element when camera mode is activated
  React.useEffect(() => {
    if (isCameraMode && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraMode]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      stopCamera();
    }
  };

  const startCamera = async (mode = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode } 
      });
      streamRef.current = stream;
      setIsCameraMode(true);
      
      // Also try attaching immediately if ref exists
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraMode(false);
  };

  const switchCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
      stopCamera();
      await uploadFile(file);
    }, "image/jpeg", 0.9);
  };

  const uploadFile = async (file) => {
    if (!userId) {
      toast.error("User context missing.");
      return;
    }
    try {
      setIsUploading(true);
      const uploadedFile = await profileImageService.uploadProfilePicture(file, userId);
      await new Promise((res) => setTimeout(res, 500));
      const newUrl = profileImageService.getProfilePictureView(uploadedFile.$id);
      toast.success("Profile image updated successfully!");
      if (onImageUpdate) onImageUpdate(newUrl);
    } catch (error) {
      toast.error(error.message || "Failed to upload picture.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDeleteImage = async () => {
    if (!userId) return;
    try {
      setIsUploading(true);
      await profileImageService.deleteProfilePicture(userId);
      toast.success("Profile image removed");
      if (onImageUpdate) onImageUpdate("");
    } catch (error) {
      toast.error("Failed to delete image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div ref={ref}>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <div className={`relative cursor-pointer hover:opacity-80 transition-opacity rounded-full ring-2 ring-transparent outline-none hover:ring-blue-500/50 ${className}`}>
            <Avatar className="w-full h-full">
              {fixedSrc && !imageError ? (
                <img
                  src={fixedSrc}
                  className="w-full h-full object-cover rounded-full"
                  alt={userName || "User Avatar"}
                  onError={() => setImageError(true)}
                />
              ) : (
                <AvatarFallback>{fallbackText}</AvatarFallback>
              )}
            </Avatar>
            {showStatus && userId && (
              isActive ? (
                <OnlineIndicator
                  userId={userId}
                  size={statusSize}
                  className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-950"
                />
              ) : (
                localLastSeen && (
                  <span
                    className="absolute -bottom-1 -right-1 flex items-center justify-center px-1 py-0.5 rounded-full text-[7.5px] font-black leading-none bg-slate-800/90 text-slate-300 dark:bg-slate-900/90 border border-slate-700/60 shadow-md ring-2 ring-white dark:ring-slate-950 select-none pointer-events-none whitespace-nowrap"
                    title={`Last active: ${new Date(localLastSeen).toLocaleString()}`}
                  >
                    {getShortRelativeTime(localLastSeen)}
                  </span>
                )
              )
            )}
          </div>
        </DialogTrigger>
      
      <DialogContent
        showCloseButton={false}
        className={
          editable
            ? "border-0 overflow-hidden p-0 flex items-center justify-center sm:max-w-md w-full max-w-[90%] sm:w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl shadow-2xl rounded-[2rem]"
            : "fixed inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !border-0 !p-0 !m-0 bg-slate-950/40 dark:bg-black/40 backdrop-blur-2xl flex flex-col justify-between z-50 overflow-hidden shadow-none"
        }
      >
        <DialogTitle className="sr-only">{userName ? `${userName}'s Avatar` : "Profile Picture"}</DialogTitle>
        <DialogDescription className="sr-only">Full screen avatar preview</DialogDescription>

        {editable ? (
          <div className="relative flex flex-col items-center w-full px-6 py-10">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/20 dark:bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-900 group transition-all duration-500 w-48 h-48 sm:w-64 sm:h-64 ring-4 ring-white dark:ring-gray-800 ring-offset-4 ring-offset-gray-50 dark:ring-offset-gray-950 shadow-2xl">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-3 drop-shadow-md" />
                  <span className="text-sm font-semibold tracking-wide">Processing...</span>
                </div>
              ) : isCameraMode ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                  />
                  <div className="absolute inset-x-0 bottom-0 pb-6 flex justify-center gap-4 bg-gradient-to-t from-black/60 to-transparent">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full w-14 h-14 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/40 text-white shadow-xl transition-transform hover:scale-105"
                      onClick={capturePhoto}
                    >
                      <div className="w-10 h-10 rounded-full border-[3px] border-white flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white shadow-inner" />
                      </div>
                    </Button>
                  </div>
                  <div className="absolute top-4 inset-x-4 flex justify-between">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full shadow-lg"
                      onClick={switchCamera}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full shadow-lg"
                      onClick={stopCamera}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ) : fixedSrc ? (
                <img
                  src={fixedSrc}
                  alt="Profile Large"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                  <ImageIcon className="opacity-40 mb-3 w-20 h-20" />
                  <span className="font-black uppercase opacity-20 tracking-wider text-5xl">{fallbackText}</span>
                </div>
              )}
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 w-full mt-10">
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp, image/jpg"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <Button
                variant="secondary"
                className="gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 border-0 shadow-sm transition-all hover:shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isCameraMode}
              >
                <Upload className="w-4 h-4" />
                {fixedSrc ? "Change" : "Upload"}
              </Button>
              <Button
                variant="secondary"
                className="gap-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 border-0 shadow-sm transition-all hover:shadow-md"
                onClick={() => (isCameraMode ? capturePhoto() : startCamera())}
                disabled={isUploading}
              >
                <Camera className="w-4 h-4" />
                {isCameraMode ? "Capture" : "Take Photo"}
              </Button>
              {fixedSrc && (
                <Button
                  variant="destructive"
                  className="gap-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 border-0 shadow-sm transition-all hover:shadow-md"
                  onClick={handleDeleteImage}
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Full-Screen Immersive Lightbox Preview */
          <div 
            className="relative flex flex-col justify-between items-center w-full h-full select-none"
            onClick={() => handleOpenChange(false)}
          >
            {/* Ambient Blurred Avatar Reflection Backdrop */}
            {fixedSrc && !imageError && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <img
                  src={fixedSrc}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover blur-3xl opacity-25 dark:opacity-35 scale-125"
                />
                <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/40 backdrop-blur-xl" />
              </div>
            )}

            {/* Top Close Action */}
            <div className="w-full px-5 py-4 sm:px-8 sm:py-5 flex items-center justify-end z-20">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full w-10 h-10 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 shadow-lg transition-transform hover:scale-105"
                onClick={() => handleOpenChange(false)}
                title="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Whole Screen Centered Image Viewport */}
            <div 
              className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
              onClick={() => handleOpenChange(false)}
            >
              {fixedSrc && !imageError ? (
                <img
                  src={fixedSrc}
                  alt={userName || "Avatar Preview"}
                  className="max-w-[92vw] max-h-[70vh] sm:max-h-[76vh] w-auto h-auto object-contain rounded-2xl shadow-2xl drop-shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()} // Prevent clicking image itself from closing
                />
              ) : (
                <div 
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-3xl bg-slate-900/90 border border-white/10 flex flex-col items-center justify-center shadow-2xl text-slate-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ImageIcon className="w-16 h-16 opacity-30 mb-3 text-slate-500" />
                  <span className="font-black uppercase tracking-widest text-4xl sm:text-5xl text-white/50">{fallbackText}</span>
                </div>
              )}
            </div>

            {/* Student Name & Status Badge (Positioned as previously) */}
            <div 
              className="flex flex-col items-center gap-1.5 text-center z-20 pb-6 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm sm:text-base font-black text-white tracking-wider uppercase drop-shadow-md">
                {userName || "Live Member"}
              </h3>
              {userId && isOnline ? (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 backdrop-blur-md shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Member
                </div>
              ) : (
                localLastSeen && (
                  <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-800/80 border border-slate-700/60 text-slate-400 backdrop-blur-md shadow-md">
                    Last active {formatDistanceToNow(new Date(localLastSeen), { addSuffix: true })}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </div>
  );
});

InteractiveAvatar.displayName = "InteractiveAvatar";

export default InteractiveAvatar;
