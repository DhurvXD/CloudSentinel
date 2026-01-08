"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Download, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DownloadModalProps {
  open: boolean
  onClose: () => void
  file: {
    id: string
    filename: string
  }
}

export function DownloadModal({ open, onClose, file }: DownloadModalProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!password) {
      setError("Password is required")
      return
    }

    if (!token) return

    setIsLoading(true)

    try {
      const blob = await api.files.download(token, file.id, password)

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.filename
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "File downloaded successfully",
      })

      onClose()
      setPassword("")
    } catch (error: any) {
      setError(error.message || "Invalid password or download failed")
      toast({
        title: "Download failed",
        description: error.message || "Invalid password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-strong border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">Download File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="glass rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Filename</p>
            <p className="text-white font-medium">{file.filename}</p>
          </div>

          <form onSubmit={handleDownload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decrypt-password" className="text-white">
                Decryption Password
              </Label>
              <div className="relative">
                <Input
                  id="decrypt-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter decryption password"
                  className="glass border-white/20 text-white placeholder:text-gray-500 pr-10 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 glass border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
