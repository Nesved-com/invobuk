import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  if (!date) return ''
  return format(new Date(date), 'dd MMM yyyy')
}

export function getFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const year = now.getFullYear()
  // FY starts April (month 4)
  const fyStart = month >= 4 ? year : year - 1
  const fyEnd = fyStart + 1
  return `${fyStart}-${String(fyEnd).slice(-2)}`
}

export function generateDocNumber(prefix: string, count: number): string {
  return `${prefix}-${getFinancialYear()}-${String(count + 1).padStart(2, '0')}`
}

// Custom document numbering. Supports tokens: {FY} financial year (e.g. 2025-26),
// {SEQ} sequence number padded to 2 digits, {SEQ:n} padded to n digits,
// {YYYY}/{MM}/{DD} today's date parts.
export function generateDocNumberFromFormat(format: string, count: number): string {
  const now = new Date()
  const seq = count + 1
  return format
    .replace(/\{FY\}/g, getFinancialYear())
    .replace(/\{SEQ:(\d+)\}/g, (_, n) => String(seq).padStart(Number(n), '0'))
    .replace(/\{SEQ\}/g, String(seq).padStart(2, '0'))
    .replace(/\{YYYY\}/g, String(now.getFullYear()))
    .replace(/\{MM\}/g, String(now.getMonth() + 1).padStart(2, '0'))
    .replace(/\{DD\}/g, String(now.getDate()).padStart(2, '0'))
}

export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convert(n: number): string {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
  }

  const rupees = Math.floor(num)
  const paise = Math.round((num - rupees) * 100)
  let result = convert(rupees) + ' Rupees'
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise'
  return result + ' Only'
}
