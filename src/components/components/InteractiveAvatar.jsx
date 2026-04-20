import React, { useState, useRef, forwardRef } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Upload, Trash2, Loader2, Image as ImageIcon, Camera, RefreshCw, X } from "lucide-react";
import profileImageService from "@/appwrite/profileImageService";

const InteractiveAvatar = forwardRef(({
  src,
  fallbackText = "U",
  userId,
  editable = false,
  onImageUpdate,
  className = "w-10 h-10" // Default sizing for nav, easily overridable
}, ref) => {
  const [isUploading, setIsUploading] = useState(false);
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
          <div className={`cursor-pointer hover:opacity-80 transition-opacity rounded-full ring-2 ring-transparent outline-none hover:ring-blue-500/50 ${className}`}>
            <Avatar className="w-full h-full">
              <AvatarImage src={src} className="object-cover" />
              <AvatarFallback>{fallbackText}</AvatarFallback>
            </Avatar>
          </div>
        </DialogTrigger>
      
      <DialogContent className="sm:max-w-md w-11/12 max-h-[90vh] flex flex-col items-center gap-6 pt-10">
        <DialogTitle className="sr-only">Profile Picture</DialogTitle>
        <DialogDescription className="sr-only">View or edit profile picture</DialogDescription>
        
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 group">
          {isUploading ? (
             <div className="flex flex-col items-center justify-center text-blue-500">
               <Loader2 className="w-8 h-8 animate-spin mb-2" />
               <span className="text-xs font-medium">Processing...</span>
             </div>
          ) : isCameraMode ? (
            <div className="relative w-full h-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              <div className="absolute inset-0 flex items-end justify-center pb-4 gap-2">
                <Button 
                   size="icon" 
                   variant="secondary" 
                   className="rounded-full w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md border-white/30 text-white" 
                   onClick={capturePhoto}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-white" />
                  </div>
                </Button>
              </div>
              <Button 
                 size="icon" 
                 variant="ghost" 
                 className="absolute top-2 right-2 text-white bg-black/20 hover:bg-black/40 rounded-full" 
                 onClick={stopCamera}
              >
                <X className="w-5 h-5" />
              </Button>
              <Button 
                 size="icon" 
                 variant="ghost" 
                 className="absolute top-2 left-2 text-white bg-black/20 hover:bg-black/40 rounded-full" 
                 onClick={switchCamera}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          ) : src ? (
            <img src={src} alt="Profile Large" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
               <ImageIcon className="w-16 h-16 opacity-30 mb-2" />
               <span className="text-4xl font-bold uppercase opacity-30">{fallbackText}</span>
            </div>
          )}
        </div>

        {editable && (
          <div className="flex items-center gap-3 w-full justify-center border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
            <input 
               type="file" 
               accept="image/jpeg, image/png, image/webp, image/jpg" 
               className="hidden" 
               ref={fileInputRef}
               onChange={handleImageUpload}
               disabled={isUploading}
            />
            <Button 
               variant="outline" 
               className="gap-2" 
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading || isCameraMode}
            >
              <Upload className="w-4 h-4" />
              {src ? "Change" : "Upload"}
            </Button>
            <Button 
               variant="outline" 
               className="gap-2" 
               onClick={() => isCameraMode ? capturePhoto() : startCamera()}
               disabled={isUploading}
            >
              <Camera className="w-4 h-4" />
              {isCameraMode ? "Capture" : "Take Photo"}
            </Button>
            {src && (
              <Button 
                 variant="destructive" 
                 className="gap-2" 
                 onClick={handleDeleteImage}
                 disabled={isUploading}
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </div>
  );
});

export default InteractiveAvatar;
