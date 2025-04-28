import React from "react";
import { ClipLoader } from "react-spinners";
import { LucideLoader } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Loader = ({ isLoading = true }) => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background text-foreground dark:bg-black dark:text-white">
      <Card className="w-full max-w-md shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold dark:text-white">
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {/* Spinner */}
          <ClipLoader size={100} color={"#123abc"} loading={isLoading} />

          {/* Loading Message */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please wait while we fetch your data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Loader;
