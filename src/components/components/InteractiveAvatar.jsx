import React, { useState, useRef, forwardRef } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Upload, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
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
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userId) {
      toast.error("User context missing.");
      return;
    }

    try {
      setIsUploading(true);
      const uploadedFile = await profileImageService.uploadProfilePicture(file, userId);
      // Wait to ensure Appwrite recognizes new view
      await new Promise((res) => setTimeout(res, 500));
      const newUrl = profileImageService.getProfilePictureView(uploadedFile.$id);
      
      toast.success("Profile image updated successfully!");
      if (onImageUpdate) onImageUpdate(newUrl);
    } catch (error) {
      toast.error(error.message || "Failed to upload picture.");
    } finally {
      setIsUploading(false);
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
               disabled={isUploading}
            >
              <Upload className="w-4 h-4" />
              Change
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
