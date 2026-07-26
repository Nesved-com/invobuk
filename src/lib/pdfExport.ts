import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Bottom edge (in CSS px, relative to `container`'s top) of every table row —
// these are the only places a page is allowed to break, so no row ever gets cut in half.
export function getRowBoundaries(container: HTMLElement): number[] {
  const containerRect = container.getBoundingClientRect()
  return Array.from(container.querySelectorAll('tr'))
    .map(el => el.getBoundingClientRect().bottom - containerRect.top)
    .sort((a, b) => a - b)
}

// Given the total content height and a target page height, returns the top offset
// of each page, snapping each break to the nearest row boundary at or before it.
export function computePageStarts(totalHeight: number, pageHeight: number, rowBoundaries: number[]): number[] {
  // Trailing whitespace after the last real row (e.g. the page's own bottom padding)
  // shouldn't be enough on its own to trigger an extra, otherwise-empty page — clamp
  // the pagination target to just past the last row boundary.
  const lastBoundary = rowBoundaries.length ? rowBoundaries[rowBoundaries.length - 1] : totalHeight
  const effectiveTotal = Math.min(totalHeight, lastBoundary + 1)

  const starts = [0]
  let consumed = 0
  while (consumed < effectiveTotal) {
    const idealBreak = consumed + pageHeight
    let brk = idealBreak
    if (idealBreak < effectiveTotal) {
      const candidates = rowBoundaries.filter(b => b > consumed + 1 && b <= idealBreak)
      if (candidates.length) brk = candidates[candidates.length - 1]
    } else {
      brk = effectiveTotal
    }
    consumed = brk
    if (consumed < effectiveTotal) starts.push(consumed)
  }
  return starts
}

// Renders an already-mounted DOM node (a printable document template) to multi-page
// PDF bytes, using the same row-boundary-snapped pagination as the on-screen preview.
// Defaults to A4 portrait; pass widthMm/heightMm to match a custom page size/orientation
// (e.g. from the user's manual print settings).
export async function renderNodeToPdfBytes(node: HTMLElement, page?: { widthMm: number; heightMm: number }): Promise<ArrayBuffer> {
  const widthMm = page?.widthMm ?? 210
  const heightMm = page?.heightMm ?? 297
  const rowBoundariesCss = getRowBoundaries(node)

  const canvas = await html2canvas(node, { scale: 2, useCORS: true, windowWidth: 794 })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: widthMm > heightMm ? 'landscape' : 'portrait', unit: 'mm', format: [widthMm, heightMm] })
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pdfWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pxPerMm = canvas.width / imgWidth
  const pageHeightPx = pageHeight * pxPerMm
  const rowBoundariesPx = rowBoundariesCss.map(y => y * pxPerMm)
  const starts = computePageStarts(canvas.height, pageHeightPx, rowBoundariesPx)

  starts.forEach((start, i) => {
    if (i > 0) pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, -(start / pxPerMm), imgWidth, imgHeight)
    const sliceHeightMm = ((starts[i + 1] ?? canvas.height) - start) / pxPerMm
    const gapMm = pageHeight - sliceHeightMm
    if (gapMm > 0.1) {
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, sliceHeightMm, pdfWidth, gapMm, 'F')
    }
    if (i < starts.length - 1 && gapMm > 6) {
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(10)
      pdf.setTextColor(120, 120, 120)
      pdf.text('To be Continued...', pdfWidth / 2, sliceHeightMm + 6, { align: 'center' })
    }
  })

  return pdf.output('arraybuffer')
}
