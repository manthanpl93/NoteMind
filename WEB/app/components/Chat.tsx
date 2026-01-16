'use client'

import { useState, useEffect } from 'react'
import {
  Bot,
  Send,
  PencilLine,
  FileSearch,
  ChevronDown,
  X
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { conversationsApi, messagesApi } from '@/lib/api'
import type { AIModel, ConversationWithMessages, Message } from '@/lib/api/types'

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

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  mode?: 'note-taking' | 'ask' | 'explore'
}

interface ModifiedNote {
  id: string
  title: string
  changesCount: number
  timestamp: string
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber?: number
}

interface DiffBlock {
  type: 'added' | 'removed' | 'unchanged'
  oldHtml?: string
  newHtml?: string
  html?: string
}

interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  folderId?: string
}

interface ChatFolder {
  id: string
  name: string
  chats: Chat[]
}

interface ChatTab {
  id: string
  chatId: string | null
}

interface ChatProps {
  activeChat: string | null
  activeConversation: ConversationWithMessages | null
  selectedModel: string
  availableModels: AIModel[]
  activeTabId: string | null
  onSetSelectedModel: (model: string) => void
  onSwitchModel: (conversationId: string, model: string) => void
  onSendMessage: (conversationId: string, content: string) => void
  onCreateConversation: (model: string, firstMessage: string) => Promise<string>
  onUpdateTabTitle: (tabId: string, title: string) => void
}

