import { useState } from 'react'
import { Globe, Mail, ShieldCheck, RefreshCw, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useLicenseStore } from '@/store/useLicenseStore'
import { formatExpiry, daysUntil, deactivateLicense } from '@/lib/license'
import { fetchLatestRelease, isNewerVersion, CURRENT_APP_VERSION } from '@/lib/appUpdate'
import invobukLogoShort from '@/assets/invobuk-logo-short.png'

export default function AboutLicense() {
  const license = useLicenseStore()
  const confirm = useConfirm()
  const [checking, setChecking] = useState(false)
  const [latestUrl, setLatestUrl] = useState<string | null>(null)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)

  const handleDeactivateLicense = async () => {
    if (await confirm('This frees up the activation so the same key can be used on another computer, and locks this app until a valid license key is entered again.', { title: 'Deactivate license?', confirmText: 'Deactivate' })) {
      const result = await deactivateLicense(license.licenseKey)
      if (!result.ok) {
        toast.error(result.reason || 'Could not deactivate — please try again while online')
        return
      }
      license.deactivate()
      toast.success('License deactivated')
    }
  }

  const handleCheckForUpdates = async () => {
    setChecking(true)
    const latest = await fetchLatestRelease()
    setChecking(false)
    if (!latest) { toast.error('Could not check for updates — check your internet connection'); return }
    if (isNewerVersion(latest.version, CURRENT_APP_VERSION)) {
      setLatestVersion(latest.version)
      setLatestUrl(latest.url)
      toast.info(`Update available: v${latest.version}`)
    } else {
      setLatestVersion(null)
      setLatestUrl(null)
      toast.success("You're up to date")
    }
  }

  return (
    <div className="max-w-3xl">
      <Card title="About & License"
        headerRight={<div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-brand-700" /></div>}>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={invobukLogoShort} alt="Invobuk" className="h-10 w-10 object-contain rounded-lg" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Invobuk Desktop Application</p>
              <p className="text-xs text-gray-500">Version {CURRENT_APP_VERSION} · Developed and licensed by NesVed</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <a href="https://www.nesved.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
              <Globe className="w-4 h-4" /> www.nesved.com
            </a>
            <a href="mailto:contact@nesved.com" className="flex items-center gap-2 text-brand-600 hover:underline">
              <Mail className="w-4 h-4" /> contact@nesved.com
            </a>
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <div className="text-sm">
              {latestVersion ? (
                <>
                  <p className="font-semibold text-amber-700">Update available: v{latestVersion}</p>
                  <a href={latestUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline mt-0.5">
                    <Download className="w-3.5 h-3.5" /> Download latest version
                  </a>
                </>
              ) : (
                <p className="text-gray-600">You're on the latest version</p>
              )}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleCheckForUpdates} disabled={checking}>
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} /> Check for Updates
            </Button>
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
