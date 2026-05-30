import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { GalleryVerticalEnd, CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { authAPI } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function VerifyEmail() {
  const navigate = useNavigate();
  const initAuth = useAuthStore((state) => state.initAuth);
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      setStatus("error");
      setMessage("No email provided. Please sign up again.");
    }
  }, [email]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) return;

    setStatus("loading");
    setMessage("");

    try {
      if (!email) throw new Error("Email missing");
      await authAPI.verifyOTP(email, otp);
      await initAuth();
      setStatus("success");
      setMessage("Email verified successfully!");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.error || "Verification failed. Invalid or expired OTP.");
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResendDisabled(true);
    setMessage("");
    
    try {
      await authAPI.resendOTP(email);
      setCountdown(60); // 60s cooldown
      setMessage("New OTP sent to your email.");
      // Clear error status if it was set
      if (status === "error") setStatus("idle");
    } catch (err: any) {
      setResendDisabled(false);
      setMessage(err.response?.data?.error || "Failed to resend OTP.");
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-sm border">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2 font-medium mb-4">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Safar
          </Link>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We've sent a 6-digit verification code to <br/>
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle className="size-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Email Verified!</h3>
              <p className="text-muted-foreground text-sm">
                Your account has been successfully verified.
              </p>
            </div>
            <Link to="/" className="w-full">
              <Button className="w-full" size="lg">
                Continue to Main Page <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(val) => setOtp(val)}
                disabled={status === "loading"}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 p-3 rounded-md">
                <XCircle className="size-4" />
                <span>{message}</span>
              </div>
            )}
            
            {status !== "error" && message && (
               <div className="text-sm text-center text-muted-foreground bg-muted p-2 rounded-md">
                 {message}
               </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={status === "loading" || otp.length !== 6}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center space-y-4">
              <div className="text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendDisabled || status === "loading"}
                  className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Click to resend"}
                </button>
              </div>
              
              <Link
                to="/newUser"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="mr-2 size-3 rotate-180" /> Back to Sign Up
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
