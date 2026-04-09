import React, { useState } from "react";
import { useForm } from "react-hook-form";
import profileImageService from "@/appwrite/profileImageService";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays, MapPin, Upload, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";

export default function StepPersonalInfo({ initialData, onNext, onBack, isSaving, userId }) {
  const [isUploading, setIsUploading] = useState(false);
  // Use defaultValues for the initial state. 
  // Do NOT use a useEffect to reset/sync values from parent, 
  // as it will wipe the user's current typed input on re-render.
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      DOB: initialData?.DOB ? initialData.DOB.split("T")[0] : "",
      address: initialData?.address || "",
      profileImage: initialData?.profileImage || "",
    },
  });

  const currentImageUrl = watch("profileImage");

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userId) {
      toast.error("User context missing.");
      return;
    }

    try {
      setIsUploading(true);
      await profileImageService.uploadProfilePicture(file, userId);
      // Wait to ensure Appwrite recognizes new view
      await new Promise((res) => setTimeout(res, 500));
      const newUrl = profileImageService.getProfilePictureView(userId);
      setValue("profileImage", newUrl, { shouldDirty: true, shouldValidate: true });
      toast.success("Profile image uploaded limit.");
    } catch (error) {
      toast.error(error.message || "Failed to upload picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!userId) return;
    try {
      setIsUploading(true);
      await profileImageService.deleteProfilePicture(userId);
      setValue("profileImage", "", { shouldDirty: true, shouldValidate: true });
      toast.success("Profile image removed");
    } catch (error) {
      toast.error("Failed to delete image.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data) => {
    console.log("[StepPersonalInfo] Submitting data:", data);
    onNext(data);
  };

  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:bg-white dark:sm:bg-slate-900 overflow-hidden mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Personal Details
        </CardTitle>
        <CardDescription className="text-center">
          Help us personalise your experience with a few more details.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="step-personal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-slate-500" />
              Profile Picture <span className="text-slate-400 font-normal ml-1">(Optional)</span>
            </Label>
            <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors h-[120px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
              {isUploading ? (
                 <div className="flex flex-col items-center justify-center gap-2 text-blue-500">
                   <Loader2 className="w-6 h-6 animate-spin" />
                   <span className="text-xs font-semibold">Processing...</span>
                 </div>
              ) : currentImageUrl ? (
                 <div className="relative w-full h-full flex items-center justify-center">
                   <img src={currentImageUrl} alt="Profile" className="w-auto h-full object-cover max-w-full rounded-md shadow-sm" />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white rounded-md">
                     <div className="flex flex-col items-center cursor-pointer relative overflow-hidden py-2 px-3 rounded-lg hover:bg-white/20 transition-colors">
                       <Upload className="w-5 h-5 mb-1" />
                       <span className="text-[10px] uppercase font-bold tracking-wider">Change</span>
                       <input
                          type="file"
                          accept="image/jpeg, image/png, image/webp, image/jpg"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={isUploading}
                       />
                     </div>
                     <div 
                        className="flex flex-col items-center cursor-pointer py-2 px-3 rounded-lg hover:bg-red-500/80 transition-colors"
                        onClick={handleDeleteImage}
                     >
                        <Trash2 className="w-5 h-5 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Remove</span>
                     </div>
                   </div>
                 </div>
              ) : (
                 <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 w-full h-full relative cursor-pointer hover:text-blue-500 transition-colors">
                   <Upload className="w-8 h-8 mb-2 opacity-50" />
                   <span className="text-xs font-medium px-4 text-center">Click or drop to upload avatar</span>
                   <input
                     type="file"
                     accept="image/jpeg, image/png, image/webp, image/jpg"
                     onChange={handleImageUpload}
                     className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                     disabled={isUploading}
                   />
                 </div>
              )}
            </div>
            {/* hidden field to track in form hook */}
            <input type="hidden" {...register("profileImage")} />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="DOB" className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <Input
              id="DOB"
              type="date"
              {...register("DOB", { required: "Date of birth is required" })}
              className={errors.DOB ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.DOB && <p className="text-sm text-red-500">{errors.DOB.message}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="address"
              placeholder="123 Main St, City, State"
              rows={3}
              {...register("address", { required: "Address is required" })}
              className={errors.address ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
          Back
        </Button>
        <Button
          type="submit"
          form="step-personal-form"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </CardFooter>
    </Card>
  );
}
