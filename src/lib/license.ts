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

export function formatExpiry(expiresAt: string): string {
  if (!expiresAt) return ''
  return new Date(expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntil(expiresAt: string): number {
  if (!expiresAt) return 0
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
