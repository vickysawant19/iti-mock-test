import React from 'react'

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="bg-white rounded-lg shadow-xs p-8 md:p-12 text-center dark:bg-gray-800 dark:border dark:border-gray-700">
    <Icon className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
    <h3 className="text-lg md:text-xl font-medium text-gray-500 dark:text-gray-300">
      {title}
    </h3>
    {description && (
      <p className="mt-2 text-gray-400 dark:text-gray-400">{description}</p>
    )}
  </div>
);

export default EmptyState