export function ChatComponent({
  activeChat,
  activeConversation,
  selectedModel,
  availableModels,
  activeTabId,
  onSetSelectedModel,
  onSwitchModel,
  onSendMessage,
  onCreateConversation,
  onUpdateTabTitle
}: ChatProps) {
  const [chatInput, setChatInput] = useState('')
  const [chatMode, setChatMode] = useState<'note-taking' | 'ask' | 'explore'>('explore')
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<ConversationWithMessages | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Extract context usage data (with type safety)
  const contextUsageData = (() => {
    if (!currentConversation) return { percentage: 0, tokensUsed: 0, totalContext: 0 }
    // API returns context usage data in conversation response
    const conv = currentConversation as any
    return {
      percentage: conv.total_used_percentage ?? 0,
      tokensUsed: conv.total_tokens_used ?? 0,
      totalContext: conv.total_context_size ?? 0
    }
  })()
  
  const contextUsagePercentage = contextUsageData.percentage

  // Use passed conversation data or load if not available
  useEffect(() => {
    if (activeConversation) {
      // Use cached data passed from parent (even if messages array is empty)
      // Ensure messages is always an array
      setCurrentConversation({
        ...activeConversation,
        messages: Array.isArray(activeConversation.messages) ? activeConversation.messages : []
      })
      setIsLoading(false)
    } else if (activeChat && activeChat !== null) {
      // Load conversation data if we have an active chat ID
      let isCancelled = false
      
      const loadConversation = async () => {
        setIsLoading(true)
        try {
          // Load existing conversation
          const [conversation, messages] = await Promise.all([
            conversationsApi.get(activeChat),
            messagesApi.list(activeChat)
          ])

          // Only update state if this effect is still valid
          if (!isCancelled) {
            // Transform to expected format
            setCurrentConversation({
              ...conversation,
              messages: Array.isArray(messages) ? messages : []
            })
          }
        } catch (error) {
          if (!isCancelled) {
            setCurrentConversation(null)
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false)
          }
        }
      }

      loadConversation()

      // Cleanup function to prevent state updates if dependencies change
      return () => {
        isCancelled = true
      }
    } else {
      // No active conversation
      setCurrentConversation(null)
      setIsLoading(false)
    }
  }, [activeChat, activeConversation])
  const [modifiedNotes, setModifiedNotes] = useState<ModifiedNote[]>([
    // Demo data - shows by default
    {
      id: 'demo-1',
      title: 'AI Agents Overview',
      changesCount: 5,
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 'demo-2',
      title: 'Next.js Best Practices',
      changesCount: 3,
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const [showModifiedNotes, setShowModifiedNotes] = useState(true)
  const [selectedNoteForDiff, setSelectedNoteForDiff] = useState<string | null>(null)
  const [diffViewMode, setDiffViewMode] = useState<'new' | 'old' | 'diff'>('new')
  const [showContextTooltip, setShowContextTooltip] = useState(false)

  // Mock unified HTML document with inline diff highlights
  const getUnifiedHtmlWithDiff = (noteId: string, mode: 'new' | 'old' | 'diff'): string => {
    // In a real implementation, this would be generated by comparing old and new HTML
    // For demo, we're showing a document with inline highlights
    
    if (mode === 'new') {
      // Show new version with only added parts highlighted
      return `<div class="prose max-w-none">
        <h2>AI Agents Overview</h2>
        <p>AI agents are autonomous systems that can perceive their environment, make decisions, and take actions to achieve specific goals.</p>
        
        <h3>Key Characteristics</h3>
        <ul>
          <li><strong>Autonomy:</strong> <span class="diff-added">Full independent operation without any</span> human intervention</li>
          <li><strong>Reactivity:</strong> Respond to changes in their environment<span class="diff-added"> in real-time</span></li>
          <li class="diff-added"><strong>Proactivity:</strong> Take initiative to achieve goals</li>
          <li class="diff-added"><strong>Social Ability:</strong> Interact with other agents and humans</li>
        </ul>
        
        <blockquote class="border-l-4 border-purple-500 pl-4 italic bg-purple-50 p-4 rounded">
          "An agent is anything that can perceive its environment through sensors and act upon that environment through actuators." - Russell & Norvig
        </blockquote>
        
        <div class="diff-added bg-green-50 p-4 rounded-lg my-4 border-l-4 border-green-500">
          <h4 class="font-semibold text-green-900 mb-2">New Section: Agent Types</h4>
          <p class="text-green-800">Modern AI agents can be classified into several categories based on their capabilities and decision-making processes.</p>
          <ul class="text-green-800 mt-2">
            <li>Simple Reflex Agents</li>
            <li>Model-Based Agents</li>
            <li>Goal-Based Agents</li>
            <li>Utility-Based Agents</li>
          </ul>
        </div>
        
        <pre class="bg-gray-900 p-4 rounded-lg"><code class="text-green-400">// Advanced agent example with learning
class Agent {
  constructor() {
    this.memory = [];
    this.learningRate = 0.1;
  }
  
  decide(environment) {
    const action = this.selectBestAction(environment);
    this.learn(environment, action);
    return action;
  }
  
  learn(env, action) {
    this.memory.push({ env, action });
    this.updateModel();
  }
}</code></pre>
      </div>`
    } else if (mode === 'old') {
      // Show old version with only removed parts highlighted
      return `<div class="prose max-w-none">
        <h2>AI Agents Overview</h2>
        <p>AI agents are autonomous systems that can perceive their environment, make decisions, and take actions to achieve specific goals.</p>
        
        <h3>Key Characteristics</h3>
        <ul>
          <li><strong>Autonomy:</strong> <span class="diff-removed">Operate without direct</span> human intervention</li>
          <li><strong>Reactivity:</strong> Respond to changes in their environment</li>
        </ul>
        
        <blockquote class="border-l-4 border-purple-500 pl-4 italic bg-purple-50 p-4 rounded">
          "An agent is anything that can perceive its environment through sensors and act upon that environment through actuators." - Russell & Norvig
        </blockquote>
        
        <pre class="diff-removed bg-gray-100 p-4 rounded-lg"><code>// Simple agent example
if (temperature > 25) {
  turnOnAC();
}</code></pre>
      </div>`
    } else {
      // Diff mode - show both added and removed inline
      return `<div class="prose max-w-none">
        <h2>AI Agents Overview</h2>
        <p>AI agents are autonomous systems that can perceive their environment, make decisions, and take actions to achieve specific goals.</p>
        
        <h3>Key Characteristics</h3>
        <ul>
          <li><strong>Autonomy:</strong> <span class="diff-removed">Operate without direct</span><span class="diff-added">Full independent operation without any</span> human intervention</li>
          <li><strong>Reactivity:</strong> Respond to changes in their environment<span class="diff-added"> in real-time</span></li>
          <li class="diff-added"><strong>Proactivity:</strong> Take initiative to achieve goals</li>
          <li class="diff-added"><strong>Social Ability:</strong> Interact with other agents and humans</li>
        </ul>
        
        <blockquote class="border-l-4 border-purple-500 pl-4 italic bg-purple-50 p-4 rounded">
          "An agent is anything that can perceive its environment through sensors and act upon that environment through actuators." - Russell & Norvig
        </blockquote>
        
        <div class="diff-added bg-green-50 p-4 rounded-lg my-4 border-l-4 border-green-500">
          <h4 class="font-semibold text-green-900 mb-2">New Section: Agent Types</h4>
          <p class="text-green-800">Modern AI agents can be classified into several categories based on their capabilities and decision-making processes.</p>
          <ul class="text-green-800 mt-2">
            <li>Simple Reflex Agents</li>
            <li>Model-Based Agents</li>
            <li>Goal-Based Agents</li>
            <li>Utility-Based Agents</li>
          </ul>
        </div>
        
        <div class="diff-removed">
          <pre class="bg-gray-100 p-4 rounded-lg"><code>// Simple agent example
if (temperature > 25) {
  turnOnAC();
}</code></pre>
        </div>
        
        <div class="diff-added">
          <pre class="bg-gray-900 p-4 rounded-lg"><code class="text-green-400">// Advanced agent example with learning
class Agent {
  constructor() {
    this.memory = [];
    this.learningRate = 0.1;
  }
  
  decide(environment) {
    const action = this.selectBestAction(environment);
    this.learn(environment, action);
    return action;
  }
  
  learn(env, action) {
    this.memory.push({ env, action });
    this.updateModel();
  }
}</code></pre>
        </div>
      </div>`
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const messageContent = chatInput.trim()
    setChatInput('')
    setIsLoading(true)

    try {
      if (!activeChat) {
        // New conversation - create it with AI response included
        await onCreateConversation(selectedModel, messageContent)
        // AI response is already included, no need to call sendMessage
      } else {
        // Existing conversation - send message
        await onSendMessage(activeChat, messageContent)
      }
    } catch (error) {
      // TODO: Show error toast to user
    } finally {
      setIsLoading(false)
    }

    // TODO: Backend integration for modes and notes - currently mocked
    if (chatMode === 'note-taking') {
      const newModifiedNote: ModifiedNote = {
        id: `note-${Date.now()}`,
        title: 'AI Agents Overview', // Demo note title
        changesCount: Math.floor(Math.random() * 10) + 1,
        timestamp: new Date().toLocaleTimeString()
      }
      setModifiedNotes(prev => {
        // Check if note already exists, update it
        const existing = prev.find(n => n.title === newModifiedNote.title)
        if (existing) {
          return prev.map(n =>
            n.title === newModifiedNote.title
              ? { ...n, changesCount: n.changesCount + newModifiedNote.changesCount, timestamp: newModifiedNote.timestamp }
              : n
          )
        }
        return [...prev, newModifiedNote]
      })
    }
  }

  // Handle loading state
  if (isLoading && activeChat) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Bot className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Conversation...</h2>
          <p className="text-gray-600">Fetching messages and conversation details</p>
        </div>
      </div>
    )
  }

  // Handle no active tab or new conversation
  // Also check if messages array exists and is valid
  const isNewConversation = !activeChat || !currentConversation || !Array.isArray(currentConversation?.messages)

  if (!activeTabId) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Chat Selected</h2>
          <p className="text-gray-600">
            Select a chat from the sidebar or create a new one
          </p>
        </div>
      </div>
    )
  }

  // Get unified HTML with inline diff highlights
  const getUnifiedDiffHtml = (noteId: string): string => {
    return getUnifiedHtmlWithDiff(noteId, diffViewMode)
  }

  // Circular progress ring component for context usage
  const renderContextUsageIndicator = () => {
    const percentage = contextUsagePercentage
    const size = 20
    const strokeWidth = 2.5
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    // Format tokens in K format (e.g., 52000 -> 52k)
    const formatTokens = (tokens: number): string => {
      if (tokens >= 1000) {
        return `${Math.round(tokens / 1000)}k`
      }
      return `${tokens}`
    }

    const tokensUsedFormatted = formatTokens(contextUsageData.tokensUsed)
    const totalContextFormatted = formatTokens(contextUsageData.totalContext)
    const tooltipText = `${Math.round(percentage)}% - ${tokensUsedFormatted}/${totalContextFormatted} context used`

    return (
      <div 
        className="absolute right-10 bottom-2.5 flex items-center justify-center transition-transform hover:scale-110 cursor-help"
        onMouseEnter={() => setShowContextTooltip(true)}
        onMouseLeave={() => setShowContextTooltip(false)}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-300"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-purple-600 transition-all duration-300 ease-out"
          />
        </svg>
        {/* Custom Tooltip */}
        {showContextTooltip && (
          <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none z-50">
            {tooltipText}
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Document Viewer - Left Side (when note selected) - Takes more space */}
      {selectedNoteForDiff && (
        <div className="w-[70%] border-r border-gray-200 flex flex-col bg-gray-50">
          {/* Header with Tabs */}
          <div className="border-b border-gray-200 bg-white">
            {/* Title Bar */}
            <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <PencilLine className="h-3.5 w-3.5 text-purple-600" />
                <span className="font-semibold text-sm text-gray-900">
                  {modifiedNotes.find(n => n.id === selectedNoteForDiff)?.title}
                </span>
                <span className="text-xs text-gray-500">
                  ({modifiedNotes.find(n => n.id === selectedNoteForDiff)?.changesCount} changes)
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedNoteForDiff(null)
                  setDiffViewMode('new')
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Close"
              >
                <X className="h-3.5 w-3.5 text-gray-600" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 py-1">
              <button
                onClick={() => setDiffViewMode('new')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  diffViewMode === 'new'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                New Version
              </button>
              <button
                onClick={() => setDiffViewMode('old')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  diffViewMode === 'old'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Old Version
              </button>
              <button
                onClick={() => setDiffViewMode('diff')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  diffViewMode === 'diff'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Changes
              </button>
            </div>
          </div>

          {/* Document Content - Unified HTML Diff Viewer with Inline Highlights */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: getUnifiedDiffHtml(selectedNoteForDiff) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat Area - Right Side (or full width) - Takes less space when split */}
      <div className={`flex flex-col ${selectedNoteForDiff ? 'w-[30%]' : 'w-full'} h-full`}>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
        {isNewConversation || !currentConversation ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <Bot className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start a Conversation</h2>
              <p className="text-gray-600 mb-4">
                {chatMode === 'note-taking' 
                  ? `I'm in Note Taking mode. Tell me what changes you'd like to make to your notes.`
                  : chatMode === 'ask'
                  ? `I'm in Ask mode. Ask me questions about your notes and I'll search for answers.`
                  : `I'm in Explore mode. Ask me anything and I'll search the web and use my general knowledge.`
                }
              </p>
              <div className="grid grid-cols-1 gap-2 text-left">
                {(chatMode === 'note-taking' ? [
                  'Add a new section about React Server Components',
                  'Update my AI Agents note with latest best practices',
                  'Create a new page about TypeScript generics',
                  'Restructure my Next.js notes'
                ] : chatMode === 'ask' ? [
                  'What are the key characteristics of AI agents?',
                  'How does Server-Side Rendering work in Next.js?',
                  'Show me notes about React hooks',
                  'Find information about performance optimization'
                ] : [
                  'What are the latest trends in artificial intelligence?',
                  'Explain how quantum computing works',
                  'What is the difference between REST and GraphQL?',
                  'Tell me about recent advances in web development'
                ]).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setChatInput(suggestion)}
                    className="p-3 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {(Array.isArray(currentConversation.messages) ? currentConversation.messages : []).map((message, index) => (
              <div
                key={message.id || `${message.timestamp}-${message.role}-${index}`}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-5 py-3.5 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {/* Mode indicator badge */}
                  {message.mode && (
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
                      message.role === 'user'
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {message.mode === 'note-taking' ? (
                        <>
                          <PencilLine className="h-3 w-3" />
                          <span>Note Taking</span>
                        </>
                      ) : message.mode === 'ask' ? (
                        <>
                          <FileSearch className="h-3 w-3" />
                          <span>Ask</span>
                        </>
                      ) : (
                        <>
                          <span>🌐</span>
                          <span>Explore</span>
                        </>
                      )}
                    </div>
                  )}
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm prose-chat max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <p className={`text-xs mt-2.5 ${
                    message.role === 'user' ? 'text-purple-100' : 'text-gray-400'
                  }`}>
                    {formatIndianDateTime(message.timestamp)}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm shadow-md">
                    U
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modified Notes Section - Vertical List at bottom */}
      {modifiedNotes.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            {/* Header with collapse button and clear */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <button
                onClick={() => setShowModifiedNotes(!showModifiedNotes)}
                className="flex items-center gap-1.5 hover:bg-gray-100 rounded px-2 py-0.5 transition-colors"
              >
                <ChevronDown className={`h-3 w-3 text-gray-600 transition-transform ${showModifiedNotes ? '' : '-rotate-90'}`} />
                <span className="text-xs font-medium text-gray-700">
                  {modifiedNotes.length} {modifiedNotes.length === 1 ? 'File' : 'Files'}
                </span>
              </button>
              
              {showModifiedNotes && (
                <button
                  onClick={() => setModifiedNotes([])}
                  className="text-xs text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-100 px-2 py-0.5 rounded"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {/* Files in vertical list */}
            {showModifiedNotes && (
              <div className="px-3 pb-2 space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {modifiedNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNoteForDiff(selectedNoteForDiff === note.id ? null : note.id)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors ${
                      selectedNoteForDiff === note.id
                        ? 'bg-purple-100 border-purple-400 text-purple-900'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <PencilLine className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900 flex-1 text-left truncate">
                      {note.title}
                    </span>
                    <span className="text-gray-400 flex-shrink-0">→</span>
                    <span className="text-gray-600 whitespace-nowrap flex-shrink-0">
                      {note.changesCount} {note.changesCount === 1 ? 'Line' : 'Lines'} Modified
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area - Optimized Compact Design */}
      <div className="border-t border-gray-200 bg-white px-4 py-2">
        <div className="max-w-4xl mx-auto">
          {/* Compact Input Container */}
          <div className="flex items-end gap-2 mb-2">
            {/* Main Input Area with Integrated Send Button */}
            <div className="flex-1 relative">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={
                  chatMode === 'note-taking'
                    ? 'Describe changes to your notes...'
                    : chatMode === 'ask'
                    ? 'Ask about your notes...'
                    : 'Ask anything...'
                }
                className="w-full pl-3 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
                rows={1}
                style={{ minHeight: '38px', maxHeight: '150px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 150) + 'px'
                }}
              />
              {/* Context Usage Indicator */}
              {currentConversation && renderContextUsageIndicator()}
              {/* Send Button Inside Input */}
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isLoading}
                className="absolute right-2 bottom-2 p-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
                title="Send message (Enter)"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Compact Controls Row */}
          <div className="flex items-center gap-2 text-xs">
            {/* Mode Selector - Compact */}
            <div className="relative">
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-1 focus:ring-purple-500 outline-none cursor-pointer flex items-center gap-1"
                title="Chat Mode"
              >
                <span>{chatMode === 'explore' ? '🌐 Explore' : chatMode === 'ask' ? '🔍 Ask' : '📝 Note'}</span>
                <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {showModeDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowModeDropdown(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setChatMode('explore')
                        setShowModeDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-purple-50 transition-colors ${
                        chatMode === 'explore' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      🌐 Explore - Web & general knowledge
                    </button>
                    <button
                      onClick={() => {
                        setChatMode('note-taking')
                        setShowModeDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-purple-50 transition-colors ${
                        chatMode === 'note-taking' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      📝 Note Taking - Edit notes
                    </button>
                    <button
                      onClick={() => {
                        setChatMode('ask')
                        setShowModeDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-purple-50 transition-colors ${
                        chatMode === 'ask' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      🔍 Ask - Search your notes
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Model Selector - Compact */}
            <select
              value={selectedModel}
              onChange={async (e) => {
                const newModel = e.target.value
                onSetSelectedModel(newModel)
                if (activeChat) {
                  // Switch model for existing conversation
                  try {
                    await onSwitchModel(activeChat, newModel)
                  } catch (error) {
                    // TODO: Show error toast and revert selection
                  }
                }
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-1 focus:ring-purple-500 outline-none cursor-pointer"
              title="AI Model"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>

            {/* Hint Text */}
            <span className="text-gray-400 ml-auto">Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

