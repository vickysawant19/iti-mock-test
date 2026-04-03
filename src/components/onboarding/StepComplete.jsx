import React from "react";
import { CheckCircle, User, MapPin, CalendarDays, GraduationCap, ArrowLeft } from "lucide-react";
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

export default function StepComplete({ formData = {}, onFinish, onBack, isSaving }) {
  const dob = formData.DOB
    ? new Date(formData.DOB).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:bg-white dark:sm:bg-slate-900 overflow-hidden mx-auto">
      <CardHeader className="space-y-3 pt-6 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Review & Submit</CardTitle>
        <CardDescription>
          Please confirm your details before we set up your account.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800">
          <ReviewRow icon={User} label="Full Name" value={formData.userName} />
          <ReviewRow icon={School} label="Institute" value={formData.collegeId} />
          <ReviewRow icon={GraduationCap} label="Primary Trade" value={formData.tradeId} />
          <ReviewRow
            icon={GraduationCap}
            label="Role"
            value={Array.isArray(formData.role) ? formData.role.join(", ") : formData.role}
          />
          <ReviewRow icon={CalendarDays} label="Date of Birth" value={dob} />
          <ReviewRow icon={MapPin} label="Address" value={formData.address} />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
          You can update these details anytime from your profile.
        </p>
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
          {isSaving ? "Finalizing..." : "Complete Setup 🎉"}
        </Button>
      </CardFooter>
    </Card>
  );
}
