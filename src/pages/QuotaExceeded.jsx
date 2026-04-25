import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, Database, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const QuotaExceeded = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white dark:bg-gray-950 overflow-hidden">
      {/* Visual / Branding Side */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-red-600 via-rose-600 to-orange-500 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden min-h-[40vh] md:min-h-screen">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Abstract shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        <div className="relative z-10 flex items-center gap-2 text-white/90">
          <Database className="w-6 h-6" />
          <span className="font-semibold tracking-wider uppercase text-sm">System Alert</span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center my-8 md:my-0">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 border border-white/30 shadow-2xl">
            <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 tracking-tight">
            Database<br />Quota Exceeded
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-md font-medium">
            We're experiencing exceptionally high traffic. The application's database read limit has been temporarily reached.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-white/70 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>High Load</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Resets Shortly</span>
          </div>
        </div>
      </div>

      {/* Action Side */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How to proceed?</h2>
            <p className="text-gray-500 dark:text-gray-400">
              The system automatically resets quotas periodically. You can try refreshing the page in a few moments, or return to your previous activity.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
             <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Auto-Recovery</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Our systems are designed to recover automatically. Trying again in 1-2 minutes usually resolves the issue.</p>
                </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              size="lg"
              onClick={() => window.location.reload()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
            >
              <RefreshCw className="w-5 h-5 mr-2" /> 
              Try Again
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1 border-gray-200 dark:border-gray-800 dark:hover:bg-gray-900 dark:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> 
              Go Back
            </Button>
          </div>
          
          <p className="text-xs text-center text-gray-400 dark:text-gray-600 pt-8">
            If this issue persists, please contact the system administrator to upgrade the database plan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuotaExceeded;
