import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, GalleryVerticalEnd, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authAPI } from "@/api/auth";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setErrorMessage("Invalid or missing reset token. Please request a new reset link.");
      return;
    }
    setErrorMessage("");
    try {
      await authAPI.resetPassword(token, data.newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/logUser"), 2500);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Reset failed. The link may have expired. Please request a new one."
      );
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-sm border">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2 font-medium mb-4">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Safar
          </Link>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground text-sm">Enter your new password below.</p>
        </div>

        {!token ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-destructive">
              Invalid or missing reset token. Please request a new reset link.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full">Request New Link</Button>
            </Link>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle className="size-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Password Reset!</h3>
              <p className="text-muted-foreground text-sm">
                Your password has been updated. Redirecting to login…
              </p>
            </div>
            <Link to="/logUser" className="w-full">
              <Button className="w-full" size="lg">
                Go to Login <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  {...register("newPassword")}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Min 8 characters, one uppercase letter, one special character.
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  {...register("confirmPassword")}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md text-sm">
                {errorMessage}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="mr-2 size-3 rotate-180" /> Request new link
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
