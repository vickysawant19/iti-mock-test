import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle2 } from "lucide-react";

// In a real implementation, we would extract these to separate files:
function FilterBar({ onSearch, onFilterChange }) {
  return (
    <div className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input 
          placeholder="Search questions..." 
          className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {/* Additional filters would go here */}
    </div>
  );
}

function QuestionList({ questions, selectedIds, onToggleSelect }) {
  if (!questions.length) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        No questions found. Try adjusting filters.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {questions.map((q) => {
        const isSelected = selectedIds.includes(q.$id);
        return (
          <div 
            key={q.$id} 
            className={`p-4 border rounded-xl cursor-pointer transition-colors ${
              isSelected 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
            }`}
            onClick={() => onToggleSelect(q.$id)}
          >
            <div className="flex gap-3">
              <div className="mt-1">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-gray-300 dark:border-gray-600"
                }`}>
                  {isSelected && <CheckCircle2 className="w-3 h-3" />}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {q.questionText}
                </p>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300">
                    {q.difficulty || "Medium"}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                    {q.moduleName || "General"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function QuestionManager() {
  const { watch, setValue } = useFormContext();
  const selectedQuestions = watch("selectedQuestions") || [];
  const currentMode = watch("mode");

  // Dummy state for demonstration. 
  // In production, fetch via React Query or Appwrite SDK in a useEffect based on search/filters.
  const [questions, setQuestions] = useState([
    { $id: "q1", questionText: "What is the primary function of a micrometer?", difficulty: "Medium", moduleName: "Measurements" },
    { $id: "q2", questionText: "Identify the safety sign shown in figure 1.", difficulty: "Easy", moduleName: "Safety" },
    { $id: "q3", questionText: "Calculate the cutting speed if diameter is 50mm and RPM is 200.", difficulty: "Hard", moduleName: "Calculations" },
  ]);

  if (currentMode !== "manual") return null;

  const handleToggleSelect = (id) => {
    const isSelected = selectedQuestions.includes(id);
    if (isSelected) {
      setValue("selectedQuestions", selectedQuestions.filter(qId => qId !== id));
    } else {
      setValue("selectedQuestions", [...selectedQuestions, id]);
    }
  };

  const selectedQObjects = questions.filter(q => selectedQuestions.includes(q.$id));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manual Question Selection</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Search and handpick questions for this test.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedQuestions.length}</p>
          <p className="text-xs text-gray-500">Selected</p>
        </div>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-4 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="search">Search Questions</TabsTrigger>
          <TabsTrigger value="selected">Selected ({selectedQuestions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="search">
          <FilterBar onSearch={() => {}} onFilterChange={() => {}} />
          <QuestionList 
            questions={questions} 
            selectedIds={selectedQuestions} 
            onToggleSelect={handleToggleSelect} 
          />
        </TabsContent>
        <TabsContent value="selected">
          <QuestionList 
            questions={selectedQObjects} 
            selectedIds={selectedQuestions} 
            onToggleSelect={handleToggleSelect} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
