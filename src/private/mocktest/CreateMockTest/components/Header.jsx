import React from "react";
import { BookOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ isSubmitting }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-700">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          Create Mock Test
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure and generate a new mock test for your students.
        </p>
      </div>
      
      <div className="mt-4 md:mt-0 flex gap-3 w-full md:w-auto">
        <Button 
          type="button" 
          variant="outline" 
          className="w-full md:w-auto"
        >
          Save Draft
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Creating..." : "Create Test"}
        </Button>
      </div>
    </div>
  );
}
