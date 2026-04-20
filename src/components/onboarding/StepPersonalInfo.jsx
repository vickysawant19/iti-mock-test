import React, { useState } from "react";
import { useForm } from "react-hook-form";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
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
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      profileImage: initialData?.profileImage || "",
      DOB: initialData?.DOB || "",
      address: initialData?.address || "",
    },
  });

  const currentImageUrl = watch("profileImage");

  const handleImageUpdate = (newUrl) => {
    setValue("profileImage", newUrl, { shouldDirty: true, shouldValidate: true });
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
            <div className="flex justify-center py-2">
              <InteractiveAvatar 
                 src={currentImageUrl}
                 fallbackText="U"
                 userId={userId}
                 editable={true}
                 onImageUpdate={handleImageUpdate}
                 className="w-24 h-24 sm:w-28 sm:h-28"
              />
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
