import { useState } from 'react'
import { Search, Bell, ChevronDown, Settings as SettingsIcon, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { useAuthStore } from '@/store/useAuthStore'
import AddNameModal from './AddNameModal'

export default function Header({ title }: { title?: string }) {
  const { firstName, lastName } = useUserStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const initials = (fullName || 'A U').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')

  const handleAvatarClick = () => {
    if (!fullName) { setShowModal(true); return }
    setShowMenu(p => !p)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search anything..."
            className="pl-9 pr-14 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 border border-gray-200 rounded-md px-1.5 py-0.5">Ctrl K</span>
        </div>

        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <Bell className="w-[18px] h-[18px] text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border border-white" />
        </button>

        <div className="relative">
          <button
            onClick={handleAvatarClick}
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
                  onClick={() => { setShowMenu(false); navigate('/settings') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-gray-400" /> Settings
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

      {showModal && (
        <AddNameModal
          onClose={() => setShowModal(false)}
          onGoToSettings={() => { setShowModal(false); navigate('/settings') }}
        />
      )}
    </header>
  )
}
