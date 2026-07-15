import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import authService from "@/services/auth.service";
import authImg from "@/assets/auth-illustration.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgetPass() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (cooldown > 0) return;
    
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success("Password reset email sent! Please check your inbox.");
      setCooldown(60); // 60 seconds cooldown
    } catch (error) {
      toast.error(error.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950">
      {/* Left Section - Image */}
      <div className="hidden lg:flex w-1/2 bg-blue-50 dark:bg-slate-900 relative overflow-hidden">
        <img
          src={authImg}
          alt="Authentication"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/40 to-transparent z-10"></div>
        <div className="absolute bottom-10 left-10 z-20">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Reset Password</h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg">Follow simple instructions to safely regain access to your account.</p>
        </div>
      </div>

      {/* Right Section - Forget Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-lg bg-transparent sm:bg-white dark:sm:bg-slate-900">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-center">Forgot password?</CardTitle>
            <CardDescription className="text-center">
              No worries, we'll send you reset instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                type="submit" 
                disabled={isLoading || cooldown > 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending instructions...
                  </>
                ) : cooldown > 0 ? (
                  `Resend email in ${cooldown}s`
                ) : (
                  "Send Reset Email"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
            </div>
            <div className="flex flex-col gap-2 items-center text-sm w-full">
              <Link 
                to="/login" 
                className="flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
