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
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8 pt-20">
      <div className="max-w-5xl mx-auto space-y-8">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
            <Header isSubmitting={isLoading} />
            
            <ModeSelector />

            <ConfigurationSection 
              tradesList={tradesList} 
              subjects={subjects} 
              modules={modules} 
              fetchModules={fetchModules} 
            />

          </form>
        </FormProvider>
      </div>
    </div>
  );
}
