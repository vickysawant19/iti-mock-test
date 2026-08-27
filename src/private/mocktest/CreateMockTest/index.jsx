import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mockTestSchema } from "./schema";
import { useCreateMockTest } from "./hooks/useCreateMockTest";

import { Header } from "./components/Header";
import { ModeSelector } from "./components/ModeSelector";
import { ConfigurationSection } from "./components/ConfigurationSection";

export default function CreateMockTestPage() {
  const { 
    isLoading, 
    subjects, 
    modules, 
    tradesList, 
    fetchModules, 
    submitMockTest 
  } = useCreateMockTest();

  const methods = useForm({
    resolver: zodResolver(mockTestSchema),
    defaultValues: {
      title: "",
      description: "",
      mode: "subject",
      tradeId: "",
      year: "",
      subjectId: "",
      quesCount: 20,
      totalMinutes: 30,
      totalMarks: 40,
      passingMarks: 16,
      difficultyLevel: "mixed",
      negativeMarking: false,
      visibility: "draft",
      tags: [],
      selectedModules: [],
    }
  });

  const onSubmit = async (data) => {
    // Optional: add pre-submit checks or data transformation here
    await submitMockTest(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-0 m-0 flex flex-col">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col flex-1">
          {/* Edge-to-Edge Gradient Header */}
          <Header isSubmitting={isLoading} />

          {/* Form Container */}
          <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6 flex-1">
            <ModeSelector />

            <ConfigurationSection 
              tradesList={tradesList} 
              subjects={subjects} 
              modules={modules} 
              fetchModules={fetchModules} 
            />
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
