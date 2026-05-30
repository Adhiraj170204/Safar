import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { authAPI } from "@/api/auth"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

// Zod schema for validation
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      await authAPI.signup({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      })

      setSuccessMessage("Account created! Redirecting to verification...")
      reset()

      // Redirect to verification page after delay
      setTimeout(() => {
        navigate(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
      }, 1500)
    } catch (error) {
      console.error("Signup error:", error)
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message || 
          error.response?.data?.error ||
          error.message || 
          "Registration failed. Please try again."
        )
      } else {
        setErrorMessage("An error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input 
            id="name" 
            type="text" 
            placeholder="John Doe"
            {...register("name")}
            disabled={loading}
          />
          {errors.name && (
            <FieldDescription className="text-red-500">
              {errors.name.message}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input 
            id="username" 
            type="text" 
            placeholder="johndoe"
            {...register("username")}
            disabled={loading}
          />
          {errors.username && (
            <FieldDescription className="text-red-500">
              {errors.username.message}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com"
            {...register("email")}
            disabled={loading}
          />
          {errors.email && (
            <FieldDescription className="text-red-500">
              {errors.email.message}
            </FieldDescription>
          )}
          {!errors.email && (
            <FieldDescription>
              We&apos;ll use this to contact you. We will not share your email
              with anyone else.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"}
              {...register("password")}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <FieldDescription className="text-red-500">
              {errors.password.message}
            </FieldDescription>
          )}
          {!errors.password && (
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <div className="relative">
            <Input 
              id="confirmPassword" 
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <FieldDescription className="text-red-500">
              {errors.confirmPassword.message}
            </FieldDescription>
          )}
          {!errors.confirmPassword && (
            <FieldDescription>Please confirm your password.</FieldDescription>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </Field>

        <Field>
          <FieldDescription className="px-6 text-center">
            Already have an account? <Link to="/logUser" className="text-primary hover:underline">Sign in</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
