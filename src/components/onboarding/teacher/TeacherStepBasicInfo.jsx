import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherStepBasicInfo({ initialData, onNext, isSaving }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    values: {
      userName: initialData?.userName || "",
      phone: initialData?.phone || "",
    },
  });

  const onSubmit = (data) => {
    onNext(data);
  };

  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:bg-white dark:sm:bg-slate-900 overflow-hidden mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">Basic Information</CardTitle>
        <CardDescription className="text-center">
          Let's start with the basics. Please provide your name and phone number.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="teacher-basic-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-muted-foreground text-xs font-normal">(Auto-filled)</span></Label>
            <Input
              id="email"
              type="email"
              readOnly
              disabled
              value={initialData?.email || ""}
              className="bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="userName"
              placeholder="Instructor Name"
              {...register("userName", { required: "Name is required" })}
              className={errors.userName ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.userName && <p className="text-sm text-red-500">{errors.userName.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^\+?[0-9]{6,15}$/,
                  message: "Invalid phone number",
                },
              })}
              className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4 dark:border-slate-800">
        <Button 
          type="submit" 
          form="teacher-basic-form" 
          disabled={isSaving} 
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </CardFooter>
    </Card>
  );
}
