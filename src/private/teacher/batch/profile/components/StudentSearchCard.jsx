import React, { useState } from "react";
import { UserPlus, Send, Check, Loader2, User } from "lucide-react";

const StudentSearchCard = ({ 
  user, 
  onAddStudent, 
  onRequestStudent,
  status = "none" // 'none', 'added', 'requested', 'processing_add', 'processing_req'
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 mb-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xs hover:shadow-sm transition-shadow">
      
      {/* Profile Info */}
      <div className="flex items-center w-full sm:w-auto mb-3 sm:mb-0">
        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-400 font-semibold text-lg border border-indigo-200 dark:border-indigo-800">
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.userName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={24} />
          )}
        </div>
        
        <div className="ml-4 overflow-hidden">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {user.userName}
            </h3>
            {user.noProfile && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                No Profile
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {status === "added" ? (
          <button 
            disabled 
            className="flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg text-sm w-full sm:w-auto"
          >
            <Check size={16} className="mr-1.5" /> Added
          </button>
        ) : status === "requested" ? (
          <button 
            disabled 
            className="flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium rounded-lg text-sm w-full sm:w-auto"
          >
            Requested
          </button>
        ) : (
          <>
            <button
              onClick={() => onRequestStudent(user)}
              disabled={status === "processing_add" || status === "processing_req"}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {status === "processing_req" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Send size={16} className="mr-1.5" /> Request
                </>
              )}
            </button>
            <button
              onClick={() => onAddStudent(user)}
              disabled={status === "processing_add" || status === "processing_req"}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {status === "processing_add" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={16} className="mr-1.5" /> Add
                </>
              )}
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default StudentSearchCard;
