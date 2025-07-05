import React, { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-3">
          <Calendar className="w-4 h-4" />
          {format(new Date(test.$createdAt), "PPpp")}
        </div>

        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          {test.tradeName || "No Trade Name"}
          {test.isOriginal && (
            <Badge
              variant="outline"
              className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1"
            >
              Original
            </Badge>
          )}
        </h2>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-7">
            {test.year || "-"} YEAR
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <FileText className="w-4 h-4" />
            <span className="text-sm">{test.paperId}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <ListOrdered className="w-4 h-4" />
            <span className="text-sm">Questions: {test.quesCount || "50"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Target className="w-4 h-4" />
            <span className="text-sm">Score: {test.score ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${
                test.submitted
                  ? "text-green-500 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            />
            <span
              className={`text-sm ${
                test.submitted
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {test.submitted ? "Submitted" : "Not Submitted"}
            </span>
          </div>
        </div>
        {test.submitted && test.endTime && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Clock11 className="w-4 h-4" />
            <span className="text-sm">
              Submitted: {format(new Date(test.endTime), "PPp")}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Clock11 className="w-4 h-4" />
          <span className="text-sm">
            Time: {test.totalMinutes ?? "-"} Minutes
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 flex flex-wrap gap-2 text-nowrap">
        {test.submitted ? (
          <Button
            asChild
            variant="secondary"
            className="inline-flex sm:w-1/3 md:w-1/3 grow bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white"
          >
            <Link to={`/show-mock-test/${test.$id}`}>
              <Eye className="w-4 h-4 mr-2" />
              <span>Show Test</span>
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            className="inline-flex sm:w-1/3 md:w-1/3 grow bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
          >
            <Link to={`/start-mock-test/${test.$id}`}>
              <PlayCircle className="w-4 h-4 mr-2" />
              <span>Start Test</span>
            </Link>
          </Button>
        )}

        <Button
          asChild
          variant="secondary"
          className="inline-flex sm:w-1/3 md:w-1/3 grow bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
        >
          <Link to={`/mock-test-result/${test.paperId}`}>
            <ClipboardList className="w-4 h-4 mr-2" />
            <span>Test Scores</span>
          </Link>
        </Button>

        <Button
          onClick={() => handleShare(test.paperId)}
          variant="secondary"
          className="inline-flex sm:w-1/3 md:w-1/3 grow bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white"
        >
          <Share2 className="w-4 h-4 mr-2" />
          <span>Share</span>
        </Button>

        {test.isOriginal && (
          <>
            <Button
              onClick={() => onToggleProtection(test.$id)}
              variant="secondary"
              className="inline-flex sm:w-1/3 md:w-1/3 grow bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : test.isProtected ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  <span>Protected</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  <span>Unprotected</span>
                </>
              )}
            </Button>
            <Button
              disabled={isDeleting[test.$id]}
              onClick={() => handleDelete(test.$id)}
              variant="destructive"
              className="inline-flex w-1/4 grow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting[test.$id] ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span>Delete</span>
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default MockTestCard;
