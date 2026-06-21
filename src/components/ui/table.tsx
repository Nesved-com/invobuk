import * as React from 'react'
import { cn } from '@/lib/utils'

/* ── Wrapper ──────────────────────────────────────────────────────────── */
function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm border-collapse', className)} {...props} />
    </div>
  )
}

/* ── Head ─────────────────────────────────────────────────────────────── */
function Thead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(className)} {...props} />
}

/* ── Header row ───────────────────────────────────────────────────────── */
function THeadRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'bg-gradient-to-r from-gray-50 to-gray-50/60 border-b border-gray-200',
        className
      )}
      {...props}
    />
  )
}

/* ── Header cell ──────────────────────────────────────────────────────── */
function Th({
  className,
  align = 'left',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'center' | 'right' }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest select-none whitespace-nowrap',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        align === 'left' && 'text-left',
        className
      )}
      {...props}
    />
  )
}

/* ── Body ─────────────────────────────────────────────────────────────── */
function Tbody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-gray-100', className)} {...props} />
}

/* ── Body row ─────────────────────────────────────────────────────────── */
function Tr({
  className,
  clickable,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean }) {
  return (
    <tr
      className={cn(
        'group transition-colors duration-100',
        clickable ? 'cursor-pointer hover:bg-brand-50/40' : 'hover:bg-gray-50/60',
        className
      )}
      {...props}
    />
  )
}

/* ── Body cell ────────────────────────────────────────────────────────── */
function Td({
  className,
  align = 'left',
  muted,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'center' | 'right'
  muted?: boolean
}) {
  return (
    <td
      className={cn(
        'px-4 py-3 whitespace-nowrap',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        muted ? 'text-gray-400 text-xs' : 'text-gray-700',
        className
      )}
      {...props}
    />
  )
}

/* ── Empty state row ──────────────────────────────────────────────────── */
function TEmpty({
  colSpan,
  icon,
  message,
  action,
}: {
  colSpan: number
  icon?: React.ReactNode
  message: string
  action?: React.ReactNode
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        {icon && <div className="flex justify-center mb-3 text-gray-300">{icon}</div>}
        <p className="text-gray-400 text-sm">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </td>
    </tr>
  )
}

/* ── Table container (card wrapper) ──────────────────────────────────── */
function TableCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden',
        className
      )}
      {...props}
    />
  )
}

export { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard }
