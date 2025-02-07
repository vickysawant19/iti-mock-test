import React from 'react'

const AddTopics = ({ topics, register, errors }) => {
  return (
    <div className="border-t pt-6">
    <h3 className="text-lg font-semibold mb-4">
      Topic Information
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Topic Name *
        </label>
        <input
          {...register("topicName", {
            required: "Required field",
          })}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {errors.topicName && (
          <span className="text-red-500 text-sm">
            {errors.topicName.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Topic Hours *
        </label>
        <input
          type="number"
          {...register("topicHours", {
            required: "Required field",
            min: { value: 1, message: "Minimum 1 hour" },
          })}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {errors.topicHours && (
          <span className="text-red-500 text-sm">
            {errors.topicHours.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Topic Type *
        </label>
        <select
          {...register("topicType", {
            required: "Required field",
          })}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Select Type</option>
          <option value="Theory">Theory</option>
          <option value="Practical">Practical</option>
        </select>
        {errors.topicType && (
          <span className="text-red-500 text-sm">
            {errors.topicType.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Topic Resource *
        </label>
        <input
          {...register("topicResource", {
            required: "Required field",
          })}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {errors.topicResource && (
          <span className="text-red-500 text-sm">
            {errors.topicResource.message}
          </span>
        )}
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-2">
          Topic Assessment *
        </label>
        <textarea
          {...register("topicAssessment", {
            required: "Required field",
          })}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          rows="2"
        />
        {errors.topicAssessment && (
          <span className="text-red-500 text-sm">
            {errors.topicAssessment.message}
          </span>
        )}
      </div>
    </div>
  </div>
  )
}

export default AddTopics