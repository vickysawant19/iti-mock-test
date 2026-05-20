import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { 
  School, Calendar, List, Clock, Settings2, Target, Hash, 
  BarChart, Layers, Eye, ShieldAlert, X, Tag
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const TagInput = ({ value = [], onChange, placeholder = "Type and press Enter..." }) => {
  const [input, setInput] = React.useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = input.trim();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded text-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:text-blue-900 dark:hover:text-blue-100"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-900 dark:text-white text-sm"
        placeholder={value.length === 0 ? placeholder : ""}
      />
    </div>
  );
};

export function ConfigurationSection({ tradesList, subjects, modules, fetchModules }) {
  const { register, control, watch, formState: { errors } } = useFormContext();
  const currentMode = watch("mode");
  const tradeId = watch("tradeId");
  const subjectId = watch("subjectId");
  const year = watch("year");

  // Fetch modules when dependencies change
  React.useEffect(() => {
    if (tradeId && subjectId && year) {
      fetchModules(tradeId, subjectId, year);
    }
  }, [tradeId, subjectId, year, fetchModules]);

  // Subject shown for both modes; modules only for "module" mode
  const showSubjectSelection = true;
  const showModuleSelection = currentMode === "module";

  return (
    <div className="space-y-8">
      {/* Basic Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <Settings2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Test Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Title */}
          <div className="space-y-2 lg:col-span-2">
            <Label className="text-gray-900 dark:text-gray-100">Test Title</Label>
            <input
              {...register("title")}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g. Weekly Assessment - Fitter 1st Year"
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>

          {/* Tags */}
          <div className="space-y-2 lg:col-span-3">
            <Label className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Tags
            </Label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart className="w-4 h-4" /> Difficulty
            </Label>
            <Controller
              name="difficultyLevel"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-700">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Trade */}
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <School className="w-4 h-4" /> Trade
            </Label>
            <Controller
              name="tradeId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={`w-full bg-white dark:bg-gray-700 ${errors.tradeId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Trade" />
                  </SelectTrigger>
                  <SelectContent>
                    {tradesList.map(trade => (
                      <SelectItem key={trade.$id} value={trade.$id}>{trade.tradeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tradeId && <p className="text-red-500 text-sm">{errors.tradeId.message}</p>}
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Year
            </Label>
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={!tradeId}>
                  <SelectTrigger className={`w-full bg-white dark:bg-gray-700 ${errors.year ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST">First Year</SelectItem>
                    <SelectItem value="SECOND">Second Year</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.year && <p className="text-red-500 text-sm">{errors.year.message}</p>}
          </div>

          {/* Subject (Conditional) */}
          {showSubjectSelection && (
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <List className="w-4 h-4" /> Subject
              </Label>
              <Controller
                name="subjectId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={`w-full bg-white dark:bg-gray-700 ${errors.subjectId ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(sub => (
                        <SelectItem key={sub.$id} value={sub.$id}>{sub.subjectName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.subjectId && <p className="text-red-500 text-sm">{errors.subjectId.message}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Modules (Conditional) */}
      {showModuleSelection && modules.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
           <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Modules</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto p-1">
            <Controller
              name="selectedModules"
              control={control}
              render={({ field }) => (
                <>
                  {modules.map(module => {
                    const isChecked = field.value?.includes(module.$id);
                    return (
                      <div key={module.$id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                        <input
                          type="checkbox"
                          id={`mod-${module.$id}`}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={isChecked}
                          onChange={(e) => {
                            const newValue = e.target.checked 
                              ? [...(field.value || []), module.$id]
                              : (field.value || []).filter(id => id !== module.$id);
                            field.onChange(newValue);
                          }}
                        />
                        <Label htmlFor={`mod-${module.$id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                          {module.moduleId} - {module.moduleName}
                        </Label>
                      </div>
                    )
                  })}
                </>
              )}
            />
          </div>
          {errors.selectedModules && <p className="text-red-500 text-sm mt-2">{errors.selectedModules.message}</p>}
        </div>
      )}

      {/* Evaluation & Timing */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Evaluation Rules</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Hash className="w-4 h-4" /> Questions Count
            </Label>
            <input
              type="number"
              {...register("quesCount", { valueAsNumber: true })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.quesCount ? 'border-red-500' : ''}`}
            />
            {errors.quesCount && <p className="text-red-500 text-sm">{errors.quesCount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Duration (Mins)
            </Label>
            <input
              type="number"
              {...register("totalMinutes", { valueAsNumber: true })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.totalMinutes ? 'border-red-500' : ''}`}
            />
            {errors.totalMinutes && <p className="text-red-500 text-sm">{errors.totalMinutes.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Total Marks</Label>
            <input
              type="number"
              {...register("totalMarks", { valueAsNumber: true })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.totalMarks ? 'border-red-500' : ''}`}
            />
            {errors.totalMarks && <p className="text-red-500 text-sm">{errors.totalMarks.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Passing Marks</Label>
            <input
              type="number"
              {...register("passingMarks", { valueAsNumber: true })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.passingMarks ? 'border-red-500' : ''}`}
            />
            {errors.passingMarks && <p className="text-red-500 text-sm">{errors.passingMarks.message}</p>}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Toggles */}
          <div className="flex items-center justify-between p-4 border rounded-xl dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="space-y-0.5">
              <Label className="text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Negative Marking
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Deduct marks for wrong answers</p>
            </div>
            <Controller
              name="negativeMarking"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-xl dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="space-y-0.5">
              <Label className="text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-500" />
                Visibility
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Publish immediately after creation</p>
            </div>
            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <Switch 
                  checked={field.value === "published"} 
                  onCheckedChange={(checked) => field.onChange(checked ? "published" : "draft")} 
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
