import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useUserStore } from '@/store/useUserStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  onClose: () => void
  onGoToSettings: () => void
}

export default function AddNameModal({ onClose, onGoToSettings }: Props) {
  const { setUser } = useUserStore()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const handleSave = () => {
    if (!firstName.trim()) { toast.error('First name is required'); return }
    setUser(firstName.trim(), lastName.trim())
    toast.success('Name saved!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Add your name</h2>
        <p className="text-sm text-gray-500 mb-4">This will be shown in the header instead of "Add your name".</p>

        <div className="space-y-3">
          <Input label="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" />
          <Input label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
        </div>

        <div className="flex items-center justify-between mt-5">
          <button onClick={onGoToSettings} className="text-xs text-brand-600 hover:underline">
            Add later in Profile Settings
          </button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  )
}
