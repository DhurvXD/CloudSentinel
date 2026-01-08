"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  filename: string
}

export function DeleteConfirmDialog({ open, onClose, onConfirm, filename }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="glass-strong border-white/20 text-white">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-500/20 rounded-lg p-2">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-white">Delete File</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-400">
            Are you sure you want to delete <span className="text-white font-semibold">"{filename}"</span>? This action
            cannot be undone and the file will be permanently removed from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="glass border-white/20 text-white hover:bg-white/10 bg-transparent">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
          >
            Delete File
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
