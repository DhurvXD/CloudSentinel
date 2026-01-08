"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { FileUp, FolderOpen, Share2, HardDrive, Upload, Eye, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"

interface Stats {
  totalFiles: number
  uploadedFiles: number
  sharedFiles: number
  storageUsed: string
}

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
  success: boolean
}

export default function DashboardPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    uploadedFiles: 0,
    sharedFiles: 0,
    storageUsed: "0 MB",
  })
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return

      try {
        // Fetch files
        const [allFiles, myFiles] = await Promise.all([api.files.list(token), api.files.myFiles(token)])

        // Calculate stats
        const totalSize = myFiles.reduce((acc: number, file: any) => acc + (file.size || 0), 0)
        const sharedCount = allFiles.filter((file: any) => file.owner_id !== file.id).length

        setStats({
          totalFiles: allFiles.length,
          uploadedFiles: myFiles.length,
          sharedFiles: sharedCount,
          storageUsed: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
        })

        // Fetch recent activity
        const auditData = await api.audit.me(token)
        setRecentActivity(auditData.slice(0, 5))
      } catch (error) {
        console.error("[v0] Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [token])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/10 via-transparent to-transparent blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/10 via-transparent to-transparent blur-3xl" />
        </div>

        <DashboardNav />

        <main className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back! Here's your security overview.</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Files */}
            <div className="glass-strong rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderOpen className="h-6 w-6 text-purple-400" />
                </div>
                <Eye className="h-5 w-5 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{isLoading ? "..." : stats.totalFiles}</h3>
              <p className="text-gray-400 text-sm">Total Files</p>
            </div>

            {/* Uploaded Files */}
            <div className="glass-strong rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileUp className="h-6 w-6 text-blue-400" />
                </div>
                <Upload className="h-5 w-5 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{isLoading ? "..." : stats.uploadedFiles}</h3>
              <p className="text-gray-400 text-sm">Uploaded Files</p>
            </div>

            {/* Shared Files */}
            <div className="glass-strong rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="h-6 w-6 text-cyan-400" />
                </div>
                <Share2 className="h-5 w-5 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{isLoading ? "..." : stats.sharedFiles}</h3>
              <p className="text-gray-400 text-sm">Shared Files</p>
            </div>

            {/* Storage Used */}
            <div className="glass-strong rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <HardDrive className="h-6 w-6 text-pink-400" />
                </div>
                <HardDrive className="h-5 w-5 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{isLoading ? "..." : stats.storageUsed}</h3>
              <p className="text-gray-400 text-sm">Storage Used</p>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 glass-strong rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const icon = activity.success ? CheckCircle2 : XCircle
                    const iconColor = activity.success ? "text-green-400" : "text-red-400"
                    const Icon = icon

                    return (
                      <div key={activity.id} className="glass rounded-lg p-4 hover:bg-white/10 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 ${iconColor}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{activity.type}</p>
                            <p className="text-gray-400 text-sm mt-1">{activity.description}</p>
                            <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass-strong rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>

              <div className="space-y-4">
                <Link href="/upload">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 justify-start h-auto py-4">
                    <div className="bg-white/20 rounded-lg p-2 mr-3">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Upload New File</div>
                      <div className="text-xs opacity-80">Encrypt and upload securely</div>
                    </div>
                  </Button>
                </Link>

                <Link href="/files">
                  <Button
                    variant="outline"
                    className="w-full glass border-white/20 text-white hover:bg-white/10 justify-start h-auto py-4 bg-transparent"
                  >
                    <div className="bg-white/10 rounded-lg p-2 mr-3">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">View All Files</div>
                      <div className="text-xs opacity-70">Browse your secure files</div>
                    </div>
                  </Button>
                </Link>

                <Link href="/audit">
                  <Button
                    variant="outline"
                    className="w-full glass border-white/20 text-white hover:bg-white/10 justify-start h-auto py-4 bg-transparent"
                  >
                    <div className="bg-white/10 rounded-lg p-2 mr-3">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Audit Logs</div>
                      <div className="text-xs opacity-70">View security events</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
