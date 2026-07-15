import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { 
  School, Calendar, List, Clock, Settings2, Target, Hash, 
  BarChart, Layers, Eye, ShieldAlert, Tag
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
import VerifiedTagInput from "@/components/components/VerifiedTagInput";

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
    <div className="space-y-6">
      {/* Test Details Card */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6">
          <div className="p-2 bg-pink-500/10 rounded-xl text-pink-600 dark:text-pink-400">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Mock Test Details</h3>
            <p className="text-[11px] text-slate-400 font-medium">Configure basic parameters and scoping rules for this paper</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Title */}
          <div className="space-y-2 lg:col-span-2">
            <Label className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Test Title</Label>
            <input
              {...register("title")}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-850 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 font-medium transition-all"
              placeholder="e.g. Weekly Assessment - Fitter 1st Year"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1 font-bold">{errors.title.message}</p>}
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 block">
              <BarChart className="w-3.5 h-3.5 text-purple-500" /> Difficulty Level
            </Label>
            <Controller
              name="difficultyLevel"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-full text-xs h-10 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl backdrop-blur-sm focus:ring-pink-500/30 text-slate-800 dark:text-white font-medium">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="mixed">Mixed (Default)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Trade */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 block">
              <School className="w-3.5 h-3.5 text-pink-500" /> Trade
            </Label>
            <Controller
              name="tradeId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={`w-full text-xs h-10 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl backdrop-blur-sm focus:ring-pink-500/30 text-slate-800 dark:text-white font-medium ${errors.tradeId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Trade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
                    {tradesList.map(trade => (
                      <SelectItem key={trade.$id} value={trade.$id}>{trade.tradeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tradeId && <p className="text-red-500 text-xs mt-1 font-bold">{errors.tradeId.message}</p>}
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 block">
              <Calendar className="w-3.5 h-3.5 text-amber-500" /> Training Year
            </Label>
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={!tradeId}>
                  <SelectTrigger className={`w-full text-xs h-10 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl backdrop-blur-sm focus:ring-pink-500/30 text-slate-800 dark:text-white font-medium ${errors.year ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
                    <SelectItem value="FIRST">First Year</SelectItem>
                    <SelectItem value="SECOND">Second Year</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.year && <p className="text-red-500 text-xs mt-1 font-bold">{errors.year.message}</p>}
          </div>

          {/* Subject (Conditional) */}
          {showSubjectSelection && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 block">
                <List className="w-3.5 h-3.5 text-emerald-500" /> Subject
              </Label>
              <Controller
                name="subjectId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={`w-full text-xs h-10 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl backdrop-blur-sm focus:ring-pink-500/30 text-slate-800 dark:text-white font-medium ${errors.subjectId ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
                      {subjects.map(sub => (
                        <SelectItem key={sub.$id} value={sub.$id}>{sub.subjectName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.subjectId && <p className="text-red-500 text-xs mt-1 font-bold">{errors.subjectId.message}</p>}
            </div>
          )}

          {/* Autocomplete verified tags */}
          <div className="space-y-2 lg:col-span-3 pt-2">
            <Label className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 block">
              <Tag className="w-3.5 h-3.5 text-blue-500" /> Tag Scopes (Select Verified Tags Only)
            </Label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <VerifiedTagInput 
                  value={field.value || []} 
                  onChange={field.onChange} 
                  placeholder="Type to search and select verified tags..."
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Modules (Conditional) */}
      {showModuleSelection && modules.length > 0 && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-sm animate-float-in">
           <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Choose Test Modules</h3>
              <p className="text-[11px] text-slate-400 font-medium">Select specific trade modules to populate test questions from</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto p-1 custom-scrollbar">
            <Controller
              name="selectedModules"
              control={control}
              render={({ field }) => (
                <>
                  {modules.map(module => {
                    const isChecked = field.value?.includes(module.$id);
                    return (
                      <div key={module.$id} className="flex items-center space-x-3 p-3 bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <input
                          type="checkbox"
                          id={`mod-${module.$id}`}
                          className="w-4 h-4 text-pink-500 bg-white/50 border-slate-300 dark:border-slate-700 focus:ring-pink-500/20 rounded cursor-pointer"
                          checked={isChecked}
                          onChange={(e) => {
                            const newValue = e.target.checked 
                              ? [...(field.value || []), module.$id]
                              : (field.value || []).filter(id => id !== module.$id);
                            field.onChange(newValue);
                          }}
                        />
                        <Label htmlFor={`mod-${module.$id}`} className="text-xs font-semibold text-slate-750 dark:text-slate-200 cursor-pointer select-none">
                          {module.moduleId} - {module.moduleName}
                        </Label>
                      </div>
                    )
                  })}
                </>
              )}
            />
          </div>
          {errors.selectedModules && <p className="text-red-500 text-xs mt-3 font-bold">{errors.selectedModules.message}</p>}
        </div>
      )}

      {/* Evaluation & Timing Card */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-450">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Evaluation Rules</h3>
            <p className="text-[11px] text-slate-400 font-medium">Fine-tune mock test marking rules, question weights, and limits</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 block">
              <Hash className="w-3.5 h-3.5 text-blue-500" /> Questions Count
            </Label>
            <input
              type="number"
              {...register("quesCount", { valueAsNumber: true })}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-850 dark:text-white font-medium ${errors.quesCount ? 'border-red-500' : ''}`}
            />
            {errors.quesCount && <p className="text-red-500 text-xs mt-1 font-bold">{errors.quesCount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 block">
              <Clock className="w-3.5 h-3.5 text-orange-500" /> Duration (Mins)
            </Label>
            <input
              type="number"
              {...register("totalMinutes", { valueAsNumber: true })}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-850 dark:text-white font-medium ${errors.totalMinutes ? 'border-red-500' : ''}`}
            />
            {errors.totalMinutes && <p className="text-red-500 text-xs mt-1 font-bold">{errors.totalMinutes.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider block">Total Marks</Label>
            <input
              type="number"
              {...register("totalMarks", { valueAsNumber: true })}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-850 dark:text-white font-medium ${errors.totalMarks ? 'border-red-500' : ''}`}
            />
            {errors.totalMarks && <p className="text-red-500 text-xs mt-1 font-bold">{errors.totalMarks.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider block">Passing Marks</Label>
            <input
              type="number"
              {...register("passingMarks", { valueAsNumber: true })}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-850 dark:text-white font-medium ${errors.passingMarks ? 'border-red-500' : ''}`}
            />
            {errors.passingMarks && <p className="text-red-500 text-xs mt-1 font-bold">{errors.passingMarks.message}</p>}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Toggles */}
          <div className="flex items-center justify-between p-5 border rounded-2xl border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-sm">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Negative Marking
              </Label>
              <p className="text-[11px] text-slate-400 font-medium">Deduct marks for incorrect answers</p>
            </div>
            <Controller
              name="negativeMarking"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex items-center justify-between p-5 border rounded-2xl border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-sm">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-green-500" />
                Publish Instantly
              </Label>
              <p className="text-[11px] text-slate-400 font-medium">Make test available immediately to students</p>
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
