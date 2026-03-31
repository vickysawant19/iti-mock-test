import React from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function StepComplete({ onFinish, isSaving }) {
  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:bg-white dark:sm:bg-slate-900 overflow-hidden mx-auto text-center">
      <CardHeader className="space-y-4 pt-8">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500 animate-in zoom-in duration-500" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">You're All Set!</CardTitle>
        <CardDescription className="text-lg mx-auto max-w-[280px]">
          Your profile is ready. You can now access all features of the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8 pt-4">
        {/* We can show summary here in the future. For now keep it minimal. */}
        <p className="text-slate-600 dark:text-slate-400">
           Welcome to the community!
        </p>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6 pb-8 dark:border-slate-800">
        <Button 
          type="button" 
          onClick={onFinish}
          disabled={isSaving} 
          className="bg-green-600 hover:bg-green-700 text-white min-w-[200px] h-12 text-lg"
        >
          {isSaving ? "Finalizing..." : "Go to Dashboard"}
        </Button>
      </CardFooter>
    </Card>
  );
}
