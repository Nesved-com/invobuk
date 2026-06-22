// Online license activation for Invobuk. Activation/validation is checked against
// the Invobuk licensing Supabase project — this is what lets us enforce "one key,
// one machine" (an offline-only check can never know about other installs).
const LICENSE_API_URL = 'https://mqsqfbvoupzxqmbyxugd.supabase.co/functions/v1'
const LICENSE_API_ANON_KEY = 'sb_publishable_WRx-5aulzkSNzZvr8_IGdQ_XHy-PKka'

export interface ActivationResult {
  valid: boolean
  reason?: string
  customerName?: string
  expiresAt?: string // ISO timestamp
  plan?: string
  isTrial?: boolean
  licenseKey?: string
}

export async function getMachineId(): Promise<string> {
  const electronMachine = (window as any).electronMachine
  if (electronMachine) return electronMachine.getId()

  // Browser/dev fallback — persist a random id so repeated dev runs behave consistently.
  const stored = localStorage.getItem('invobuk-dev-machine-id')
  if (stored) return stored
  const generated = crypto.randomUUID()
  localStorage.setItem('invobuk-dev-machine-id', generated)
  return generated
}

export async function activateLicense(licenseKey: string): Promise<ActivationResult> {
  const machineId = await getMachineId()
  try {
    const res = await fetch(`${LICENSE_API_URL}/activate-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LICENSE_API_ANON_KEY}` },
      body: JSON.stringify({ licenseKey: licenseKey.trim().toUpperCase(), machineId, machineLabel: navigator.platform }),
    })
    const data = await res.json()
    return data
  } catch {
    return { valid: false, reason: 'Could not reach the license server. Check your internet connection and try again.' }
  }
}

// Auto-starts a 3-day, no-key-required trial the first time the app is run on a
// machine. Idempotent server-side — replaying this on the same machine just
// returns the same trial's (possibly now-expired) status, never a fresh one.
export async function startTrial(): Promise<ActivationResult> {
  const machineId = await getMachineId()
  try {
    const res = await fetch(`${LICENSE_API_URL}/start-trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LICENSE_API_ANON_KEY}` },
      body: JSON.stringify({ machineId, machineLabel: navigator.platform }),
    })
    return await res.json()
  } catch {
    return { valid: false, reason: 'Could not reach the license server. Check your internet connection and try again.' }
  }
}

export async function deactivateLicense(licenseKey: string): Promise<{ ok: boolean; reason?: string }> {
  const machineId = await getMachineId()
  try {
    const res = await fetch(`${LICENSE_API_URL}/deactivate-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LICENSE_API_ANON_KEY}` },
      body: JSON.stringify({ licenseKey: licenseKey.trim().toUpperCase(), machineId }),
    })
    return await res.json()
  } catch {
    return { ok: false, reason: 'Could not reach the license server.' }
  }
}

export async function updateLicenseContact(licenseKey: string, email?: string, phone?: string): Promise<{ ok: boolean; reason?: string }> {
  if (!licenseKey || (!email && !phone)) return { ok: false, reason: 'Nothing to update' }
  try {
    const res = await fetch(`${LICENSE_API_URL}/update-license-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LICENSE_API_ANON_KEY}` },
      body: JSON.stringify({ licenseKey: licenseKey.trim().toUpperCase(), email, phone }),
    })
    return await res.json()
  } catch {
    return { ok: false, reason: 'Could not reach the license server.' }
  }
}

export function formatExpiry(expiresAt: string): string {
  if (!expiresAt) return ''
  return new Date(expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntil(expiresAt: string): number {
  if (!expiresAt) return 0
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
