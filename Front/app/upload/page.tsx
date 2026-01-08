"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { Upload, File, X, CheckCircle2, Loader2, Eye, EyeOff, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const REGIONS = ["India", "USA", "UK", "Germany", "Japan", "Australia", "Canada"]

export default function UploadPage() {
  const { token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    password: "",
    allowedUsers: "",
    startTime: "",
    endTime: "",
    regions: [] as string[],
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const toggleRegion = (region: string) => {
    setFormData((prev) => ({
      ...prev,
      regions: prev.regions.includes(region) ? prev.regions.filter((r) => r !== region) : [...prev.regions, region],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile || !token) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      })
      return
    }

    if (!formData.password) {
      toast({
        title: "Error",
        description: "Encryption password is required",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("file", selectedFile)
      formDataToSend.append("password", formData.password)
      formDataToSend.append("allowed_users", formData.allowedUsers)
      formDataToSend.append("start_time", formData.startTime)
      formDataToSend.append("end_time", formData.endTime)
      formDataToSend.append("allowed_regions", formData.regions.join(","))

      await api.files.upload(token, formDataToSend)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setIsSuccess(true)

      toast({
        title: "Success!",
        description: "File uploaded and encrypted successfully",
      })

      setTimeout(() => {
        router.push("/files")
      }, 2000)
    } catch (error: any) {
      clearInterval(progressInterval)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/10 via-transparent to-transparent blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/10 via-transparent to-transparent blur-3xl" />
        </div>

        <DashboardNav />

        <main className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Upload File</h1>
            <p className="text-gray-400">Encrypt and securely upload your files with access controls</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File upload area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`glass-strong rounded-xl p-12 border-2 border-dashed transition-all duration-300 ${
                isDragging ? "border-primary bg-primary/10" : "border-white/20 hover:border-white/40"
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center">
                      <File className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-gray-400 text-sm">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your file here</h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    disabled={isUploading}
                  />
                  <label htmlFor="file-input">
                    <Button
                      type="button"
                      variant="outline"
                      className="glass border-white/20 text-white bg-transparent"
                      asChild
                    >
                      <span>Select File</span>
                    </Button>
                  </label>
                </div>
              )}
            </div>

            {/* Upload form */}
            {selectedFile && (
              <div className="glass-strong rounded-xl p-6 space-y-6">
                {/* Encryption password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Encryption Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter encryption password"
                      className="glass border-white/20 text-white placeholder:text-gray-500 pr-10 bg-transparent"
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Allowed users */}
                <div className="space-y-2">
                  <Label htmlFor="allowedUsers" className="text-white">
                    Allowed Users (comma separated)
                  </Label>
                  <Input
                    id="allowedUsers"
                    value={formData.allowedUsers}
                    onChange={(e) => setFormData({ ...formData, allowedUsers: e.target.value })}
                    placeholder="user1, user2, user3"
                    className="glass border-white/20 text-white placeholder:text-gray-500 bg-transparent"
                    disabled={isUploading}
                  />
                </div>

                {/* Time window */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-white flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="glass border-white/20 text-white bg-transparent"
                      disabled={isUploading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-white flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="glass border-white/20 text-white bg-transparent"
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {/* Regions */}
                <div className="space-y-2">
                  <Label className="text-white">Allowed Regions</Label>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map((region) => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => toggleRegion(region)}
                        disabled={isUploading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.regions.includes(region)
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            : "glass border border-white/20 text-gray-400 hover:text-white"
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Uploading...</span>
                      <span className="text-white font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isUploading || isSuccess}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 h-12"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Encrypting and uploading...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Upload complete!
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </main>
      </div>
    </ProtectedRoute>
  )
}
