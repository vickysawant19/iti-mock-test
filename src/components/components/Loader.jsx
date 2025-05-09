import React from "react";
import { ClipLoader } from "react-spinners";
import { Card, CardContent } from "@/components/ui/card";

const Loader = ({ isLoading = true }) => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-fit p-6 shadow-sm bg-transparent dark:bg-transparent border-0">
        <CardContent className="flex justify-center items-center p-0">
          <ClipLoader size={60} color="currentColor" loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Loader;
