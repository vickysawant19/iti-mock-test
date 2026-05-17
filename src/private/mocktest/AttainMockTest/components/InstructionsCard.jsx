import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const InstructionsCard = () => {
  return (
    <Card className="mt-6 dark:bg-gray-800 dark:border-gray-800">
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Instructions
        </h3>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex items-start gap-2">
            • Enter the paper ID provided by your instructor
          </li>
          <li className="flex items-start gap-2">
            • Make sure you have a stable internet connection
          </li>
          <li className="flex items-start gap-2">
            • Once generated, the test will start automatically
          </li>
          <li className="flex items-start gap-2">
            • Complete all questions within the given time limit
          </li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default InstructionsCard;
