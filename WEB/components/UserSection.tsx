'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, MoreHorizontal } from 'lucide-react'

interface UserSectionProps {
  user: {
    name?: string | null
    email?: string | null
  } | undefined
}

export function UserSection({ user }: UserSectionProps) {
  const [showOptions, setShowOptions] = useState(false)

  return (
    <div className="w-full relative">
      {/* User Info Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 hover:border-purple-200 transition-all">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-base shadow-md">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {user?.name || 'User'}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {user?.email || 'user@example.com'}
          </div>
        </div>
        
        {/* Options Button */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
          title="Options"
        >
          <MoreHorizontal className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Options Dropdown */}
      {showOptions && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <button
              onClick={() => {
                setShowOptions(false)
                signOut()
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 transition-colors group text-left"
            >
              <LogOut className="h-4 w-4 text-gray-500 group-hover:text-red-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-red-700 transition-colors">Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
