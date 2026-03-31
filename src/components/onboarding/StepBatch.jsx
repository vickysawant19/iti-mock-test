import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Query } from "appwrite";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import batchService from "@/appwrite/batchService";

export default function StepBatch({ initialData, onNext, isSaving, onSkip }) {
  const [batchesData, setBatchesData] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      batchId: initialData?.batchId || "",
    },
  });

  useEffect(() => {
    const fetchBatchData = async () => {
      if (initialData?.tradeId && initialData?.collegeId) {
        setIsLoadingBatches(true);
        try {
          const queryFilters = [
            Query.select(["$id", "BatchName"]),
            Query.equal("collegeId", initialData.collegeId),
            Query.equal("tradeId", initialData.tradeId),
            Query.equal("isActive", true),
          ];
          const response = await batchService.listBatches(queryFilters);
          setBatchesData(response.documents || []);
        } catch (error) {
          console.error("Error fetching batches:", error);
        } finally {
          setIsLoadingBatches(false);
        }
      }
    };
    fetchBatchData();
  }, [initialData?.tradeId, initialData?.collegeId]);

  const onSubmit = (data) => {
    onNext(data);
  };

  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:bg-white dark:sm:bg-slate-900 overflow-hidden mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">Batch Information</CardTitle>
        <CardDescription className="text-center">
          Which batch are you enrolled in?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="step-batch-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchId">Batch <span className="text-red-500">*</span></Label>
            <Controller
              name="batchId"
              control={control}
              rules={{ required: "Batch is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingBatches || batchesData.length === 0}>
                  <SelectTrigger className={errors.batchId ? "border-red-500 focus-visible:ring-red-500" : ""}>
                    <SelectValue placeholder={
                      isLoadingBatches ? "Loading Batches..." : 
                      batchesData.length === 0 ? "No active batches found" : "Select Batch"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {!isLoadingBatches && batchesData.map((batch) => (
                      <SelectItem key={batch.$id} value={batch.$id}>
                        {batch.BatchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.batchId && <p className="text-sm text-red-500">{errors.batchId.message}</p>}
            {batchesData.length === 0 && !isLoadingBatches && (
               <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 text-center">
                 No batches found for your selected College and Trade. You can skip this step.
               </p>
            )}
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
          Skip for now
        </Button>
        <Button 
          type="submit" 
          form="step-batch-form" 
          disabled={isSaving || batchesData.length === 0} 
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </CardFooter>
    </Card>
  );
}
