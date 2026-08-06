import React from 'react'

const FeaturePlaceholder = ({ icon: Icon, title }) => (
  <div className="bg-white rounded-lg shadow-xs p-8 text-center text-gray-500 dark:bg-gray-800 dark:border dark:border-gray-700 dark:text-gray-400">
    <Icon className="w-12 h-12 mx-auto mb-4 text-blue-500 dark:text-blue-400" />
    <h3 className="text-xl font-medium text-gray-700 dark:text-white">
      {title}
    </h3>
    <p className="mt-2 text-gray-500 dark:text-gray-400">
      This feature is under development.
    </p>
  </div>
);

export default FeaturePlaceholder