'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { Brain, Sparkles, BookOpen, Zap, Lock, Cloud, Loader2 } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render landing page if authenticated (redirect will happen)
  if (status === 'authenticated') {
    return null
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                NoteMind
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="#features" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </Link>
              <Link 
                href="/login" 
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Intelligent Note Taking, Reimagined</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your Second Brain
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Capture thoughts, organize ideas, and never forget important information. 
            NoteMind uses intelligent features to help you think better.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link 
              href="/login"
              className="px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <a 
              href="#features"
              className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg shadow-md border border-gray-200"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Image Placeholder */}
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 p-8 shadow-2xl">
          <div className="bg-white rounded-xl shadow-lg p-6 h-96 flex items-center justify-center">
            <div className="text-center">
              <Brain className="h-24 w-24 text-purple-600 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Beautiful Note Interface</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600">Everything you need to organize your thoughts</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Brain className="h-8 w-8" />}
            title="Smart Organization"
            description="Automatically categorize and tag your notes with AI-powered insights."
          />
          <FeatureCard
            icon={<Sparkles className="h-8 w-8" />}
            title="Intelligent Search"
            description="Find anything instantly with semantic search that understands context."
          />
          <FeatureCard
            icon={<BookOpen className="h-8 w-8" />}
            title="Rich Text Editor"
            description="Beautiful markdown support with real-time preview and formatting."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Lightning Fast"
            description="Instant sync and blazing fast performance across all your devices."
          />
          <FeatureCard
            icon={<Lock className="h-8 w-8" />}
            title="Privacy First"
            description="Your notes are encrypted and secure. Your data belongs to you."
          />
          <FeatureCard
            icon={<Cloud className="h-8 w-8" />}
            title="Cloud Sync"
            description="Access your notes anywhere, anytime, on any device seamlessly."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who are already thinking better with NoteMind
          </p>
          <Link 
            href="/login"
            className="inline-block px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg shadow-lg"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <span className="text-lg font-bold text-gray-900">NoteMind</span>
            </div>
            <p className="text-gray-600">© 2025 NoteMind. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

