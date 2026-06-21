import { cn } from '@/lib/utils'
import type { DocumentStatus } from '@/types'

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'Sent',      className: 'bg-blue-100 text-blue-700' },
  accepted:  { label: 'Accepted',  className: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-700' },
  paid:      { label: 'Paid',      className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-orange-100 text-orange-700' },
  overdue:   { label: 'Overdue',   className: 'bg-rose-100 text-rose-700' },
}

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}
