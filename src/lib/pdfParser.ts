import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const texts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item: any) => item.str).join('\n')
    texts.push(pageText)
  }
  return texts.join('\n')
}

export interface ParsedPO {
  supplierInvoiceNo: string
  date: string
  supplierName: string
  supplierAddress: string
  supplierGST: string
  supplierState: string
  vendorCode: string
  deliveryDate: string
  paymentTerms: string
  deliveryTerms: string
  scopeOfSupply: string
  items: ParsedItem[]
  subtotal: number
  totalCgst: number
  totalSgst: number
  totalIgst: number
  totalGst: number
  grandTotal: number
  gstType: 'intra' | 'inter'
  notes: string
}

export interface ParsedItem {
  id: string
  materialCode: string
  description: string
  specification: string
  hsnCode: string
  quantity: number
  unit: string
  rate: number
  gstRate: number
  amount: number
  cgst: number
  sgst: number
  igst: number
  total: number
}

function cleanNum(s: string): number {
  return parseFloat(s.replace(/,/g, '').trim()) || 0
}

// Convert DD.MM.YYYY or DD/MM/YYYY to YYYY-MM-DD
function parseDate(s: string): string {
  const m = s.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/)
  if (!m) return ''
  const [, d, mo, y] = m
  const year = y.length === 2 ? `20${y}` : y
  return `${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Sterlite-format PO parser ────────────────────────────────────────────────
function parseSterlitePO(lines: string[], full: string): Partial<ParsedPO> {
  // The header labels ("Vendor code", "Purchase order no", "Purchase order date",
  // "Page no") are extracted as a block, and their actual values show up much later
  // as a separate block of 4 consecutive lines ending in the "Page no" value — so
  // instead of reading the line right after each label (which grabs unrelated text
  // in between), find that value block by its distinctive last line. The "1 of 6"
  // page marker itself sometimes splits into two text items/lines ("1 of" + "6"),
  // so match either the combined form or the split form.
  let pageNoIdx = lines.findIndex(l => /^\d+\s+of\s+\d+$/i.test(l.trim()))
  if (pageNoIdx < 0) {
    // Split form: "1 of" and "6" as two separate lines — anchor on the first ("1 of"),
    // which sits at the same relative offset the combined line would have occupied.
    pageNoIdx = lines.findIndex((l, i) => /^\d+\s+of$/i.test(l.trim()) && /^\d+$/.test(lines[i + 1]?.trim() || ''))
  }
  const vendorCode = pageNoIdx >= 3 ? lines[pageNoIdx - 3]?.trim() || '' : ''
  const supplierInvoiceNo = pageNoIdx >= 2 ? lines[pageNoIdx - 2]?.trim() || '' : ''
  const rawDate = pageNoIdx >= 1 ? lines[pageNoIdx - 1]?.trim() || '' : ''
  const date = parseDate(rawDate || '')

  // We want the BUYER (the company that issued this PO to us) for the "Supplier"
  // fields here — but text extraction flattens the two-column "VENDOR DETAILS" /
  // "BUYER DETAILS" layout out of visual order, and there are no blank-line gaps
  // separating the vendor's own info from the buyer's, so a purely positional skip
  // is unreliable. Anchor instead on "Plot No." — Sterlite's registered office
  // address always starts with it — and take the line right before it as the name.
  let supplierName = ''
  let supplierAddress = ''
  const plotNoIdx = lines.findIndex(l => /^Plot No\.?\s/i.test(l.trim()))
  if (plotNoIdx > 0) {
    supplierName = lines[plotNoIdx - 1]?.trim() || ''
    const addrLines = [lines[plotNoIdx].trim()]
    if (lines[plotNoIdx + 1]?.trim() === 'India') addrLines.push('India')
    supplierAddress = addrLines.join(', ')
  } else {
    // Fallback for PO formats without a "Plot No." address: take the second
    // 'Name'/'Address' label pair's value block, skipping past anything that
    // looks like a phone number or GSTIN left over from the vendor's own info.
    const vendorDetailsIdx = lines.findIndex(l => l.trim() === 'VENDOR DETAILS')
    if (vendorDetailsIdx >= 0) {
      const searchEnd = Math.min(vendorDetailsIdx + 60, lines.length)
      const nameLabelIndices: number[] = []
      for (let i = vendorDetailsIdx; i < searchEnd; i++) {
        if (lines[i].trim() === 'Name' && lines[i + 1]?.trim() === 'Address') nameLabelIndices.push(i)
      }
      const secondLabelIdx = nameLabelIndices[1]
      if (secondLabelIdx !== undefined) {
        let cursor = secondLabelIdx + 2
        while (cursor < searchEnd && lines[cursor].trim() !== 'India') cursor++
        cursor++
        const looksLikeMetadata = (v: string) =>
          /^[+\d][\d\s\-+]*$/.test(v) || /^[0-9]{2}[A-Z0-9]{13}$/i.test(v)
        while (cursor < searchEnd && (!lines[cursor].trim() || looksLikeMetadata(lines[cursor].trim()))) cursor++
        supplierName = lines[cursor]?.trim() || ''
        cursor++
        const addrLines: string[] = []
        while (cursor < searchEnd) {
          const v = lines[cursor].trim()
          if (!v) { cursor++; continue }
          if (v === 'India') { addrLines.push(v); cursor++; break }
          if (['Country', 'Contact person', 'Phone', 'Fax', 'Website', 'Email'].includes(v)) break
          addrLines.push(v)
          cursor++
        }
        supplierAddress = addrLines.join(', ')
      }
    }
  }

  // Buyer GST — "GST No.: XXXXX"
  const gstNoMatch = full.match(/GST\s*No\.\s*[:]\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])/i)
  const supplierGST = gstNoMatch?.[1] || ''

  // Delivery date — after 'Delivery date' or 'Day'
  const delivMatch = full.match(/(?:Delivery date|Day)\s+([\d.\/\-]+)/)
  const deliveryDate = delivMatch ? parseDate(delivMatch[1]) : ''

  // Payment terms — prefer detailed text on page 3 over the brief header line
  const detailedPayMatch = full.match(/Terms of payment\s*:\s*\n([\s\S]{1,300}?)(?:\n\n|\nWarranties|\nDelivery\s*:)/i)
  const briefPayMatch = full.match(/Terms of payment\s*\n([^\n]+)/)
  const paymentTerms = detailedPayMatch
    ? detailedPayMatch[1].replace(/\s+/g, ' ').trim()
    : (briefPayMatch?.[1]?.trim() || '')

  // Delivery terms (e.g. "DAP- Shendra")
  const delivTermsMatch = full.match(/Terms of delivery\s*:\s*\n([^\n]+)/i)
    || full.match(/DAP[- ][^\n,]+/i)
  const deliveryTerms = delivTermsMatch ? delivTermsMatch[0].replace(/Terms of delivery\s*:\s*/i, '').trim() : ''

  // Scope of supply header
  const scopeMatch = full.match(/Scope of supply[^\n]*/i)
  const scopeOfSupply = scopeMatch ? scopeMatch[0].trim() : ''

  // Totals from summary section
  const totalNetMatch = full.match(/Total net item value\s+INR\s+([\d,]+\.?\d*)/)
  const totalTaxMatch = full.match(/Total taxes on PO\s+INR\s+([\d,]+\.?\d*)/)
  const subtotal = totalNetMatch ? cleanNum(totalNetMatch[1]) : 0
  const totalGst = totalTaxMatch ? cleanNum(totalTaxMatch[1]) : 0
  const grandTotal = subtotal + totalGst

  // ── Parse items ──
  // Pattern per item in Sterlite PO:
  // Sr line (10/20/30...), material-code line, description line,
  // HSN line (8-digit), qty+unit line (e.g. "20 NUMBER" or "3,500 m"),
  // rate line (number with decimals), net-value line
  // Then: CGST amount, SGST amount (each 9% of net-value)

  const items: ParsedItem[] = []

  // Find all Sr positions — lines that are just numbers like 10, 20, 30 ... 90
  const srPattern = /^\d+$/
  const srIndices: number[] = []
  for (let i = 0; i < lines.length; i++) {
    const v = lines[i].trim()
    if (srPattern.test(v)) {
      const n = parseInt(v)
      if (n >= 10 && n <= 990 && n % 10 === 0) {
        // Confirm it's likely a Sr by checking if there's a 6-9 digit material code nearby
        const next = lines[i + 1]?.trim() || ''
        if (/^\d{6,10}$/.test(next)) {
          srIndices.push(i)
        }
      }
    }
  }

  for (let si = 0; si < srIndices.length; si++) {
    const start = srIndices[si]
    const end = srIndices[si + 1] ?? lines.length

    const block = lines.slice(start, end)

    // Description — line after material code
    let description = ''
    let hsnCode = ''
    let qty = 0
    let unit = 'Nos'
    let rate = 0
    let amount = 0
    let cgst = 0
    let sgst = 0

    // Material code is the line after Sr (index 1)
    const materialCode = block[1]?.trim() || ''

    // Description: scan from index 2 onward for the first line that's actually free
    // text (not a code/number/unit/spec/metadata line), since some PDFs insert a
    // blank line before the description, which threw off a fixed block[2] index.
    // The description itself is always a single line (e.g. "Deliv. date ..." follows
    // immediately after it), so take only the first match — don't concatenate.
    const isNonDescriptionLine = (l: string) =>
      l === '' ||
      /^\d+$/.test(l) ||
      /^\d{6,10}$/.test(l) ||
      /^\d{8}$/.test(l) ||
      /^[\d,]+(\.\d+)?$/.test(l) ||
      /^Make\s*:/i.test(l) ||
      /^Standard\s*-/i.test(l) ||
      /^Deliv\.?\s*date/i.test(l) ||
      /^([\d,]+(?:\.\d+)?)\s+(NUMBER|NO|NOS|m|M|KG|MTR|Mtr|meter)/i.test(l) ||
      /^INR$/i.test(l)

    for (let bi = 2; bi < block.length; bi++) {
      const l = block[bi].trim()
      if (!isNonDescriptionLine(l)) {
        description = l
        break
      }
    }
    description = description || block[2]?.trim() || ''

    // Specification/Make — line starting with "Make :" in the block
    let specification = ''
    for (const line of block) {
      if (/^Make\s*:/i.test(line.trim()) || /^Standard\s*-/i.test(line.trim())) {
        specification = line.trim()
        break
      }
    }

    // Find HSN — 8-digit number in block
    for (const line of block) {
      if (/^\d{8}$/.test(line.trim())) {
        hsnCode = line.trim()
        break
      }
    }

    // Find qty+unit line — pattern like "20 NUMBER" or "3,500 m" or "4 NUMBER" or "8 NUMBER" or "10 NUMBER"
    const qtyLinePattern = /^([\d,]+(?:\.\d+)?)\s+(NUMBER|NO|NOS|m|M|KG|MTR|Mtr|meter)/i
    for (const line of block) {
      const m = line.trim().match(qtyLinePattern)
      if (m) {
        qty = cleanNum(m[1])
        const rawUnit = m[2].toUpperCase()
        unit = rawUnit === 'NUMBER' || rawUnit === 'NO' || rawUnit === 'NOS' ? 'Nos'
          : rawUnit === 'M' || rawUnit === 'MTR' || rawUnit === 'METER' ? 'Mtr'
          : rawUnit
        break
      }
    }

    // Find the net value (large number) and rate (per unit price)
    // Net value appears as a standalone large number line
    const numLines = block
      .map(l => l.trim())
      .filter(l => /^[\d,]+\.\d{2}$/.test(l))
      .map(cleanNum)
      .filter(n => n > 0)
      .sort((a, b) => a - b)

    // Rate is smallest significant number, amount is qty * rate
    // Find lines that look like amounts (>100 typically)
    if (numLines.length >= 2) {
      // Rate per unit — usually appears near "INR ... 1 NO"
      const rateMatch = block.join('\n').match(/([\d,]+\.\d{2})\s*\nINR\s*\n\s*1\s*(?:NO|M|NUMBER)/i)
      if (rateMatch) rate = cleanNum(rateMatch[1])
      else rate = numLines[0]  // fallback: smallest number is unit rate

      // Net value = qty * rate rounded
      amount = Math.round(qty * rate * 100) / 100

      // CGST and SGST — last two numbers in numLines that are equal (9% each)
      const cgstSgstCandidates = numLines.filter(n => Math.abs(n - amount * 0.09) < 5)
      if (cgstSgstCandidates.length >= 1) {
        cgst = cgstSgstCandidates[0]
        sgst = cgstSgstCandidates[0]
      } else {
        cgst = Math.round(amount * 0.09 * 100) / 100
        sgst = cgst
      }
    }

    if (description && (qty > 0 || amount > 0)) {
      const total = amount + cgst + sgst
      items.push({
        id: uuid(),
        materialCode,
        description,
        specification,
        hsnCode,
        quantity: qty,
        unit,
        rate,
        gstRate: 18,
        amount,
        cgst,
        sgst,
        igst: 0,
        total,
      })
    }
  }

  const totalCgst = items.reduce((s, i) => s + i.cgst, 0)
  const totalSgst = items.reduce((s, i) => s + i.sgst, 0)

  return {
    supplierInvoiceNo,
    date,
    supplierName,
    supplierAddress,
    supplierGST,
    supplierState: 'Maharashtra',
    vendorCode: vendorCode || '',
    deliveryDate,
    paymentTerms,
    deliveryTerms,
    scopeOfSupply,
    items,
    subtotal: subtotal || items.reduce((s, i) => s + i.amount, 0),
    totalCgst: totalCgst || Math.round(totalGst / 2),
    totalSgst: totalSgst || Math.round(totalGst / 2),
    totalIgst: 0,
    totalGst: totalGst || (totalCgst + totalSgst),
    grandTotal: grandTotal || items.reduce((s, i) => s + i.total, 0),
    gstType: 'intra',
    notes: '',
  }
}

// ─── Generic fallback parser ──────────────────────────────────────────────────
function parseGenericPO(lines: string[], full: string): Partial<ParsedPO> {
  const invMatch = full.match(/(?:Invoice|Bill|PO|Order)\s*No[:\.\s]*([A-Z0-9\-\/]+)/i)
  const supplierInvoiceNo = invMatch?.[1]?.trim() || ''

  const dateMatch = full.match(/(?:Date|Dated)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i)
    || full.match(/(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/)
  const date = dateMatch ? parseDate(dateMatch[1] || dateMatch[0]) : ''

  const gstMatches = full.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]/g) || []
  const supplierGST = gstMatches[0] || ''

  const totalMatch = full.match(/(?:Grand\s*Total|Total\s*Amount|Net\s*Amount)[:\s₹Rs.]*([0-9,]+\.?\d{0,2})/i)
  const grandTotal = totalMatch ? cleanNum(totalMatch[1]) : 0

  const subtotalMatch = full.match(/(?:Taxable|Sub\s*Total|Basic)[:\s₹Rs.]*([0-9,]+\.?\d{0,2})/i)
  const subtotal = subtotalMatch ? cleanNum(subtotalMatch[1]) : 0

  const cgstMatch = full.match(/CGST[:\s₹Rs.]*([0-9,]+\.?\d{0,2})/i)
  const sgstMatch = full.match(/SGST[:\s₹Rs.]*([0-9,]+\.?\d{0,2})/i)
  const igstMatch = full.match(/IGST[:\s₹Rs.]*([0-9,]+\.?\d{0,2})/i)
  const totalCgst = cgstMatch ? cleanNum(cgstMatch[1]) : 0
  const totalSgst = sgstMatch ? cleanNum(sgstMatch[1]) : 0
  const totalIgst = igstMatch ? cleanNum(igstMatch[1]) : 0
  const totalGst = totalCgst + totalSgst + totalIgst
  const gstType: 'intra' | 'inter' = totalIgst > 0 ? 'inter' : 'intra'

  return {
    supplierInvoiceNo,
    date,
    supplierName: lines[0] || '',
    supplierAddress: '',
    supplierGST,
    supplierState: '',
    vendorCode: '',
    deliveryDate: '',
    paymentTerms: '',
    deliveryTerms: '',
    scopeOfSupply: '',
    items: [],
    subtotal: subtotal || (grandTotal - totalGst),
    totalCgst,
    totalSgst,
    totalIgst,
    totalGst,
    grandTotal,
    gstType,
    notes: '',
  }
}

export function parsePDFText(rawText: string): Partial<ParsedPO> {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const full = rawText

  // Detect Sterlite PO format
  const isSterlite = full.includes('Purchase order no') && full.includes('VENDOR DETAILS') && full.includes('BUYER DETAILS')
  if (isSterlite) return parseSterlitePO(lines, full)

  return parseGenericPO(lines, full)
}
