import { Award, CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ShowStats = ({ attendance, label = "Attendance" }) => {
  const totalDays = attendance?.presentDays + attendance?.absentDays;
  const attendancePercentage =
    totalDays > 0 ? Math.round((attendance?.presentDays / totalDays) * 100) : 0;

  return (
    <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg ">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <CalendarIcon className="mr-2 text-blue-600" size={20} />
        {label}
      </h2>

      {/* Three main stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CalendarIcon className="mr-2 text-blue-600" size={16} />
              Total Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{totalDays}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total scheduled days in period
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="mr-2 text-green-600" size={16} />
              Present Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {attendance?.presentDays}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Days attended of total scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <XCircle className="mr-2 text-red-600" size={16} />
              Absent Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {attendance?.absentDays}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Days missed of total scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress card at the bottom */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Award className="mr-2 text-purple-600" size={16} />
            Attendance Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">{attendancePercentage}%</span>
            {attendancePercentage >= 90 ? (
              <Badge
                variant="success"
                className="ml-auto bg-green-100 text-green-800"
              >
                Excellent
              </Badge>
            ) : attendancePercentage >= 70 ? (
              <Badge
                variant="warning"
                className="ml-auto bg-yellow-100 text-yellow-800"
              >
                Good
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className="ml-auto bg-red-100 text-red-800"
              >
                Needs Improvement
              </Badge>
            )}
          </div>
          <Progress
            value={attendancePercentage}
            className={`h-2 ${
              attendancePercentage >= 90
                ? "bg-green-100 dark:bg-green-950"
                : attendancePercentage >= 70
                ? "bg-yellow-100 dark:bg-yellow-950"
                : "bg-red-100 dark:bg-red-950"
            }`}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Overall attendance rate based on present days
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShowStats;
