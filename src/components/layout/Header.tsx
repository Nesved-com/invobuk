import { useState } from 'react'
import { User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import AddNameModal from './AddNameModal'

export default function Header({ title }: { title?: string }) {
  const { firstName, lastName } = useUserStore()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  const handleClick = () => {
    if (!fullName) setShowModal(true)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
      <div>
        {title && <h1 className="text-xl font-bold text-gray-800">{title}</h1>}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleClick}
          className="flex items-center gap-2 pl-3 border-l border-gray-200 text-left"
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-700 leading-none">
              {fullName || 'Add your name'}
            </p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </button>
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
