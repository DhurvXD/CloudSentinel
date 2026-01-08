"use client"

import Link from "next/link"
import { Shield, Lock, Clock, MapPin, FileCheck, Eye, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-3xl animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/20 via-transparent to-transparent blur-3xl animate-[float_25s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl animate-[float_30s_ease-in-out_infinite]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Shield className="h-8 w-8 text-primary animate-[glow_3s_ease-in-out_infinite]" />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              </div>
              <span className="text-xl font-bold gradient-text">CloudSentinel</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Animated shield icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 blur-3xl opacity-50 animate-[pulse_3s_ease-in-out_infinite]" />
            <div className="relative glass-strong rounded-full p-8 animate-[float_6s_ease-in-out_infinite]">
              <Shield className="h-20 w-20 text-primary" strokeWidth={1.5} />
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold text-balance">
              <span className="gradient-text">CloudSentinel</span>
              <br />
              <span className="text-white">Zero-Trust File Security</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 text-pretty max-w-2xl mx-auto">
              Military-grade encryption. Complete access control. Total peace of mind.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 text-lg px-8 h-14 group"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="glass-strong text-white hover:bg-white/20 border-white/20 text-lg px-8 h-14 bg-transparent"
            >
              Learn More
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span>AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-400" />
              <span>Zero-Trust Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-green-400" />
              <span>Compliance Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Enterprise-Grade Security Features</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Protect your sensitive data with advanced encryption and intelligent access controls
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Card 1 */}
          <div className="glass-strong rounded-xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer">
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock className="h-7 w-7 text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">AES-256 Encryption</h3>
            <p className="text-gray-400 leading-relaxed">
              Military-grade encryption ensures your files are protected with the highest security standards. Every file
              is encrypted before upload.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="glass-strong rounded-xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="h-7 w-7 text-blue-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Zero-Trust Access Control</h3>
            <p className="text-gray-400 leading-relaxed">
              Granular permissions ensure only authorized users can access your files. Never trust, always verify every
              request.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="glass-strong rounded-xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer">
            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Clock className="h-7 w-7 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Time-Based Access</h3>
            <p className="text-gray-400 leading-relaxed">
              Set specific time windows for file access. Automatically restrict access outside designated hours for
              enhanced security.
            </p>
          </div>

          {/* Feature Card 4 */}
          <div className="glass-strong rounded-xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer">
            <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MapPin className="h-7 w-7 text-pink-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Location-Based Security</h3>
            <p className="text-gray-400 leading-relaxed">
              Restrict file access based on geographic location. Ensure files are only accessible from approved regions
              worldwide.
            </p>
          </div>

          {/* Feature Card 5 */}
          <div className="glass-strong rounded-xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Eye className="h-7 w-7 text-green-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Complete Audit Logs</h3>
            <p className="text-gray-400 leading-relaxed">
              Track every file access and action with comprehensive audit trails. Full visibility into who accessed what
              and when.
            </p>
          </div>

          {/* Feature Card 6 */}
          <div className="glass-strong rounded-xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer">
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="h-7 w-7 text-orange-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Real-Time Monitoring</h3>
            <p className="text-gray-400 leading-relaxed">
              Monitor file activity in real-time with instant alerts. Detect and respond to potential security threats
              immediately.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="glass-strong rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to Secure Your Files?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of organizations protecting their sensitive data with CloudSentinel
            </p>
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 text-lg px-12 h-16 group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-sm py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold gradient-text">CloudSentinel</span>
            </div>
            <p className="text-gray-400 text-sm">© 2025 CloudSentinel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
