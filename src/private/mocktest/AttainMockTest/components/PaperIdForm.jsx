import React from "react";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const PaperIdForm = ({ paperId, setPaperId, loading, onSubmit }) => {
  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-900 dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Enter Paper ID
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please enter the paper ID to generate your test
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="paperId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Paper ID
            </label>
            <Input
              type="text"
              id="paperId"
              value={paperId}
              onChange={(e) => setPaperId(e.target.value)}
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="Enter paper ID"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Generating Paper...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                <span>Generate Paper</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaperIdForm;
