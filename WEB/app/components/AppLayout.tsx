'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Brain, Search, MessageSquare, Settings, Plus, X, Book } from 'lucide-react'
import { UserSection } from '../../components/UserSection'
import { useNotes } from '../hooks/useNotes'

interface AppLayoutProps {
  children: React.ReactNode
  // Optional props for active note highlighting
  activeNote?: string | null
  onNoteClick?: (noteId: string) => void
}

export function AppLayout({
  children,
  activeNote,
  onNoteClick
}: AppLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { notes, addNote, deleteNote } = useNotes()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div
            className="flex items-center gap-2 mb-4 cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            <Brain className="h-6 w-6 text-purple-600" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              NoteMind
            </span>
          </div>

          {/* User Section */}
          <UserSection user={session?.user} />
        </div>

        {/* Navigation */}
        <div className="p-3 space-y-1">
          <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
            <Search className="h-5 w-5" />
            <span className="text-sm font-medium">Search</span>
          </button>
          <button
            onClick={() => router.push('/chats')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
              pathname === '/chats'
                ? 'bg-purple-50 text-purple-700'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">Chats</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
              pathname === '/settings'
                ? 'bg-purple-50 text-purple-700'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>

        <div className="h-px bg-gray-200 mx-3 my-2"></div>

        {/* Notes Section */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</span>
            <button
              onClick={() => {
                const newNoteId = addNote('New Note')
                router.push('/dashboard')
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Add Note"
            >
              <Plus className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Notes List */}
          <div className="space-y-1">
            {!notes || notes.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No notes yet</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`group flex items-center gap-2 py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                    activeNote === note.id
                      ? 'bg-purple-50 text-purple-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => {
                    onNoteClick?.(note.id)
                    router.push('/dashboard')
                  }}
                >
                  <Book className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">{note.name}</span>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                    title="Delete"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      {children}
    </div>
  )
}
