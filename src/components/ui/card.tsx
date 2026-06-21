import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  headerRight?: React.ReactNode
  accent?: 'brand' | 'amber' | 'green' | 'red' | 'purple'
}

const accentColors = {
  brand:  'from-brand-50 to-transparent border-brand-100',
  amber:  'from-amber-50 to-transparent border-amber-100',
  green:  'from-green-50 to-transparent border-green-100',
  red:    'from-red-50 to-transparent border-red-100',
  purple: 'from-purple-50 to-transparent border-purple-100',
}

const accentTitles = {
  brand:  'text-brand-800',
  amber:  'text-amber-800',
  green:  'text-green-800',
  red:    'text-red-800',
  purple: 'text-purple-800',
}

function Card({ className, title, subtitle, headerRight, accent, children, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden', className)}
      {...props}
    >
      {title && (
        <div className={cn(
          'flex items-center justify-between px-5 py-3.5 border-b border-gray-100',
          accent && `bg-gradient-to-r ${accentColors[accent]}`
        )}>
          <div>
            <h3 className={cn('font-bold text-sm', accent ? accentTitles[accent] : 'text-gray-800')}>
              {title}
            </h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  )
}

function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

export { Card, CardBody }
