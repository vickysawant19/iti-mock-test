import { z } from "zod";

export const mockTestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  mode: z.enum(["subject", "module"]),

  // Base configuration
  tradeId: z.string().min(1, "Trade is required"),
  year: z.string().min(1, "Year is required"),

  // Configuration options
  quesCount: z.number().min(1, "Minimum 1 question required").max(100, "Maximum 100 questions allowed"),
  totalMinutes: z.number().min(5, "Minimum 5 minutes").max(300, "Maximum 300 minutes"),
  totalMarks: z.number().min(1, "Total marks required"),
  passingMarks: z.number().min(1, "Passing marks required"),
  difficultyLevel: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  negativeMarking: z.boolean().default(false),
  visibility: z.enum(["draft", "published"]).default("draft"),
  tags: z.array(z.string()).default([]),

  // Mode-specific fields
  subjectId: z.string().optional(),
  selectedModules: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
  if (data.passingMarks > data.totalMarks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passing marks cannot exceed total marks",
      path: ["passingMarks"],
    });
  }

  // Subject is required for both modes
  if (!data.subjectId || data.subjectId.trim() === "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Subject is required",
      path: ["subjectId"],
    });
  }

  // Module mode also requires at least one module selected
  if (data.mode === "module" && data.selectedModules.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select at least one module",
      path: ["selectedModules"],
    });
  }
});

