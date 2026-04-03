import React from "react";
import { useForm } from "react-hook-form";
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
import { CalendarDays, MapPin } from "lucide-react";

export default function StepPersonalInfo({ initialData, onNext, onBack, isSaving }) {
  // Use defaultValues for the initial state. 
  // Do NOT use a useEffect to reset/sync values from parent, 
  // as it will wipe the user's current typed input on re-render.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      DOB: initialData?.DOB ? initialData.DOB.split("T")[0] : "",
      address: initialData?.address || "",
    },
  });

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
        <form id="step-personal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
