"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const REGIONS = ["India", "USA", "UK", "Germany", "Japan", "Australia", "Canada"]

interface ShareModalProps {
  open: boolean
  onClose: () => void
  file: {
    id: string
    filename: string
    allowed_users?: string[]
    start_time?: string
    end_time?: string
    allowed_regions?: string[]
  }
  onSuccess: () => void
}

export function ShareModal({ open, onClose, file, onSuccess }: ShareModalProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    allowedUsers: file.allowed_users?.join(", ") || "",
    startTime: file.start_time || "",
    endTime: file.end_time || "",
    regions: file.allowed_regions || [],
  })

  const toggleRegion = (region: string) => {
    setFormData((prev) => ({
      ...prev,
      regions: prev.regions.includes(region) ? prev.regions.filter((r) => r !== region) : [...prev.regions, region],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) return

    setIsLoading(true)

    try {
      await api.files.share(token, file.id, {
        allowed_users: formData.allowedUsers
          .split(",")
          .map((u) => u.trim())
          .filter((u) => u),
        start_time: formData.startTime || null,
        end_time: formData.endTime || null,
        allowed_regions: formData.regions,
      })

      toast({
        title: "Success",
        description: "File permissions updated successfully",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">Share & Manage Access</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current file info */}
          <div className="glass rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Filename</p>
            <p className="text-white font-medium">{file.filename}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Allowed users */}
            <div className="space-y-2">
              <Label htmlFor="share-users" className="text-white flex items-center gap-2">
                <Users className="h-4 w-4" />
                Allowed Users
              </Label>
              <Input
                id="share-users"
                value={formData.allowedUsers}
                onChange={(e) => setFormData({ ...formData, allowedUsers: e.target.value })}
                placeholder="user1, user2, user3"
                className="glass border-white/20 text-white placeholder:text-gray-500 bg-transparent"
              />
              <p className="text-gray-500 text-sm">Separate usernames with commas. Leave empty to allow all users.</p>
              {file.allowed_users && file.allowed_users.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {file.allowed_users.map((user) => (
                    <Badge key={user} variant="secondary" className="glass text-cyan-400 border-cyan-400/30">
                      {user}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Time window */}
            <div className="space-y-4">
              <Label className="text-white flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Access Time Window
              </Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="share-start" className="text-gray-400 text-sm">
                    Start Time
                  </Label>
                  <Input
                    id="share-start"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="glass border-white/20 text-white bg-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="share-end" className="text-gray-400 text-sm">
                    End Time
                  </Label>
                  <Input
                    id="share-end"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="glass border-white/20 text-white bg-transparent"
                  />
                </div>
              </div>
              <p className="text-gray-500 text-sm">
                Leave empty to allow access at any time. File will only be accessible within this time range.
              </p>
            </div>

            {/* Regions */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Allowed Regions
              </Label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggleRegion(region)}
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
              <p className="text-gray-500 text-sm">Select regions where file access is allowed. Leave empty for all.</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
