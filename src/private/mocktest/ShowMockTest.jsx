import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import questionpaperservice from "@/appwrite/mockTest";
import { Query } from "appwrite";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Award,
  FileText,
  Clock,
  TrendingUp,
  Edit,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const OPTIONS = ["A", "B", "C", "D"];

const ShowMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isTeacher = user.labels.includes("Teacher");

  useEffect(() => {
    if (!paperId) return;

    const init = async () => {
      localStorage.removeItem(paperId);
      setIsLoading(true);
      try {
        const userPaperResponse = await questionpaperservice.listQuestions([
          Query.equal("$id", paperId),
        ]);

        if (!userPaperResponse.length) {
          throw new Error("Paper not found");
        }

        const userPaper = { ...userPaperResponse[0] };

        userPaper.questions = userPaper.questions
          .map((questionStr) => {
            try {
              return JSON.parse(questionStr);
            } catch (err) {
              console.error("Error parsing user paper question:", err);
              return null;
            }
          })
          .filter(Boolean);

        if (userPaper.isOriginal !== null && !userPaper.isOriginal) {
          const originalPaperResponse =
            await questionpaperservice.listQuestions([
              Query.equal("paperId", userPaper.paperId),
              Query.equal("isOriginal", true),
            ]);

          if (!originalPaperResponse?.length) {
            toast.error("Something went Wrong!\n");
            navigate("/all-mock-tests");
            return;
          }
          const originalPaper = { ...originalPaperResponse[0] };

          if (originalPaper.isProtected) {
            toast.error("Protected Paper!\n You can't view result!\n");
            navigate("/all-mock-tests");
            return;
          }

          const questionMap = originalPaper.questions.reduce((map, qStr) => {
            try {
              const q = JSON.parse(qStr);
              map.set(q.$id, q);
            } catch (err) {
              console.error("Error parsing original paper question:", err);
            }
            return map;
          }, new Map());

          userPaper.questions = userPaper.questions.map((q) => ({
            ...questionMap.get(q.$id),
            response: q.response,
          }));
        }

        setMockTest(userPaper);
      } catch (error) {
        console.error("Error fetching mock test:", error);
        toast.error("Failed to load the mock test.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [paperId, navigate]);

  const getIndex = (res) => OPTIONS.indexOf(res);

  const calculateStats = () => {
    if (!mockTest) return { correct: 0, incorrect: 0, accuracy: 0 };
    
    const correct = mockTest.questions.filter(
      (q) => q.response === q.correctAnswer
    ).length;
    const incorrect = mockTest.questions.filter(
      (q) => q.response && q.response !== q.correctAnswer
    ).length;
    const unanswered = mockTest.questions.filter((q) => !q.response).length;
    const accuracy = mockTest.quesCount > 0 
      ? ((correct / mockTest.quesCount) * 100).toFixed(1)
      : 0;

    return { correct, incorrect, unanswered, accuracy };
  };

  const SkeletonLoader = () => {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>

          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) return <SkeletonLoader />;

  if (!mockTest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Failed to load the mock test. Please try again.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = calculateStats();
  const scorePercentage = mockTest.quesCount > 0 
    ? (mockTest.score / mockTest.quesCount) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Mock Test Results
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Detailed performance analysis
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {mockTest.score}/{mockTest.quesCount || "NA"}
              </div>
              <Progress value={scorePercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {scorePercentage.toFixed(1)}% accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Correct</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.correct}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.accuracy}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incorrect</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.incorrect}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Wrong answers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unanswered</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.unanswered}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Skipped questions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Student Name
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {mockTest.userName || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Trade Name
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {mockTest.tradeName || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Year
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {mockTest.year || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Submitted At
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(mockTest.$createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Paper ID
                  </p>
                  <p className="text-base font-mono text-gray-900 dark:text-gray-100">
                    {mockTest.paperId}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Alert */}
        {scorePercentage < 50 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your score is below 50%. Consider reviewing the topics and practicing more questions.
            </AlertDescription>
          </Alert>
        )}

        {scorePercentage >= 80 && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              Excellent performance! You scored above 80%. Keep up the great work!
            </AlertDescription>
          </Alert>
        )}

        {/* Questions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Question Review
          </h2>
          
          {mockTest.questions.map((question, index) => {
            const isCorrect = question.response === question.correctAnswer;
            const isAnswered = question.response !== undefined && question.response !== null;

            return (
              <Card
                key={index}
                className={`overflow-hidden ${
                  isCorrect
                    ? "border-l-4 border-l-green-500"
                    : isAnswered
                    ? "border-l-4 border-l-red-500"
                    : "border-l-4 border-l-amber-500"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Badge variant={isCorrect ? "default" : isAnswered ? "destructive" : "secondary"}>
                        Q{index + 1}
                      </Badge>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {question.question}
                        </h3>
                        {isTeacher && (
                          <Link
                            to={`/edit/${question.$id}`}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-3 w-3" />
                            Edit Question ({question.$id})
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : isAnswered ? (
                        <XCircle className="h-6 w-6 text-red-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-amber-600" />
                      )}
                    </div>
                  </div>

                  {question?.images?.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {question.images.map((img) => {
                        const image = JSON.parse(img);
                        return (
                          <img
                            className="max-h-32 rounded-md border"
                            key={image.id}
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQysm7d0JnuK4_jPG6U3Fyd1cRzbb78Z_7-4g&s"
                            alt={image.name}
                          />
                        );
                      })}
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    {question.options.map((option, idx) => {
                      const isCorrectOption = idx === getIndex(question.correctAnswer);
                      const isSelectedOption = idx === getIndex(question.response);

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg transition-colors ${
                            isCorrectOption
                              ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                              : isSelectedOption
                              ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                              : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-gray-100">
                              <span className="font-semibold mr-2">{OPTIONS[idx]}.</span>
                              {option}
                            </span>
                            {isCorrectOption && (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Correct
                              </Badge>
                            )}
                            {isSelectedOption && !isCorrectOption && (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Your Answer
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!isAnswered && (
                    <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-400">
                        You did not answer this question
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Footer */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Test completed • {mockTest.questions.length} questions reviewed
              </p>
              <Button
                onClick={() => navigate("/all-mock-tests")}
                variant="outline"
                className="mt-4"
              >
                Back to All Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShowMockTest;