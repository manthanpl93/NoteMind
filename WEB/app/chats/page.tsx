'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useFolders } from '../hooks/useFolders'
import { useConversations } from '../hooks/useConversations'
import { useOpenTabs } from '../hooks/useOpenTabs'
import { useModels } from '../hooks/useModels'
import { foldersApi } from '@/lib/api/folders'
import { conversationsApi } from '@/lib/api'
import type { Folder, Conversation, Message } from '@/lib/api/types'

// Format timestamp to Indian timezone with proper date and time
const formatIndianDateTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return timestamp // Return original if invalid
    }
    
    // Format in Indian timezone (Asia/Kolkata)
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true // 12-hour format with AM/PM
    }
    
    return date.toLocaleString('en-IN', options)
  } catch (error) {
    return timestamp // Return original on error
  }
}

// Format date only (for chat list)
const formatIndianDate = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    
    if (isNaN(date.getTime())) {
      return timestamp
    }
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
    
    return date.toLocaleDateString('en-IN', options)
  } catch (error) {
    return timestamp
  }
}
import {
  Brain,
  Plus,
  MessageSquare,
  Folder,
  ChevronRight,
  X,
  FolderPlus
} from 'lucide-react'
import { ChatComponent } from '../components/Chat'
import { AppLayout } from '../components/AppLayout'
import { Dialog } from '../components/Dialog'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  mode?: 'note-taking' | 'ask' | 'explore'
}

interface Chat {
  id: string
  title: string
  provider: 'openai' | 'anthropic' | 'google'
  model_name: string
  message_count: number
  total_tokens_used: number
  folder_id: string | null
  created_at: string
  updated_at: string
  messages?: ChatMessage[] // Optional for compatibility
}

interface ChatFolder {
  id: string
  name: string
  created_at: string
  updated_at: string
  chats: Chat[] // For compatibility, keeping chats array but will be empty
}

