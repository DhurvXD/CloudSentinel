"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import {
  File,
  FileText,
  ImageIcon,
  Video,
  Music,
  Download,
  Share2,
  Trash2,
  Search,
  Clock,
  MapPin,
  Lock,
  Unlock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { DownloadModal } from "@/components/download-modal"
import { ShareModal } from "@/components/share-modal"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

interface FileItem {
  id: string
  filename: string
  size: number
  owner: string
  owner_id: string
  uploaded_at: string
  allowed_users: string[]
  start_time?: string
  end_time?: string
  allowed_regions: string[]
}

export default function FilesPage() {
  const { token, user } = useAuth()
  const { toast } = useToast()

  const [myFiles, setMyFiles] = useState<FileItem[]>([])
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [token])

  const fetchFiles = async () => {
    if (!token) return

    try {
      const [allFiles, ownedFiles] = await Promise.all([api.files.list(token), api.files.myFiles(token)])

      setMyFiles(ownedFiles)
      setSharedFiles(allFiles.filter((file: FileItem) => file.owner_id !== user?.id))
    } catch (error) {
      console.error("[v0] Failed to fetch files:", error)
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()

    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) {
      return <ImageIcon className="h-6 w-6 text-cyan-400" />
    }
    if (["mp4", "avi", "mov", "mkv"].includes(ext || "")) {
      return <Video className="h-6 w-6 text-pink-400" />
    }
    if (["mp3", "wav", "ogg", "flac"].includes(ext || "")) {
      return <Music className="h-6 w-6 text-purple-400" />
    }
    if (["pdf", "doc", "docx", "txt"].includes(ext || "")) {
      return <FileText className="h-6 w-6 text-blue-400" />
    }
    return <File className="h-6 w-6 text-gray-400" />
  }

  const isAccessible = (file: FileItem) => {
    const now = new Date()

    if (file.start_time && file.end_time) {
      const start = new Date(file.start_time)
      const end = new Date(file.end_time)
      return now >= start && now <= end
    }

    return true
  }

  const handleDelete = async () => {
    if (!token || !selectedFile) return

    try {
      await api.files.delete(token, selectedFile.id)
      toast({
        title: "Success",
        description: "File deleted successfully",
      })
      fetchFiles()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedFile(null)
    }
  }

  const filterFiles = (files: FileItem[]) => {
    return files.filter((file) => file.filename.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const FileCard = ({ file, showOwner = false }: { file: FileItem; showOwner?: boolean }) => {
    const accessible = isAccessible(file)

    return (
      <div className="glass-strong rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center">
              {getFileIcon(file.filename)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{file.filename}</h3>
              <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <div className="text-gray-400">
            {accessible ? <Unlock className="h-5 w-5 text-green-400" /> : <Lock className="h-5 w-5 text-red-400" />}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {showOwner && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Owner: {file.owner}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
          </div>
          {file.allowed_regions?.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {file.allowed_regions.map((region) => (
                  <Badge key={region} variant="secondary" className="glass text-cyan-400 border-cyan-400/30">
                    {region}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <Badge variant={accessible ? "default" : "destructive"} className="glass">
            {accessible ? "Accessible Now" : "Restricted"}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedFile(file)
              setDownloadModalOpen(true)
            }}
            className="flex-1 glass border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {file.owner_id === user?.id && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedFile(file)
                  setShareModalOpen(true)
                }}
                className="glass border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedFile(file)
                  setDeleteDialogOpen(true)
                }}
                className="glass border-white/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    )
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
            <h1 className="text-4xl font-bold text-white mb-2">My Files</h1>
            <p className="text-gray-400">Browse and manage your encrypted files</p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass border-white/20 text-white placeholder:text-gray-500 pl-10 bg-transparent"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="owned" className="space-y-6">
            <TabsList className="glass border-white/20 bg-transparent">
              <TabsTrigger
                value="owned"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600"
              >
                Files I Own ({myFiles.length})
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600"
              >
                Shared With Me ({sharedFiles.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="owned">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : filterFiles(myFiles).length === 0 ? (
                <div className="glass-strong rounded-xl p-12 text-center">
                  <File className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No files found</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterFiles(myFiles).map((file) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : filterFiles(sharedFiles).length === 0 ? (
                <div className="glass-strong rounded-xl p-12 text-center">
                  <Share2 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No shared files</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterFiles(sharedFiles).map((file) => (
                    <FileCard key={file.id} file={file} showOwner />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Modals */}
      {selectedFile && (
        <>
          <DownloadModal
            open={downloadModalOpen}
            onClose={() => {
              setDownloadModalOpen(false)
              setSelectedFile(null)
            }}
            file={selectedFile}
          />
          <ShareModal
            open={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false)
              setSelectedFile(null)
            }}
            file={selectedFile}
            onSuccess={fetchFiles}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false)
              setSelectedFile(null)
            }}
            onConfirm={handleDelete}
            filename={selectedFile.filename}
          />
        </>
      )}
    </ProtectedRoute>
  )
}
