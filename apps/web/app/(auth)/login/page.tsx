"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import api from "@/lib/api"
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google"

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google")
      }

      // Call backend with credential
      const apiResponse = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      })

      if (apiResponse.data.success) {
        // Check if 2FA is required
        if (apiResponse.data.requiresTwoFactor) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("otpEmail", apiResponse.data.email || "")
            // Store dev OTP if available (development mode)
            if (apiResponse.data.devOtp) {
              sessionStorage.setItem("devOtp", apiResponse.data.devOtp)
            }
          }
          router.push("/verify-otp")
          return
        }

        // If token exists, store it and establish NextAuth session
        if (apiResponse.data.data?.token) {
          const { token, user, redirectUrl } = apiResponse.data.data

          // Store token in localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("token", token)
          }

          // Establish NextAuth session using credentials
          const result = await signIn("credentials", {
            email: user.email,
            password: "google-login-placeholder", // Not needed for Google auth, but required by NextAuth
            redirect: false,
          })

          if (result?.ok) {
            const finalRedirect = redirectUrl || callbackUrl
            router.push(finalRedirect)
            router.refresh()
          } else {
            // If credentials don't work, try to manually set session
            // For now, just redirect with token
            const finalRedirect = redirectUrl || callbackUrl
            router.push(finalRedirect)
            router.refresh()
          }
        }
      } else {
        setError(apiResponse.data.message || "Google authentication failed")
      }
    } catch (err: any) {
      console.error("Google login error:", err)
      setError(
        err.response?.data?.message ||
        err.message ||
        "Google authentication failed"
      )
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again.")
    setIsGoogleLoading(false)
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      })

      if (response.data.success) {
        // Check if 2FA is required
        if (response.data.requiresTwoFactor) {
          // Store email in sessionStorage for OTP verification
          if (typeof window !== "undefined") {
            sessionStorage.setItem("otpEmail", data.email)
            // Store dev OTP if available (development mode)
            if (response.data.devOtp) {
              sessionStorage.setItem("devOtp", response.data.devOtp)
            }
          }
          router.push("/verify-otp")
          return
        }

        // If token exists, store it and establish NextAuth session
        if (response.data.data?.token) {
          const { token, user, redirectUrl } = response.data.data

          // Store token in localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("token", token)
          }

          // Establish NextAuth session
          const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
          })

          if (result?.ok) {
            // Redirect to the appropriate dashboard
            const finalRedirect = redirectUrl || callbackUrl
            router.push(finalRedirect)
            router.refresh()
          } else {
            setError(result?.error || "Failed to establish session")
          }
        }
      } else {
        setError(response.data.message || "Login failed")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(
        err.response?.data?.message ||
        err.message ||
        "An error occurred during login"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "507009144784-f9g7dfdgd874kklfvfp75uek3n4rmjha.apps.googleusercontent.com"}>
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="w-full mb-4 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            width="350"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </GoogleOAuthProvider>
  )
}

