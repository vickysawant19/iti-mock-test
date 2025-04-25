import React, { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  PlayCircle,
  Eye,
  Share2,
  Trash2,
  ClipboardList,
  Calendar,
  FileText,
  Target,
  ListOrdered,
  CheckCircle,
  Loader2,
  Clock11,
  Lock,
  Unlock,
} from "lucide-react";
import questionpaperservice from "../../../../appwrite/mockTest";

const MockTestCard = ({
  setMockTests,
  test,
  user,
  handleDelete,
  isDeleting,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const handleShare = async (paperId) => {
    const examUrl = `${window.location.origin}/attain-test?paperid=${paperId}`;
    const shareText = `
    🎉 *_MSQs Exam Paper_* 🎉
    
    _Hey there!_
    _Check out this Exam Paper_
     Paper ID: *${paperId}*
    
    📚 *Trade:* ${test.tradeName}
    💯 *Total Questions:* ${test.quesCount}
    ⏳ *Duration:* ${test.totalMinutes} Minutes
    
    👉 Click the link below to get started:
    ${examUrl}
    
    *Remember to submit on complete!*
    
     Good luck and happy Exam!
    `;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Mock Test Paper", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const onToggleProtection = async () => {
    setIsLoading(true);
    try {
      const data = await questionpaperservice.updateQuestion(test.$id, {
        isProtected: !test.isProtected,
      });
      setMockTests((prev) =>
        prev.map((item) => (item.$id === data.$id ? data : item))
      );
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
          <Calendar className="w-4 h-4" />
          {format(new Date(test.$createdAt), "PPpp")}
        </div>

        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          {test.tradeName || "No Trade Name"}
          {test.isOriginal && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-sm">
              Original
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 text-gray-600">
          <span className="text-sm text-gray-500 ml-7">
            {test.year || "-"} YEAR
          </span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="w-4 h-4" />
            <span className="text-sm">{test.paperId}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <ListOrdered className="w-4 h-4" />
            <span className="text-sm">Questions: {test.quesCount || "50"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <Target className="w-4 h-4" />
            <span className="text-sm">Score: {test.score ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                test.submitted ? "text-green-500" : "text-gray-400"
              }`}
            />
            <span
              className={`text-sm ${
                test.submitted ? "text-green-600" : "text-gray-600"
              }`}
            >
              {test.submitted ? "Submitted" : "Not Submitted"}
            </span>
          </div>
        </div>
        {test.submitted && test.endTime && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock11 className="w-4 h-4" />
            <span className="text-sm">
              Submitted: {format(new Date(test.endTime), "PPp")}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600">
          <Clock11 className="w-4 h-4" />
          <span className="text-sm">
            Time: {test.totalMinutes ?? "-"} Minutes
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-wrap gap-2 text-nowrap">
        {test.submitted ? (
          <Link
            to={`/show-mock-test/${test.$id}`}
            className="inline-flex  sm:w-1/3 md:w-1/3 grow  items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>Show Test</span>
          </Link>
        ) : (
          <Link
            to={`/start-mock-test/${test.$id}`}
            className="inline-flex  sm:w-1/3 md:w-1/3 grow  items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm font-medium"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start Test</span>
          </Link>
        )}

        <Link
          to={`/mock-test-result/${test.paperId}`}
          className="inline-flex  sm:w-1/3 md:w-1/3 grow  items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors text-sm font-medium"
        >
          <ClipboardList className="w-4 h-4" />
          <span>Test Scores</span>
        </Link>

        <button
          onClick={() => handleShare(test.paperId)}
          className="inline-flex  sm:w-1/3 md:w-1/3 grow  items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        {user.labels.includes("Teacher") && (
          <>
            {test.isOriginal && (
              <button
                onClick={() => onToggleProtection(test.$id)}
                className="inline-flex sm:w-1/3 md:w-1/3 grow  items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors text-sm font-medium"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4" />
                ) : test.isProtected ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Protected</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Unprotected</span>
                  </>
                )}
              </button>
            )}
            <button
              disabled={isDeleting[test.$id]}
              onClick={() => handleDelete(test.$id)}
              className="inline-flex w-1/4  grow  items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting[test.$id] ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MockTestCard;
