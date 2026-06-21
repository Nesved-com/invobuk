import type { LineItem } from '@/types'

export function calculateLineItem(item: Partial<LineItem>): Partial<LineItem> {
  const qty = item.quantity || 0
  const rate = item.rate || 0
  const discount = item.discount || 0
  const gstRate = item.gstRate || 0
  const gstType = item.gstRate !== undefined ? item.gstRate : 0

  const amount = qty * rate
  const discountAmt = amount * (discount / 100)
  const taxable = amount - discountAmt
  const totalGst = taxable * (gstRate / 100)
  const halfGst = totalGst / 2

  return {
    ...item,
    amount: taxable,
    cgst: halfGst,
    sgst: halfGst,
    igst: totalGst,
    total: taxable + totalGst,
  }
}

export function calculateTotals(items: LineItem[], gstType: 'intra' | 'inter') {
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0)
  const totalDiscount = items.reduce((sum, i) => {
    const gross = (i.quantity || 0) * (i.rate || 0)
    return sum + (gross - i.amount)
  }, 0)
  const totalCgst = gstType === 'intra' ? items.reduce((sum, i) => sum + i.cgst, 0) : 0
  const totalSgst = gstType === 'intra' ? items.reduce((sum, i) => sum + i.sgst, 0) : 0
  const totalIgst = gstType === 'inter' ? items.reduce((sum, i) => sum + i.igst, 0) : 0
  const totalGst = gstType === 'intra' ? totalCgst + totalSgst : totalIgst
  const grandTotal = subtotal + totalGst

  return { subtotal, totalDiscount, totalGst, totalCgst, totalSgst, totalIgst, grandTotal }
}
