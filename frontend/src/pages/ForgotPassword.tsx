import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GalleryVerticalEnd, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authAPI } from "@/api/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setErrorMessage("");
    try {
      await authAPI.requestPasswordReset(data.email);
      setSent(true);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Something went wrong. Please try again."
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
          <h1 className="text-2xl font-bold">Forgot your password?</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle className="size-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Check your email</h3>
              <p className="text-muted-foreground text-sm">
                If an account exists for that email, a password reset link has been sent.
              </p>
            </div>
            <Link to="/logUser" className="w-full">
              <Button className="w-full" size="lg">
                Back to Login <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md text-sm">
                {errorMessage}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link
                to="/logUser"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="mr-2 size-3 rotate-180" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
