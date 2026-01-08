"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Shield, LayoutDashboard, FolderOpen, Upload, FileText, LogOut, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/files", label: "My Files", icon: FolderOpen },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/audit", label: "Audit Logs", icon: FileText },
  ]

  return (
    <nav className="border-b border-white/10 backdrop-blur-sm glass sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative">
              <Shield className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
            <span className="text-xl font-bold gradient-text">CloudSentinel</span>
          </Link>

          {/* Nav items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className={`text-white hover:bg-white/10 ${isActive ? "bg-white/10" : ""}`}>
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="glass hover:bg-white/10">
                <User className="h-5 w-5 mr-2 text-white" />
                <span className="text-white">{user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-strong border-white/20 text-white" align="end">
              <DropdownMenuLabel className="text-gray-300">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="md:hidden hover:bg-white/10">
                <Link href="/dashboard" className="flex items-center w-full">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden hover:bg-white/10">
                <Link href="/files" className="flex items-center w-full">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  My Files
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden hover:bg-white/10">
                <Link href="/upload" className="flex items-center w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden hover:bg-white/10">
                <Link href="/audit" className="flex items-center w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Audit Logs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10 md:hidden" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
