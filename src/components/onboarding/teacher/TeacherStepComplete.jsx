import React from "react";
import { CheckCircle, User, MapPin, CalendarDays, GraduationCap, ArrowLeft, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ReviewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words mt-0.5">
          {value || <span className="text-slate-400 italic">Not provided</span>}
        </p>
      </div>
    </div>
  );
}

export default function TeacherStepComplete({ formData = {}, onFinish, onBack, isSaving }) {
  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:bg-white dark:sm:bg-slate-900 overflow-hidden mx-auto">
      <CardHeader className="space-y-3 pt-6 text-center">
        <div className="flex justify-center relative mb-2">
          <Avatar className="w-24 h-24 border-4 border-white dark:border-slate-800 shadow-xl">
            <AvatarImage src={formData.profileImage} alt={formData.userName || "Instructor"} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
              {formData.userName ? formData.userName.charAt(0).toUpperCase() : "I"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-1/2 translate-x-10 translate-y-2 bg-green-500 rounded-full p-1 border-2 border-white dark:border-slate-800 shadow-sm">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Review & Submit</CardTitle>
        <CardDescription>
          Confirm your instructor profile before going to the dashboard.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900/50">
          <ReviewRow icon={User} label="Full Name" value={formData.userName} />
          {formData.email && <ReviewRow icon={Mail} label="Email Address" value={formData.email} />}
          {formData.phone && <ReviewRow icon={Phone} label="Phone Number" value={formData.phone} />}
          <ReviewRow icon={CalendarDays} label="Date of Birth" value={formData.DOB} />
          <ReviewRow icon={MapPin} label="Address" value={formData.address} />
          <ReviewRow icon={GraduationCap} label="Role" value="Teacher" />
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-400 text-center font-medium">
            🏫 After setup, you can create your first batch from the Dashboard.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4 pb-6 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          type="button"
          onClick={onFinish}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700 text-white min-w-[160px]"
        >
          {isSaving ? "Finalizing..." : "Go to Dashboard 🎉"}
        </Button>
      </CardFooter>
    </Card>
  );
}
