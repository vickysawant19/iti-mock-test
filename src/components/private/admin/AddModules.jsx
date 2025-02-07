import React from 'react'

const AddModules = ({register, errors}) => {
  return (
    <div><div>
    <h1>Add module</h1>
    <div>
      <label className="block text-sm font-medium mb-2">
        Module Name *
      </label>
      <input
        {...register("moduleName", {
          required: "Required field",
        })}
        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />
      {errors.moduleName && (
        <span className="text-red-500 text-sm">
          {errors.moduleName.message}
        </span>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">
        Module Duration (hours) *
      </label>
      <input
        type="number"
        {...register("moduleDuration", {
          required: "Required field",
          min: { value: 1, message: "Minimum 1 hour" },
        })}
        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />
      {errors.moduleDuration && (
        <span className="text-red-500 text-sm">
          {errors.moduleDuration.message}
        </span>
      )}
    </div>
  </div>

  <div>
    <label className="block text-sm font-medium mb-2">
      Module Description *
    </label>
    <textarea
      {...register("moduleDescription", {
        required: "Required field",
      })}
      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      rows="3"
    />
    {errors.moduleDescription && (
      <span className="text-red-500 text-sm">
        {errors.moduleDescription.message}
      </span>
    )}
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium mb-2">
        Learning Outcome *
      </label>
      <textarea
        {...register("learningOutcome", {
          required: "Required field",
        })}
        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        rows="2"
      />
      {errors.learningOutcome && (
        <span className="text-red-500 text-sm">
          {errors.learningOutcome.message}
        </span>
      )}
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">
        Assessment Criteria *
      </label>
      <input
        {...register("assessmentCriteria", {
          required: "Required field",
        })}
        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />
      {errors.assessmentCriteria && (
        <span className="text-red-500 text-sm">
          {errors.assessmentCriteria.message}
        </span>
      )}
    </div>
  </div></div>
  )
}

export default AddModules