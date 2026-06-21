#!/usr/bin/env node
// Issues a new Invobuk license key by calling the issue-license Supabase Edge
// Function. Run this by NesVed only, after a customer has paid.
//
// Usage:
//   INVOBUK_ADMIN_SECRET=<secret> node scripts/issue-license.js \
//     --customer "Renuka Electronics & Electricals" \
//     --email customer@example.com \
//     --expires 2027-12-31 \
//     [--activations 1] [--plan standard] [--notes "Annual renewal"]
//
// The admin secret is the value stored in the `admin_secrets` table of the
// invobuk-licensing Supabase project. Never commit it or hardcode it here.

const FUNCTIONS_URL = 'https://mqsqfbvoupzxqmbyxugd.supabase.co/functions/v1/issue-license'

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2)
      out[key] = argv[i + 1]
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
  if (!args.customer || !args.expires) {
    console.log('Usage: INVOBUK_ADMIN_SECRET=<secret> node scripts/issue-license.js --customer "Name" --expires YYYY-MM-DD [--email e@x.com] [--activations 1] [--plan standard] [--notes "..."]')
    process.exit(1)
  }

  const res = await fetch(FUNCTIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
    body: JSON.stringify({
      customerName: args.customer,
      customerEmail: args.email,
      expiresAt: new Date(`${args.expires}T23:59:59Z`).toISOString(),
      maxActivations: args.activations ? parseInt(args.activations, 10) : 1,
      plan: args.plan,
      notes: args.notes,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('Failed:', data.error || data)
    process.exit(1)
  }

  console.log('')
  console.log('License key issued:')
  console.log(data.licenseKey)
  console.log('')
  console.log(`Customer: ${data.license.customer_name}`)
  console.log(`Expires:  ${data.license.expires_at}`)
  console.log(`Max activations: ${data.license.max_activations}`)
  console.log('')
}

main()