export default function ChatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Folder-related state
  const [activeChatFolder, setActiveChatFolder] = useState<string | null>(null)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Model selection state
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4')

  // API hooks for data
  const { folders, loading: foldersLoading, error: foldersError, refetch: refetchFolders } = useFolders()
  const { conversations: unorganizedChats, loading: chatsLoading, error: chatsError, refetch: refetchUnorganizedChats } = useConversations('null')

  // Hook for folder conversations (loaded when viewing a folder)
  const { conversations: folderChats, loading: folderChatsLoading, refetch: refetchFolderChats } = useConversations(
    activeChatFolder || undefined
  )

  // New hooks for tab management and models
  const {
    openTabs,
    activeTabId,
    openConversation,
    closeTab,
    switchTab,
    createNewConversation,
    clearActiveTab,
    updateConversationAfterMessage,
    updateTabTitle,
    updateTabConversationId,
    addConversationToCache,
    getActiveConversation,
    refreshConversation
  } = useOpenTabs()

  const { models: availableModels, loading: modelsLoading } = useModels()

  // API helper functions that update hook cache
  const handleSwitchModel = async (conversationId: string, model: string) => {
    const response = await conversationsApi.switchModel(conversationId, model)
    // Hook will update its cache automatically when needed
  }

  const handleSendMessage = async (conversationId: string, content: string) => {
    // Add the user message to cache optimistically
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      tokens_used: Math.floor(content.length / 4) // Rough estimate
    }
    // Note: ID will be assigned by backend, but for frontend we can use a temp ID
    userMessage.id = `temp-${Date.now()}`
    updateConversationAfterMessage(conversationId, userMessage, {})

    // Send to API to get AI response
    const response = await conversationsApi.sendMessage(conversationId, content)
    updateConversationAfterMessage(conversationId, response.message, response.conversation)
  }

  const handleCreateConversation = async (model: string, firstMessage: string): Promise<string> => {
    if (!activeTabId) throw new Error('No active tab')

    const response = await conversationsApi.create({
      provider: availableModels.find(m => m.id === model)?.provider as any || 'openai',
      model_name: model,
      first_message: firstMessage,
      folder_id: activeChatFolder || null
    })

    // Update tab with real conversation ID and title
    updateTabConversationId(activeTabId, response.id)
    updateTabTitle(activeTabId, response.title)

    // Add the conversation to the cache with both user and AI messages
    addConversationToCache({
      ...response,
      messages: response.messages // Include both messages from creation
    })

    // Refresh the conversations list to show the new conversation
    if (activeChatFolder) {
      // If in a folder, refresh folder conversations
      refetchFolderChats()
    } else {
      // If not in a folder, refresh unorganized conversations
      refetchUnorganizedChats()
    }

    return response.id
  }

  // Transform folders to match existing component interface
  const chatFolders: ChatFolder[] = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    created_at: folder.created_at,
    updated_at: folder.updated_at,
    chats: [] // Will be populated when folder is opened
  }))

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Keyboard shortcuts for tab management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T or Cmd+T: New chat tab
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        createNewConversation()
      }

      // Ctrl+W or Cmd+W: Close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w' && activeTabId) {
        e.preventDefault()
        closeTab(activeTabId)
      }

      // Ctrl+Tab: Switch to next tab
      if (e.ctrlKey && e.key === 'Tab' && openTabs.length > 0) {
        e.preventDefault()
        const currentIndex = openTabs.findIndex(tab => tab.id === activeTabId)
        const nextIndex = (currentIndex + 1) % openTabs.length
        switchTab(openTabs[nextIndex].id)
      }

      // Ctrl+Shift+Tab: Switch to previous tab
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab' && openTabs.length > 0) {
        e.preventDefault()
        const currentIndex = openTabs.findIndex(tab => tab.id === activeTabId)
        const prevIndex = (currentIndex - 1 + openTabs.length) % openTabs.length
        switchTab(openTabs[prevIndex].id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabId, openTabs, createNewConversation, closeTab, switchTab])

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

  // Tab management functions
  const handleOpenChatTab = (chatId: string) => {
    openConversation(chatId)
  }

  const handleBackToChats = () => {
    // Clear active tab but preserve all tabs and cache
    clearActiveTab()
  }

  // handleMoveChatToFolder removed - moving chats not in scope

  const handleCreateChatFolder = async (folderName: string) => {
    try {
      await foldersApi.create(folderName)
      // Refresh folders list to show the new folder
      refetchFolders()
    } catch (error) {
      // TODO: Show error message to user
    }
  }

  const handleSubmitFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFolderName.trim()) {
      handleCreateChatFolder(newFolderName.trim())
      setIsCreatingFolder(false)
      setNewFolderName('')
    }
  }

  // If there are open tabs AND an active tab, show chat interface
  if (openTabs.length > 0 && activeTabId) {
    return (
      <AppLayout>
        <div className="flex flex-col flex-1 bg-gray-50">
          {/* Tab Bar */}
          <div className="border-b border-gray-200 bg-white overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="flex items-center gap-1 py-2 px-2">
            {/* Back Button */}
            <button
              onClick={handleBackToChats}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mr-1"
              title="Back to Chats"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 rotate-180" />
            </button>

            {/* Chat Tabs */}
            {openTabs.map((tab) => {
              const isActive = tab.id === activeTabId

              return (
                <div
                  key={tab.id}
                  title={tab.title}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2 transition-all cursor-pointer min-w-[160px] max-w-[220px] flex-shrink-0 ${
                    isActive
                      ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm'
                      : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <button
                    onClick={() => switchTab(tab.id)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {tab.title}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className={`p-0.5 rounded hover:bg-gray-200 transition-all flex-shrink-0 ${
                      isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70 group-hover:hover:opacity-100'
                    }`}
                    title="Close tab"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}

            {/* Add New Tab Button - Inline with tabs */}
            <button
              onClick={createNewConversation}
              className="p-2 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0 text-purple-600 hover:text-purple-700"
              title="New chat tab (Ctrl+T)"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Active Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ChatComponent
            activeChat={activeTabId ? openTabs.find(t => t.id === activeTabId)?.conversationId || null : null}
            activeConversation={getActiveConversation()}
            selectedModel={selectedModel}
            availableModels={availableModels}
            activeTabId={activeTabId}
            onSetSelectedModel={setSelectedModel}
            onSwitchModel={handleSwitchModel}
            onSendMessage={handleSendMessage}
            onCreateConversation={handleCreateConversation}
            onUpdateTabTitle={updateTabTitle}
          />
        </div>
        </div>
      </AppLayout>
    )
  }

  // Chats Overview
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
          {activeChatFolder ? (
            // Inside a folder - show chats within the folder
            (() => {
              const folder = chatFolders.find(f => f.id === activeChatFolder)
              if (!folder) return null
              
              return (
                <>
                  {/* Back button and folder header */}
                  <div className="mb-6">
                    <button
                      onClick={() => setActiveChatFolder(null)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-700 mb-3 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      Back to all folders
                    </button>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Folder className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{folder.name}</h2>
                          <p className="text-sm text-gray-600">{folderChats.length} chat{folderChats.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <button
                        onClick={createNewConversation}
                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New Chat
                      </button>
                    </div>
                  </div>

                  {/* Chats in this folder */}
                  {folderChatsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-gray-200 h-12 rounded-lg" />
                      ))}
                    </div>
                  ) : folderChats.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                      {folderChats
                        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                        .map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => handleOpenChatTab(chat.id)}
                          className="w-full group flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 transition-all text-left"
                        >
                          <MessageSquare className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                              {chat.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-500">{formatIndianDate(chat.updated_at)}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{chat.message_count} msg{chat.message_count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                      <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No chats in this folder</h3>
                      <p className="text-xs text-gray-600">Move chats to this folder to organize them</p>
                    </div>
                  )}
                </>
              )
            })()
          ) : (
            // Main view - show all folders and unorganized chats
            <>
              {/* Header with action buttons */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">All Chats</h2>
                  <p className="text-sm text-gray-600">
                    Manage and organize your conversations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreatingFolder(true)}
                    className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium inline-flex items-center gap-1.5"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    New Folder
                      </button>
                      <button
                        onClick={createNewConversation}
                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New Chat
                      </button>
                    </div>
                  </div>

              {/* New Folder Dialog */}
              <Dialog
                open={isCreatingFolder}
                onClose={() => {
                  setIsCreatingFolder(false)
                  setNewFolderName('')
                }}
                title="Create New Folder"
              >
                <form onSubmit={handleSubmitFolder} className="space-y-4">
                  <div>
                    <label htmlFor="folder-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Folder Name
                    </label>
                    <input
                      id="folder-name"
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="e.g., Work, Personal, Projects..."
                      autoFocus
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingFolder(false)
                        setNewFolderName('')
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newFolderName.trim()}
                      className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Folder
                    </button>
                  </div>
                </form>
              </Dialog>

              {/* Chat Folders */}
              {foldersLoading ? (
                <div className="mb-6">
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : foldersError ? (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">Failed to load folders</p>
                  <button
                    onClick={refetchFolders}
                    className="text-red-600 text-sm font-medium mt-2"
                  >
                    Retry
                  </button>
                </div>
              ) : chatFolders.length > 0 ? (
                <div className="mb-6">
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                    {chatFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setActiveChatFolder(folder.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 flex items-center justify-center flex-shrink-0 transition-colors">
                            <Folder className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 truncate transition-colors">{folder.name}</h4>
                            <p className="text-xs text-gray-500">Click to view conversations</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Regular Chats (not in folders) */}
              {chatsLoading ? (
                <div>
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : chatsError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">Failed to load conversations</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-red-600 text-sm font-medium mt-2"
                  >
                    Retry
                  </button>
                </div>
              ) : unorganizedChats.length > 0 ? (
                <div>
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                    {unorganizedChats
                      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                      .map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleOpenChatTab(chat.id)}
                        className="w-full group flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-all text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors flex-shrink-0">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                            {chat.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-500">{formatIndianDate(chat.updated_at)}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{chat.message_count} message{chat.message_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Empty State */}
              {chatFolders.length === 0 && unorganizedChats.length === 0 && (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No Chats Yet</h3>
                  <p className="text-sm text-gray-600 mb-4">Start a new conversation to get started</p>
                  <button
                    onClick={createNewConversation}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Chat
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </AppLayout>
  )
}
