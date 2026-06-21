#!/usr/bin/env node
// Manually binds an existing license key to a specific machine ID — use this when
// you want to pre-activate a license for a customer yourself (e.g. they sent you
// their Machine ID from the app's activation screen) instead of having them paste
// the key in themselves.
//
// Usage:
//   INVOBUK_ADMIN_SECRET=<secret> node scripts/assign-license.js \
//     --key INV-XXXX-XXXX-XXXX --machine <machine-id> [--label "Customer's PC"] [--force]

const FUNCTIONS_URL = 'https://mqsqfbvoupzxqmbyxugd.supabase.co/functions/v1/assign-license'

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--force') { out.force = true; continue }
    if (argv[i].startsWith('--')) {
      out[argv[i].slice(2)] = argv[i + 1]
      i++
    }
  }
  return out
}

async function main() {
  const adminSecret = process.env.INVOBUK_ADMIN_SECRET
  if (!adminSecret) {
    console.error('Set INVOBUK_ADMIN_SECRET in your environment before running this script.')
    process.exit(1)
  }

  const args = parseArgs(process.argv.slice(2))
  if (!args.key || !args.machine) {
    console.log('Usage: INVOBUK_ADMIN_SECRET=<secret> node scripts/assign-license.js --key INV-XXXX-XXXX-XXXX --machine <machine-id> [--label "..."] [--force]')
    process.exit(1)
  }

  const res = await fetch(FUNCTIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
    body: JSON.stringify({
      licenseKey: args.key,
      machineId: args.machine,
      machineLabel: args.label,
      force: !!args.force,
    }),
  })

  const data = await res.json()
  if (!res.ok || !data.ok) {
    console.error('Failed:', data.reason || data)
    process.exit(1)
  }

  console.log('')
  console.log(data.note || `Bound ${args.key} to machine ${args.machine}.`)
  if (data.customerName) console.log(`Customer: ${data.customerName}`)
  if (data.expiresAt) console.log(`Expires:  ${data.expiresAt}`)
  console.log('')
}

main()
