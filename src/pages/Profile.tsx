import { useState } from 'react'
import { Save, Lock, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore, hashPassword } from '@/store/useAuthStore'
import { useUserStore } from '@/store/useUserStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'

export default function Profile() {
  const { firstName, lastName, setUser } = useUserStore()
  const [profileFirstName, setProfileFirstName] = useState(firstName)
  const [profileLastName, setProfileLastName] = useState(lastName)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileFirstName.trim()) { toast.error('First name is required'); return }
    setUser(profileFirstName.trim(), profileLastName.trim())
    toast.success('Profile saved successfully!')
  }

  const auth = useAuthStore()
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [changingPass, setChangingPass] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass.length < 4) { toast.error('New password must be at least 4 characters'); return }
    if (newPass !== confirmPass) { toast.error('Passwords do not match'); return }
    setChangingPass(true)
    try {
      const currentHash = await hashPassword(currentPass)
      if (currentHash !== auth.passwordHash) { toast.error('Current password is incorrect'); return }
      const newHash = await hashPassword(newPass)
      auth.setPassword(newHash)
      setCurrentPass(''); setNewPass(''); setConfirmPass('')
      toast.success('Password changed successfully!')
    } finally {
      setChangingPass(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your name and login password</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <form onSubmit={handleSaveProfile}>
          <Card title="My Profile" subtitle="Your name shown in the app header" accent="purple"
            headerRight={<div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center"><UserCircle className="w-4 h-4 text-purple-700" /></div>}>
            <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name *" value={profileFirstName} onChange={e => setProfileFirstName(e.target.value)} required placeholder="John" />
              <Input label="Last Name" value={profileLastName} onChange={e => setProfileLastName(e.target.value)} placeholder="Doe" />
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>Save Profile</Button>
              </div>
            </CardBody>
          </Card>
        </form>

        <Card title="Change Password"
          headerRight={<div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center"><Lock className="w-4 h-4 text-gray-500" /></div>}>
          <form onSubmit={handleChangePassword}>
            <CardBody className="grid grid-cols-1 gap-4">
              <Input label="Current Password" type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="Current password" />
              <Input label="New Password" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 4 characters" />
              <Input label="Confirm New Password" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Re-enter new password" />
              <div className="flex justify-end">
                <Button type="submit" loading={changingPass} disabled={!currentPass || !newPass || !confirmPass} leftIcon={<Lock className="w-4 h-4" />}>
                  Update Password
                </Button>
              </div>
            </CardBody>
          </form>
        </Card>
      </div>
    </div>
  )
}
