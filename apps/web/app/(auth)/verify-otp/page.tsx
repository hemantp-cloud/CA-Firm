"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import api from "@/lib/api"
import { maskEmail } from "@/lib/utils"

export default function VerifyOtpPage() {
  const router = useRouter()
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [email, setEmail] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Get email and dev OTP from sessionStorage
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("otpEmail")
      const storedDevOtp = sessionStorage.getItem("devOtp")
      if (!storedEmail) {
        router.push("/login")
        return
      }
      setEmail(storedEmail)
      if (storedDevOtp) {
        setDevOtp(storedDevOtp)
        // Clear dev OTP after displaying (one-time use)
        sessionStorage.removeItem("devOtp")
      }
    }
  }, [router])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    // Start countdown timer
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  useEffect(() => {
    // Auto-submit when all 6 digits are entered
    const otpValue = otp.join("")
    if (otpValue.length === 6 && !isLoading && otp.every((digit) => digit !== "")) {
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp.join("")])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").trim()

    // Only accept 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("")
      const newOtp = [...otp]
      digits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit
        }
      })
      setOtp(newOtp)
      setError(null)

      // Focus last input
      inputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = async () => {
    const otpValue = otp.join("")

    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    if (!email) {
      setError("Email not found. Please login again.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("Verifying OTP for:", email, "OTP:", otpValue) // Debug log
      const response = await api.post("/auth/verify-otp", {
        email,
        otp: otpValue,
      })

      if (response.data.success) {
        const { token, user, redirectUrl } = response.data.data

        // Store token in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token)
          sessionStorage.removeItem("otpEmail")
          sessionStorage.removeItem("devOtp")
        }

        // Establish NextAuth session using token (OTP-verified login)
        const result = await signIn("credentials", {
          email,
          password: "", // Not used for token-based auth
          token: token, // Pass token for OTP-verified login
          redirect: false,
        })

        if (result?.ok) {
          router.push(redirectUrl || "/")
          router.refresh()
        } else {
          // If NextAuth fails, still redirect with token
          router.push(redirectUrl || "/")
          router.refresh()
        }
      } else {
        setError(response.data.message || "Invalid OTP")
        // Clear inputs on error
        setOtp(Array(6).fill(""))
        inputRefs.current[0]?.focus()
      }
    } catch (err: any) {
      console.error("OTP verification error:", err)
      setError(
        err.response?.data?.message ||
        err.message ||
        "Invalid OTP. Please try again."
      )
      // Clear inputs on error
      setOtp(Array(6).fill(""))
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post("/auth/resend-otp", {
        email,
      })

      if (response.data.success) {
        setResendCountdown(60)
        setOtp(Array(6).fill(""))
        inputRefs.current[0]?.focus()
        // Store dev OTP if available (development mode)
        if (response.data.devOtp && typeof window !== "undefined") {
          setDevOtp(response.data.devOtp)
          sessionStorage.setItem("devOtp", response.data.devOtp)
        }
      } else {
        setError(response.data.message || "Failed to resend OTP")
      }
    } catch (err: any) {
      console.error("Resend OTP error:", err)
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to resend OTP"
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) {
    return null // Will redirect
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verify your email
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Code sent to {maskEmail(email)}
        </p>
        {/* Development Mode OTP Display */}
        {devOtp && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              🔐 Development Mode - Your OTP:
            </p>
            <p className="text-2xl font-mono font-bold text-yellow-900 dark:text-yellow-100 text-center">
              {devOtp}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 text-center">
              In production, this will only be sent via email.
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* OTP Input Boxes */}
      <div className="mb-6">
        <div className="flex gap-2 justify-center">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-14 h-14 text-center text-2xl font-semibold"
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Resend OTP */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Didn't receive the code?
        </p>
        <Button
          type="button"
          variant="link"
          onClick={handleResendOtp}
          disabled={resendCountdown > 0 || isLoading}
          className="text-blue-600 dark:text-blue-400"
        >
          {resendCountdown > 0
            ? `Resend code in ${resendCountdown}s`
            : "Resend code"}
        </Button>
      </div>

      {/* Back to Login */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  )
}

