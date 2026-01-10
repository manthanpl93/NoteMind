'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Brain,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Book
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { useNotes } from '../hooks/useNotes'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { getNote } = useNotes()

  const [activeNoteCollection, setActiveNoteCollection] = useState<string | null>('1')
  const [activeNote, setActiveNote] = useState<string | null>(null)

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

  const findSpaceById = (id: string): Space | null => {
    return spaces.find(s => s.id === id) || null
  }

  const handleNoteClick = (noteId: string) => {
    setActiveNoteCollection(noteId)
    setActiveNote(null)
  }

  return (
    <AppLayout
      activeNote={activeNoteCollection}
      onNoteClick={handleNoteClick}
    >
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6">
          <div className="flex-1">
            {activeNoteCollection && (
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5 text-purple-600" />
                <h1 className="text-lg font-semibold text-gray-900">
                  {getNote(activeNoteCollection)?.name || 'Untitled'}
                </h1>
              </div>
            )}
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="h-5 w-5 text-gray-600" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {activeNote ? (
            // Show Note Content
            (() => {
              const currentNoteCollection = getNote(activeNoteCollection!)
              const note = currentNoteCollection?.notes?.find(n => n.id === activeNote)
              
              if (!note) return null

              const renderTOCItem = (item: TOCItem, index: number) => {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        const element = document.getElementById(item.id)
                        if (element) {
                          const yOffset = -100
                          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                          window.scrollTo({ top: y, behavior: 'smooth' })
                        }
                      }}
                      className="w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all hover:bg-white shadow-sm text-gray-700 hover:text-purple-700"
                    >
                      <span className="flex-shrink-0 text-purple-600 font-semibold text-sm">
                        {index + 1}.
                      </span>
                      <span className="text-sm flex-1">{item.title}</span>
                    </button>
                    {item.children && item.children.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => {
                              const element = document.getElementById(child.id)
                              if (element) {
                                const yOffset = -100
                                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                                window.scrollTo({ top: y, behavior: 'smooth' })
                              }
                            }}
                            className="w-full flex items-start gap-2 p-2 rounded-lg text-left transition-all hover:bg-white/70 text-gray-600 text-sm hover:text-purple-600"
                          >
                            <span className="text-gray-400">└</span>
                            <span>{child.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div className="flex-1 overflow-y-auto p-8">
                  <article className="max-w-5xl mx-auto">
                    {/* Back Button */}
                    <button
                      onClick={() => setActiveNote(null)}
                      className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                      <span className="text-sm font-medium">Back to Note</span>
                    </button>

                    {/* Note Header */}
                    <header className="mb-8">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {note.title}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {note.createdAt}</span>
                        <span>•</span>
                        <span>Updated: {note.updatedAt}</span>
                        <span>•</span>
                        <span>{note.pages.length} pages</span>
                      </div>
                    </header>

                    {/* Table of Contents */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-12">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Book className="h-5 w-5 text-purple-600" />
                        Table of Contents
                      </h2>
                      <nav className="space-y-1">
                        {note.tableOfContents.map((item, index) => renderTOCItem(item, index))}
                      </nav>
                    </div>

                    {/* All Pages Content */}
                    <div className="space-y-12">
                      {note.pages.map((page, pageIndex) => (
                        <section 
                          key={page.id} 
                          id={note.tableOfContents[pageIndex]?.id}
                          className="bg-white rounded-xl border border-gray-200 p-8 scroll-mt-24"
                        >
                          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {page.title}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>Page {pageIndex + 1} of {note.pages.length}</span>
                            </div>
                          </div>
                          
                          <div 
                            className="prose-custom"
                            dangerouslySetInnerHTML={{ __html: page.content }}
                          />
                        </section>
                      ))}
                    </div>

                    {/* Back to Top Button */}
                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg"
                      >
                        ↑ Back to Top
                      </button>
                    </div>
                  </article>
                </div>
              )
            })()
          ) : activeNoteCollection ? (
            // Show Note Overview
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
                    <Book className="h-8 w-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {getNote(activeNoteCollection)?.name}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Explore your notes and organize your knowledge
                  </p>
                </div>

                {/* Notes List */}
                {(() => {
                  const currentNoteCollection = getNote(activeNoteCollection)
                  const notes = currentNoteCollection?.notes
                  
                  if (notes && notes.length > 0) {
                    return (
                      <div className="mb-12">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Pages</h3>
                        <div className="grid gap-4">
                          {notes.map(note => (
                            <button
                              key={note.id}
                              onClick={() => setActiveNote(note.id)}
                              className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all text-left"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                  {note.title}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Book className="h-4 w-4" />
                                  <span>{note.pages.length} pages</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {note.tableOfContents.slice(0, 3).map(item => (
                                  <span 
                                    key={item.id}
                                    className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md"
                                  >
                                    {item.title}
                                  </span>
                                ))}
                                {note.tableOfContents.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                    +{note.tableOfContents.length - 3} more
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-500">
                                Updated: {note.updatedAt}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                      <Book className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No pages yet</h3>
                      <p className="text-sm text-gray-600 mb-4">Create your first page to get started</p>
                    </div>
                  )
                })()}

                <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg hover:shadow-xl">
                  <Plus className="inline h-5 w-5 mr-2" />
                  Create New Page
                </button>
              </div>
            </div>
          ) : (
            // No Space Selected
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Note Selected</h2>
                <p className="text-gray-600 mb-4">
                  Select a note from the sidebar or create a new one
                </p>
                  <button
                    onClick={() => {
                      const newNoteId = addNote('New Note')
                      setActiveNoteCollection(newNoteId)
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
                  >
                  <Plus className="h-4 w-4" />
                  Create Note
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  )
}
