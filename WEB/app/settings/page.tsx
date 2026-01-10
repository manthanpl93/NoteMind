'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Brain } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { useApiKeys } from '../hooks/useApiKeys'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { apiKeys, isLoading, isSaving, error, updateKeys } = useApiKeys()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Checking authentication</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-600">
              Configure your API keys and preferences
            </p>
          </div>

          {/* API Keys Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">API Keys</h3>
              <p className="text-sm text-gray-600">
                Configure your API keys to use different AI models. Your keys are encrypted and stored securely on our servers.
              </p>
              {(isLoading || isSaving) && (
                <div className="mt-2 text-sm text-purple-600">
                  {isLoading ? 'Loading...' : 'Saving...'}
                </div>
              )}
              {error && (
                <div className="mt-2 text-sm text-red-600">
                  Error: {error}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* OpenAI API Key */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  OpenAI API Key
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  For GPT-4, GPT-4 Turbo, and GPT-3.5 Turbo models
                </p>
                <input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => {
                    updateKeys({ openai: e.target.value })
                  }}
                  placeholder="sk-..."
                  disabled={isLoading || isSaving}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Anthropic API Key */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Anthropic API Key
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  For Claude 3 Opus, Claude 3 Sonnet, and Claude 3 Haiku models
                </p>
                <input
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={(e) => {
                    updateKeys({ anthropic: e.target.value })
                  }}
                  placeholder="sk-ant-..."
                  disabled={isLoading || isSaving}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Google API Key */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Google AI API Key
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  For Gemini Pro and other Google AI models
                </p>
                <input
                  type="password"
                  value={apiKeys.google}
                  onChange={(e) => {
                    updateKeys({ google: e.target.value })
                  }}
                  placeholder="AIza..."
                  disabled={isLoading || isSaving}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-blue-900 mb-3">How to get API keys:</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-medium min-w-[100px]">OpenAI:</span>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 break-all">
                      platform.openai.com/api-keys
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium min-w-[100px]">Anthropic:</span>
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 break-all">
                      console.anthropic.com/settings/keys
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium min-w-[100px]">Google AI:</span>
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 break-all">
                      makersuite.google.com/app/apikey
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  )
}
