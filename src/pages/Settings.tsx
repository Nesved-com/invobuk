import { useState, useEffect, useRef } from 'react'
import { Save, Building2, CreditCard, FileText, Cloud, CloudOff, RefreshCw, Download, CheckCircle, AlertCircle, Lock, UserCircle, Globe, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useSyncStore } from '@/store/useSyncStore'
import { useAuthStore, hashPassword } from '@/store/useAuthStore'
import { useUserStore } from '@/store/useUserStore'
import { initGoogleDrive, requestAccessToken, isSignedIn, signOut, uploadBackup, downloadBackup, restoreFromBackup, getConnectedEmail } from '@/lib/googleDriveSync'
import type { Company } from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectField } from '@/components/ui/select'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useLicenseStore } from '@/store/useLicenseStore'
import { formatExpiry, daysUntil, deactivateLicense } from '@/lib/license'
import invobukLogoShort from '@/assets/invobuk-logo-short.png'

const INDIAN_STATES = [
  { name: 'Andhra Pradesh', code: '37' }, { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' }, { name: 'Bihar', code: '10' },
  { name: 'Chhattisgarh', code: '22' }, { name: 'Delhi', code: '07' },
  { name: 'Goa', code: '30' }, { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' }, { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jammu and Kashmir', code: '01' }, { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' }, { name: 'Kerala', code: '32' },
  { name: 'Ladakh', code: '38' }, { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' }, { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' }, { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' }, { name: 'Odisha', code: '21' },
  { name: 'Punjab', code: '03' }, { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' }, { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' }, { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' }, { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
]

export default function Settings() {
  const { company, setCompany } = useCompanyStore()
  const [form, setForm] = useState<Company>({ ...company })
  const confirm = useConfirm()
  const license = useLicenseStore()

  const handleDeactivateLicense = async () => {
    if (await confirm('This frees up the activation so the same key can be used on another computer, and locks this app until a valid license key is entered again.', { title: 'Deactivate license?', confirmText: 'Deactivate' })) {
      await deactivateLicense(license.licenseKey)
      license.deactivate()
    }
  }

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

  const sync = useSyncStore()
  const [clientIdInput, setClientIdInput] = useState(sync.googleClientId)
  const [driveSignedIn, setDriveSignedIn] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState('')
  const [syncing, setSyncing] = useState(false)
  const autoSyncTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Init Drive SDK when clientId changes
  useEffect(() => {
    if (!sync.googleClientId) return
    initGoogleDrive(sync.googleClientId).catch(() => {})
  }, [sync.googleClientId])

  // Auto-sync interval
  useEffect(() => {
    if (autoSyncTimer.current) clearInterval(autoSyncTimer.current)
    if (sync.autoSync && sync.syncEnabled && driveSignedIn) {
      autoSyncTimer.current = setInterval(async () => {
        try {
          await uploadBackup()
          sync.setLastSync('success')
        } catch (e: any) {
          sync.setLastSync('error', e.message)
        }
      }, sync.autoSyncIntervalMinutes * 60 * 1000)
    }
    return () => { if (autoSyncTimer.current) clearInterval(autoSyncTimer.current) }
  }, [sync.autoSync, sync.syncEnabled, driveSignedIn, sync.autoSyncIntervalMinutes])

  const handleConnectDrive = async () => {
    if (!clientIdInput.trim()) { toast.error('Enter your Google Client ID first'); return }
    sync.setGoogleClientId(clientIdInput.trim())
    try {
      await initGoogleDrive(clientIdInput.trim())
      await requestAccessToken()
      const email = await getConnectedEmail()
      setConnectedEmail(email)
      setDriveSignedIn(true)
      sync.setSyncEnabled(true)
      toast.success(`Connected as ${email || 'Google account'}!`)
    } catch (e: any) {
      toast.error('Connection failed: ' + e.message)
    }
  }

  const handleDisconnect = () => {
    signOut()
    setDriveSignedIn(false)
    setConnectedEmail('')
    sync.setSyncEnabled(false)
    sync.setAutoSync(false)
    toast.success('Disconnected from Google Drive')
  }

  const handleSwitchAccount = async () => {
    try {
      await requestAccessToken(true) // force account picker
      const email = await getConnectedEmail()
      setConnectedEmail(email)
      setDriveSignedIn(true)
      sync.setSyncEnabled(true)
      toast.success(`Switched to ${email}`)
    } catch (e: any) {
      toast.error('Failed: ' + e.message)
    }
  }

  const handleSyncNow = async () => {
    if (!driveSignedIn) { toast.error('Connect to Google Drive first'); return }
    setSyncing(true)
    try {
      await uploadBackup()
      sync.setLastSync('success')
      toast.success('Data synced to Google Drive!')
    } catch (e: any) {
      sync.setLastSync('error', e.message)
      toast.error('Sync failed: ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleRestore = async () => {
    if (!driveSignedIn) { toast.error('Connect to Google Drive first'); return }
    if (!await confirm('This will overwrite all local data with the backup from Google Drive.', { title: 'Restore from Google Drive?', confirmText: 'Restore', danger: false })) return
    setSyncing(true)
    try {
      const backup = await downloadBackup()
      if (!backup) { toast.error('No backup found on Google Drive'); return }
      await restoreFromBackup(backup)
      sync.setLastSync('success')
      toast.success('Data restored! Reloading app...')
      setTimeout(() => window.location.reload(), 1500)
    } catch (e: any) {
      sync.setLastSync('error', e.message)
      toast.error('Restore failed: ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  const f = (field: keyof Company) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const state = INDIAN_STATES.find(s => s.name === e.target.value)
    setForm(prev => ({ ...prev, state: e.target.value, stateCode: state?.code || '' }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCompany(form)
    toast.success('Company settings saved successfully!')
  }

  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase mb-1'
  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your company profile, billing preferences and security</p>
      </div>

      {/* Row 1: My Profile + Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-end">
          <Button type="submit" leftIcon={<Save className="w-4 h-4" />} size="lg">
            Save Company Settings
          </Button>
        </div>

        {/* Row 2: Company Information + GST & Business IDs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Company Information" subtitle="Appears on all invoices and documents" accent="brand"
            headerRight={<div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center"><Building2 className="w-4 h-4 text-brand-700" /></div>}>
            <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Company / Business Name *" value={form.name} onChange={f('name')} required placeholder="e.g. Renuka Electronics & Electricals" />
              </div>
              <div className="sm:col-span-2">
                <Input label="Full Address *" value={form.address} onChange={f('address')} required placeholder="Office no., Street, Area, Road" />
              </div>
              <Input label="City" value={form.city} onChange={f('city')} placeholder="Aurangabad" />
              <SelectField label="State">
                <Select value={form.state} onValueChange={v => { const s = INDIAN_STATES.find(x => x.name === v); setForm(p => ({ ...p, state: v, stateCode: s?.code || '' })) }}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => <SelectItem key={s.code} value={s.name}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </SelectField>
              <Input label="State Code" value={form.stateCode} onChange={f('stateCode')} placeholder="27" />
              <Input label="Pincode" value={form.pincode} onChange={f('pincode')} placeholder="431001" />
              <Input label="Phone *" value={form.phone} onChange={f('phone')} required placeholder="+91 98765 43210" />
              <Input label="Email" type="email" value={form.email} onChange={f('email')} placeholder="info@company.com" />
            </CardBody>
          </Card>

          <Card title="GST & Business IDs" subtitle="Appears on invoices and tax documents" accent="amber"
            headerRight={<div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center"><FileText className="w-4 h-4 text-amber-700" /></div>}>
            <CardBody className="grid grid-cols-1 gap-4">
              <Input label="GSTIN / UIN *" value={form.gstNumber} onChange={f('gstNumber')} placeholder="27AZHPK6296Q1ZC" className="font-mono uppercase" hint="15-digit GST number" />
              <Input label="PAN Number" value={form.panNumber} onChange={f('panNumber')} placeholder="AZHPK6296Q" className="font-mono uppercase" />
              <Input label="Vendor ID / Code" value={form.vendorId} onChange={f('vendorId')} placeholder="24013055" />
              <Input label="Default Payment Terms (Days)" type="number" min="0" value={form.defaultPaymentTerms} onChange={f('defaultPaymentTerms')} placeholder="e.g. 30" />
            </CardBody>
          </Card>
        </div>

        {/* Document Numbering */}
        <Card title="Document Numbering" subtitle="Customize how Invoice, Quotation and Purchase Order numbers are generated">
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Invoice Number Format" value={form.invoiceNumberFormat || ''} onChange={f('invoiceNumberFormat')}
              placeholder="e.g. RE-{FY}-{SEQ}" className="font-mono"
              hint="Leave blank for default. Tokens: {FY}, {SEQ}, {SEQ:4}, {YYYY}, {MM}, {DD}" />
            <Input label="Quotation Number Format" value={form.quotationNumberFormat || ''} onChange={f('quotationNumberFormat')}
              placeholder="e.g. QTN-{FY}-{SEQ}" className="font-mono"
              hint="Leave blank for default. Tokens: {FY}, {SEQ}, {SEQ:4}, {YYYY}, {MM}, {DD}" />
            <Input label="Purchase Order Number Format" value={form.purchaseOrderNumberFormat || ''} onChange={f('purchaseOrderNumberFormat')}
              placeholder="e.g. PO-{FY}-{SEQ}" className="font-mono"
              hint="Leave blank for default. Tokens: {FY}, {SEQ}, {SEQ:4}, {YYYY}, {MM}, {DD}" />
            <Input label="Delivery Challan Number Format" value={form.deliveryChallanNumberFormat || ''} onChange={f('deliveryChallanNumberFormat')}
              placeholder="e.g. DC-{FY}-{SEQ}" className="font-mono"
              hint="Leave blank for default. Tokens: {FY}, {SEQ}, {SEQ:4}, {YYYY}, {MM}, {DD}" />
          </CardBody>
        </Card>

        {/* Row 3: Bank Details + Google Drive Sync */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Bank Details" subtitle="Printed at the bottom of invoices" accent="green"
            headerRight={<div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-700" /></div>}>
            <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Bank Name" value={form.bankName} onChange={f('bankName')} placeholder="State Bank of India" />
              </div>
              <Input label="Account Number" value={form.accountNumber} onChange={f('accountNumber')} className="font-mono" />
              <Input label="IFSC Code" value={form.ifscCode} onChange={f('ifscCode')} className="font-mono uppercase" />
            </CardBody>
          </Card>

          <Card title="Google Drive Sync" subtitle="Auto-backup all data to your Google Drive"
            headerRight={
              <div className="flex items-center gap-3">
                {driveSignedIn && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> {connectedEmail || 'Connected'}
                  </span>
                )}
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center"><Cloud className="w-4 h-4 text-blue-600" /></div>
              </div>
            }>
            <CardBody className="space-y-4">
              <div>
                <label className={labelCls}>Google OAuth Client ID</label>
                <div className="flex gap-2">
                  <input value={clientIdInput} onChange={e => setClientIdInput(e.target.value)}
                    placeholder="xxxx.apps.googleusercontent.com"
                    className={inputCls + ' font-mono text-xs'} disabled={driveSignedIn} />
                  {!driveSignedIn ? (
                    <Button type="button" onClick={handleConnectDrive} leftIcon={<Cloud className="w-4 h-4" />} className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 shadow-blue-100">Connect</Button>
                  ) : (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button type="button" variant="secondary" onClick={handleSwitchAccount}>Switch Account</Button>
                      <Button type="button" variant="secondary" onClick={handleDisconnect} leftIcon={<CloudOff className="w-4 h-4" />}>Disconnect</Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Need a Client ID? <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-500 underline">Google Cloud Console</a> → Enable Drive API → OAuth 2.0 Client ID → add <code className="bg-gray-100 px-1 rounded">http://localhost</code> as origin.
                </p>
              </div>

              {driveSignedIn && (
                <>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={handleSyncNow} loading={syncing} leftIcon={<RefreshCw className="w-4 h-4" />} className="bg-blue-600 hover:bg-blue-700 shadow-blue-100">
                      {syncing ? 'Syncing…' : 'Sync Now'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleRestore} disabled={syncing} leftIcon={<Download className="w-4 h-4" />}>
                      Restore from Drive
                    </Button>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Auto Sync</p>
                      <p className="text-xs text-gray-400">Backup every {sync.autoSyncIntervalMinutes} minutes automatically</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={sync.autoSync} onChange={e => sync.setAutoSync(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>

                  {sync.autoSync && (
                    <SelectField label="Auto Sync Interval" className="w-44">
                      <Select value={String(sync.autoSyncIntervalMinutes)} onValueChange={v => sync.setAutoSyncInterval(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[5, 10, 15, 30, 60, 120].map(m => <SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </SelectField>
                  )}

                  {sync.lastSyncAt && (
                    <div className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl ${sync.lastSyncStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {sync.lastSyncStatus === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      Last sync: {new Date(sync.lastSyncAt).toLocaleString()}
                      {sync.lastSyncError && ` — ${sync.lastSyncError}`}
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Declaration */}
        <Card title="Default Declaration" subtitle="Printed at the bottom of invoices">
          <CardBody>
            <Textarea value={form.declaration} onChange={f('declaration')} rows={3} />
          </CardBody>
        </Card>
      </form>

      {/* About & License */}
      <Card className="mt-5 mb-8" title="About & License"
        headerRight={<div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-brand-700" /></div>}>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={invobukLogoShort} alt="Invobuk" className="h-10 w-10 object-contain rounded-lg" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Invobuk Desktop Application</p>
              <p className="text-xs text-gray-500">Developed and licensed by NesVed</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <a href="https://www.nesved.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
              <Globe className="w-4 h-4" /> www.nesved.com
            </a>
            <a href="mailto:contact@nesved.com" className="flex items-center gap-2 text-brand-600 hover:underline">
              <Mail className="w-4 h-4" /> contact@nesved.com
            </a>
            <a href="https://mqsqfbvoupzxqmbyxugd.supabase.co/storage/v1/object/public/downloads/Invobuk-Setup.exe" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline sm:col-span-2">
              <Download className="w-4 h-4" /> Download latest version
            </a>
          </div>

          {license.isActivated && (
            <div className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
              <div className="text-sm">
                <p className="font-semibold text-brand-800">License: {license.customerName}</p>
                <p className="text-xs text-brand-600">
                  Valid until {formatExpiry(license.expiresAt)}
                  {' · '}
                  {daysUntil(license.expiresAt) >= 0 ? `${daysUntil(license.expiresAt)} day(s) left` : 'expired'}
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleDeactivateLicense}>Deactivate</Button>
            </div>
          )}

          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
            © {new Date().getFullYear()} NesVed. All rights reserved. This desktop application and its source code are
            proprietary software owned by NesVed and are licensed, not sold, for use under the terms agreed
            between NesVed and the licensee. Unauthorized copying, distribution, reverse engineering, or resale of
            this software, in whole or in part, is strictly prohibited without prior written consent from NesVed.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
