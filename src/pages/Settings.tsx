import { useState, useEffect, useRef } from 'react'
import { Save, Cloud, CloudOff, RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useSyncStore } from '@/store/useSyncStore'
import { initGoogleDrive, requestAccessToken, isSignedIn, signOut, uploadBackup, downloadBackup, restoreFromBackup, getConnectedEmail } from '@/lib/googleDriveSync'
import type { Company } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectField } from '@/components/ui/select'
import { useConfirm } from '@/components/ui/confirm-dialog'

export default function Settings() {
  const { company, setCompany } = useCompanyStore()
  const [form, setForm] = useState<Company>({ ...company })
  const confirm = useConfirm()

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCompany(form)
    toast.success('Settings saved successfully!')
  }

  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase mb-1'
  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Document numbering and Google Drive backup</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-end">
          <Button type="submit" leftIcon={<Save className="w-4 h-4" />} size="lg">
            Save Settings
          </Button>
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

        {/* Google Drive Sync */}
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
      </form>
    </div>
  )
}
