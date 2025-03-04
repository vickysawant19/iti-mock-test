import React from 'react';


const MarkTodaysAttendance = () => {
  return (
    <div className="flex flex-col min-h-screen p-4 bg-gray-100">
      {/* Top section: Eligibility message */}
      <div className="p-4 text-center bg-blue-200 rounded-md mb-4 animate-pulse">
        <p className="text-lg font-bold">Eligibility Status: Checking...</p>
      </div>

      {/* Student Info */}
      <div className="p-4 bg-white rounded-md shadow-md mb-4 animate-pulse">
        <h2 className="text-xl font-bold">Student Information</h2>
        <p className="text-gray-500">Loading student details...</p>
      </div>

      {/* Today's Date and Attendance status */}
      <div className="p-4 bg-white rounded-md shadow-md mb-4 animate-pulse">
        <h2 className="text-xl font-bold">Today's Date</h2>
        <p className="text-gray-500">Fetching date...</p>
      </div>

      {/* Map layout placeholder (skeleton style) */}
      <div className="flex-1 bg-white rounded-md shadow-md animate-pulse">
        <h2 className="text-xl font-bold p-4">Classroom Layout</h2>
        <div className="grid grid-cols-3 gap-2 p-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="w-full h-20 bg-gray-300 rounded-md"></div>
          ))}
        </div>
      </div>

      {/* Fixed Mark Attendance Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-blue-600 text-center">
        <button className="w-full py-3 text-white font-bold rounded-md shadow-md">
          Mark Attendance
        </button>
      </div>
    </div>
  );
};

export default MarkTodaysAttendance;
