import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Trophy,
  Download,
  Search,
  Filter,
  Users,
  Award,
  Clock,
  TrendingUp,
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import questionpaperservice from "@/appwrite/mockTest";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import Loader from "@/components/components/Loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MockTestResults = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const profile = useSelector(selectProfile);

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await questionpaperservice.getUserResults(paperId);
        const updatedRes = (res ?? []).map((item) => ({
          timeTaken: differenceInMinutes(
            new Date(item.endTime),
            new Date(item.startTime)
          ),
          ...item,
        }));
        setData(
          (updatedRes ?? [])
            .filter((item) => !item.isOriginal)
            .sort(
              (a, b) =>
                b.score - a.score ||
                a.timeTaken - b.timeTaken ||
                new Date(a.endTime) - new Date(b.endTime)
            )
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [paperId]);

  const formatName = (name) =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const filteredData = useMemo(() => {
    let filtered = data.filter((item) =>
      item.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterStatus === "submitted") {
      filtered = filtered.filter((item) => item.submitted);
    } else if (filterStatus === "not-submitted") {
      filtered = filtered.filter((item) => !item.submitted);
    }

    return filtered;
  }, [data, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const submitted = data.filter((item) => item.submitted);
    const avgScore =
      submitted.length > 0
        ? (
            submitted.reduce((sum, item) => sum + item.score, 0) /
            submitted.length
          ).toFixed(1)
        : 0;
    const avgTime =
      submitted.length > 0
        ? (
            submitted.reduce((sum, item) => sum + item.timeTaken, 0) /
            submitted.length
          ).toFixed(1)
        : 0;
    const topScore =
      submitted.length > 0
        ? Math.max(...submitted.map((item) => item.score))
        : 0;

    return {
      total: data.length,
      submitted: submitted.length,
      notSubmitted: data.length - submitted.length,
      avgScore,
      avgTime,
      topScore,
    };
  }, [data]);

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Rank,Name,Score,Time Taken (min),Submission Status,Submitted At"]
        .concat(
          filteredData.map((res, index) => {
            const timeTaken = res.submitted ? res.timeTaken : "Not Submitted";
            const submittedAt = res.submitted
              ? format(
                  new Date(res.endTime || res.$updatedAt),
                  "dd/MM/yyyy hh:mm a"
                )
              : "Not Submitted";
            return `${index + 1},"${res.userName}",${res.score},${timeTaken},${
              res.submitted ? "Submitted" : "Not Submitted"
            },"${submittedAt}"`;
          })
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mock_test_results_${paperId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMedalColor = (position) => {
    switch (position) {
      case 1:
        return "text-yellow-500";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-amber-700";
      default:
        return "hidden";
    }
  };

  const getRankBadgeVariant = (rank) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    return "outline";
  };

  if (loading) return <Loader isLoading={loading} />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button
              onClick={() => navigate(-1)}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Mock Test Results
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and analyze student performance
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.submitted} submitted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Top score: {stats.topScore}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgTime} min</div>
              <p className="text-xs text-muted-foreground mt-1">
                Among submitted tests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0
                  ? ((stats.submitted / stats.total) * 100).toFixed(0)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.notSubmitted} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by student name..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="submitted">Submitted Only</SelectItem>
                  <SelectItem value="not-submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Rank</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Time Taken</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        No results found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((result, index) => (
                      <TableRow
                        key={result.$id}
                        className={
                          profile.userId === result.userId
                            ? "bg-blue-50 dark:bg-blue-950/20"
                            : ""
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRankBadgeVariant(index + 1)}>
                              #{index + 1}
                            </Badge>
                            {index < 3 && (
                              <Trophy
                                className={`h-5 w-5 ${getMedalColor(
                                  index + 1
                                )}`}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {result.submitted ? (
                            <Link
                              to={`/show-mock-test/${result.$id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                            >
                              {formatName(result.userName)}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
                              {formatName(result.userName)}
                            </span>
                          )}
                          {profile.userId === result.userId && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {result.score || 0}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            /{result.quesCount || 50}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {result.submitted ? (
                            <span className="text-gray-700 dark:text-gray-300">
                              {result.timeTaken} min
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              result.submitted ? "default" : "destructive"
                            }
                            className={
                              result.submitted
                                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                                : ""
                            }
                          >
                            {result.submitted ? "Submitted" : "Not Submitted"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {result.submitted ? (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {format(
                                new Date(result.endTime || result.$updatedAt),
                                "dd/MM/yyyy hh:mm a"
                              )}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {filteredData.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center pb-4">
            Showing {filteredData.length} of {data.length} student(s)
          </div>
        )}
      </div>
    </div>
  );
};

export default MockTestResults;
