import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherStepScope({ initialData, onNext, onSkip, isSaving }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      experience: initialData?.experience || "",
    },
  });

  const onSubmit = (data) => {
    onNext(data);
  };

  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:bg-white dark:sm:bg-slate-900 overflow-hidden mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">Teaching Scope</CardTitle>
        <CardDescription className="text-center">
          Optionally, provide your experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="teacher-scope-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience (Optional)</Label>
            <Input
              id="experience"
              type="number"
              placeholder="e.g. 5"
              {...register("experience")}
            />
          </div>
          
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 dark:border-slate-800">
        <Button 
          type="button" 
          variant="outline"
          onClick={onSkip}
          disabled={isSaving} 
        >
          Skip
        </Button>
        <Button 
          type="submit" 
          form="teacher-scope-form" 
          disabled={isSaving} 
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </CardFooter>
    </Card>
  );
}
