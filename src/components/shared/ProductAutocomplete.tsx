import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function ProductAutocomplete({
  value, products, onSelect, onChange, placeholder = 'Select or type service name',
}: {
  value: string
  products: { id: string; name: string; hsnCode: string; unit: string; rate: number; gstRate: number }[]
  onSelect: (productId: string) => void
  onChange: (text: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const matches = value
    ? products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
    : products

  const updateRect = () => {
    if (!inputRef.current) return
    const r = inputRef.current.getBoundingClientRect()
    setRect({ top: r.bottom + 4, left: r.left, width: r.width })
  }

  const handleFocus = () => {
    updateRect()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const inWrap = wrapRef.current?.contains(target)
      const inPanel = panelRef.current?.contains(target)
      if (!inWrap && !inPanel) setOpen(false)
    }
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
      />
      {open && rect && matches.length > 0 && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: rect.top, left: rect.left, width: Math.max(rect.width, 260) }}
          className="max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          {matches.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p.id); setOpen(false) }}
              className="block w-full text-left px-2 py-1.5 hover:bg-brand-50 hover:text-brand-800"
            >
              <p className="text-xs font-medium text-gray-700">{p.name}</p>
              <p className="text-[11px] text-gray-400">
                HSN: {p.hsnCode || '—'} · Unit: {p.unit || '—'} · Rate: ₹{p.rate} · GST: {p.gstRate}%
              </p>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
