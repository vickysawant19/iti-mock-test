import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { Query } from "appwrite";

export default function TeacherStepProfessional({ initialData, onNext, onBack, isSaving }) {
  const { control, register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      collegeId: initialData?.collegeId || "",
      tradeId: initialData?.tradeId || "",
      specialization: Array.isArray(initialData?.specialization)
        ? initialData.specialization.join(", ")
        : (initialData?.specialization || ""),
    },
  });

  const selectedCollegeId = watch("collegeId");
  const { data: collegesResponse, isLoading: isCollegesLoading } = useListCollegesQuery();
  const collegeData = collegesResponse?.documents || [];

  const selectedCollege = collegeData.find(c => c.$id === selectedCollegeId);
  const tradeIds = selectedCollege?.tradeIds || [];

  const { data: tradesResponse, isLoading: isTradesLoading } = useListTradesQuery(
    [Query.equal("$id", tradeIds)],
    { skip: !tradeIds.length }
  );
  const tradeData = tradesResponse?.documents || [];

  const onSubmit = (data) => onNext(data);

  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:bg-white dark:sm:bg-slate-900 overflow-hidden mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">Professional Details</CardTitle>
        <CardDescription className="text-center">
          What institute do you teach at, and what is your primary trade?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="teacher-professional-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collegeId">Institute/College <span className="text-red-500">*</span></Label>
            <Controller
              name="collegeId"
              control={control}
              rules={{ required: "Institute/College is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className={errors.collegeId ? "border-red-500 focus-visible:ring-red-500" : ""}>
                    <SelectValue placeholder={isCollegesLoading ? "Loading Colleges..." : "Select Institute"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!isCollegesLoading && collegeData.map((college) => (
                      <SelectItem key={college.$id} value={college.$id}>{college.collageName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.collegeId && <p className="text-sm text-red-500">{errors.collegeId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tradeId">Primary Trade <span className="text-red-500">*</span></Label>
            <Controller
              name="tradeId"
              control={control}
              rules={{ required: "Primary Trade is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className={errors.tradeId ? "border-red-500 focus-visible:ring-red-500" : ""}>
                    <SelectValue placeholder={isTradesLoading ? "Loading Trades..." : "Select Primary Trade"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!isTradesLoading && tradeData.map((trade) => (
                      <SelectItem key={trade.$id} value={trade.$id}>{trade.tradeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tradeId && <p className="text-sm text-red-500">{errors.tradeId.message}</p>}
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="specialization">Other Specializations (Optional)</Label>
            <Input
              id="specialization"
              placeholder="e.g. Fitter, Welder"
              {...register("specialization")}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You can list multiple trades comma-separated if you teach more than one.
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
          Back
        </Button>
        <Button
          type="submit"
          form="teacher-professional-form"
          disabled={isSaving || isCollegesLoading || isTradesLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </CardFooter>
    </Card>
  );
}
