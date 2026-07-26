import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:   'bg-gradient-to-br from-brand-600 to-brand-800 text-white hover:brightness-[1.06] focus:ring-brand-400 shadow-lg shadow-brand-900/20',
        secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-200',
        danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 shadow-lg shadow-red-100',
        ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:ring-gray-200',
        amber:     'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-300 shadow-lg shadow-amber-100',
      },
      size: {
        sm:   'px-3 py-1.5 text-xs',
        md:   'px-4 py-2.5 text-sm',
        lg:   'px-5 py-3 text-sm',
        icon: 'p-2',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
