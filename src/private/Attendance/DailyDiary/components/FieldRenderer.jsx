import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PracticalNumberInput } from "../PracticalNumberInput";

export const FieldRenderer = React.memo(({
  isTeacher,
  isEditing,
  dateKey,
  field,
  label,
  value,
  updateDiaryField,
  toggleEditing,
  type,
}) => {
  const commonProps = {
    value: value || "",
    onChange: (e) => updateDiaryField && updateDiaryField(dateKey, field, e.target.value),
  };

  const readOnlyView =
    type === "numberArray" ? (
      value && Array.isArray(value) && value.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {value.map((num, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md"
            >
              #{num}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-gray-400 italic text-xs font-normal">—</span>
      )
    ) : (
      <span className="text-slate-800 dark:text-slate-200 font-medium text-xs">
        {value || <span className="text-gray-400 italic font-normal">—</span>}
      </span>
    );

  const editView =
    type === "textarea" ? (
      <Textarea
        {...commonProps}
        placeholder={`Add ${label ? label.toLowerCase() : field}...`}
        className="min-h-16 text-xs bg-slate-50 dark:bg-slate-950"
      />
    ) : type === "numberArray" ? (
      <PracticalNumberInput
        value={value}
        onChange={(newValue) => {
          updateDiaryField && updateDiaryField(dateKey, field, newValue);
        }}
        placeholder="e.g. 1, 3"
        className="bg-slate-50 dark:bg-slate-950"
      />
    ) : (
      <Input
        {...commonProps}
        type="number"
        placeholder="-"
        className="text-xs text-right bg-slate-50 dark:bg-slate-950"
      />
    );

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          {label}
        </label>
      )}
      {isTeacher && isEditing ? (
        editView
      ) : (
        <div
          onClick={() => isTeacher && toggleEditing && toggleEditing(dateKey)}
          title={isTeacher ? "Click to edit entry" : ""}
          className={
            isTeacher
              ? "cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 p-1 -m-1 rounded-md transition-colors"
              : ""
          }
        >
          {readOnlyView}
        </div>
      )}
    </div>
  );
});

export default FieldRenderer;
