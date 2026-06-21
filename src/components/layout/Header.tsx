import { useState } from 'react'
import { ChevronDown, UserCircle, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { useAuthStore } from '@/store/useAuthStore'

export default function Header() {
  const { firstName, lastName } = useUserStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const initials = (fullName || 'A U').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(p => !p)}
            className="flex items-center gap-2 pl-3 border-l border-gray-200"
          >
            <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-none">
                {fullName || 'Add your name'}
              </p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => { setShowMenu(false); navigate('/profile') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle className="w-4 h-4 text-gray-400" /> Profile
                </button>
                <button
                  onClick={() => { setShowMenu(false); logout() }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" /> Lock / Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
