"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const { login: authLogin } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const validateForm = () => {
    const newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    }

    if (!formData.username) {
      newErrors.username = "Username is required"
    }

    if (mode === "register") {
      if (!formData.email) {
        newErrors.email = "Email is required"
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid"
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (mode === "register" && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (mode === "register") {
        await api.auth.register(formData.username, formData.email, formData.password)
        setIsSuccess(true)
        setTimeout(() => {
          setMode("login")
          setIsSuccess(false)
        }, 1500)
        toast({
          title: "Success",
          description: "Account created successfully! Please login.",
        })
      } else {
        const response = await api.auth.login(formData.username, formData.password)
        authLogin(response.token, response.user)
        setIsSuccess(true)
        toast({
          title: "Welcome back!",
          description: "Login successful",
        })
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login")
    setErrors({ username: "", email: "", password: "", confirmPassword: "" })
    setFormData({ username: "", email: "", password: "", confirmPassword: "" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-3xl animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/20 via-transparent to-transparent blur-3xl animate-[float_25s_ease-in-out_infinite]" />
      </div>

      {/* Back to home */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="ghost" className="text-white hover:bg-white/10">
            ← Back to Home
          </Button>
        </Link>
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 md:p-10">
          {/* Logo and title */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Shield className="h-12 w-12 text-primary animate-[glow_3s_ease-in-out_infinite]" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">CloudSentinel</h1>
            <p className="text-gray-400 text-center">
              {mode === "login" ? "Welcome back! Sign in to your account" : "Create your secure account"}
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex gap-2 mb-8 glass rounded-lg p-1">
            <button
              onClick={() => mode === "register" && toggleMode()}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 ${
                mode === "login"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => mode === "login" && toggleMode()}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 ${
                mode === "register"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="glass border-white/20 text-white placeholder:text-gray-500 focus:border-primary transition-colors bg-transparent"
                placeholder="Enter your username"
              />
              {errors.username && <p className="text-red-400 text-sm">{errors.username}</p>}
            </div>

            {/* Email (register only) */}
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="glass border-white/20 text-white placeholder:text-gray-500 focus:border-primary transition-colors bg-transparent"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="glass border-white/20 text-white placeholder:text-gray-500 focus:border-primary transition-colors pr-10 bg-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
            </div>

            {/* Confirm Password (register only) */}
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="glass border-white/20 text-white placeholder:text-gray-500 focus:border-primary transition-colors pr-10 bg-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Success!
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
