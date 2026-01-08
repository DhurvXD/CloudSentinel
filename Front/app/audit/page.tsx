"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { Shield, AlertCircle, CheckCircle2, XCircle, Clock, Download, Filter, Upload, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface AuditEvent {
  id: string
  type: string
  action: string
  description: string
  timestamp: string
  ip_address: string
  success: boolean
  user_id: string
}

interface SecurityReport {
  total_events: number
  successful_operations: number
  failed_operations: number
  access_denials: number
  failed_logins: number
}

export default function AuditPage() {
  const { token } = useAuth()
  const { toast } = useToast()

  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditEvent[]>([])
  const [report, setReport] = useState<SecurityReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterSuccess, setFilterSuccess] = useState<string>("all")

  useEffect(() => {
    fetchAuditData()
  }, [token])

  useEffect(() => {
    applyFilters()
  }, [auditLogs, filterType, filterSuccess])

  const fetchAuditData = async () => {
    if (!token) return

    try {
      const [logs, reportData] = await Promise.all([api.audit.me(token), api.audit.report(token)])

      setAuditLogs(logs)
      setFilteredLogs(logs)
      setReport(reportData)
    } catch (error) {
      console.error("[v0] Failed to fetch audit data:", error)
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...auditLogs]

    if (filterType !== "all") {
      filtered = filtered.filter((log) => log.type.toLowerCase() === filterType.toLowerCase())
    }

    if (filterSuccess === "success") {
      filtered = filtered.filter((log) => log.success)
    } else if (filterSuccess === "failed") {
      filtered = filtered.filter((log) => !log.success)
    }

    setFilteredLogs(filtered)
  }

  const downloadReport = () => {
    const reportContent = {
      generated_at: new Date().toISOString(),
      summary: report,
      events: filteredLogs,
    }

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `security-report-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Security report downloaded",
    })
  }

  const getEventIcon = (type: string, success: boolean) => {
    if (!success) return <XCircle className="h-5 w-5 text-red-400" />

    switch (type.toLowerCase()) {
      case "upload":
        return <Upload className="h-5 w-5 text-blue-400" />
      case "download":
        return <Download className="h-5 w-5 text-cyan-400" />
      case "delete":
        return <Trash2 className="h-5 w-5 text-pink-400" />
      case "access":
        return <Eye className="h-5 w-5 text-purple-400" />
      case "login":
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
      default:
        return <Shield className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/10 via-transparent to-transparent blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/10 via-transparent to-transparent blur-3xl" />
        </div>

        <DashboardNav />

        <main className="relative z-10 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Audit Logs</h1>
            <p className="text-gray-400">Monitor all security events and file activities</p>
          </div>

          {/* Security Report Cards */}
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-strong rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 w-12 h-12 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{report.total_events}</h3>
                <p className="text-gray-400 text-sm">Total Events</p>
              </div>

              <div className="glass-strong rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 w-12 h-12 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{report.successful_operations}</h3>
                <p className="text-gray-400 text-sm">Successful Operations</p>
              </div>

              <div className="glass-strong rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 w-12 h-12 rounded-lg flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{report.access_denials}</h3>
                <p className="text-gray-400 text-sm">Access Denials</p>
              </div>

              <div className="glass-strong rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 w-12 h-12 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{report.failed_logins}</h3>
                <p className="text-gray-400 text-sm">Failed Login Attempts</p>
              </div>
            </div>
          )}

          {/* Filters and Download */}
          <div className="glass-strong rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-white font-medium">Filters</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="glass border-white/20 text-white w-full sm:w-[180px] bg-transparent">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/20 text-white">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="upload">Upload</SelectItem>
                    <SelectItem value="download">Download</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSuccess} onValueChange={setFilterSuccess}>
                  <SelectTrigger className="glass border-white/20 text-white w-full sm:w-[180px] bg-transparent">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/20 text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={downloadReport}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-strong rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Event Timeline</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No events found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((event, index) => (
                  <div
                    key={event.id}
                    className="glass rounded-lg p-6 hover:bg-white/10 transition-all duration-300 relative"
                  >
                    {/* Timeline connector */}
                    {index < filteredLogs.length - 1 && (
                      <div className="absolute left-[45px] top-[70px] w-0.5 h-8 bg-white/10" />
                    )}

                    <div className="flex items-start gap-6">
                      {/* Icon */}
                      <div className="relative">
                        <div
                          className={`glass-strong rounded-lg p-3 ${
                            event.success ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20" : "bg-red-500/20"
                          }`}
                        >
                          {getEventIcon(event.type, event.success)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{event.action || event.type}</h3>
                            <p className="text-gray-400">{event.description}</p>
                          </div>
                          <Badge variant={event.success ? "default" : "destructive"} className="glass">
                            {event.success ? "Success" : "Failed"}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                          {event.ip_address && (
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              <span>IP: {event.ip_address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
