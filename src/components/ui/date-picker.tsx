import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-day-picker/style.css'

interface DatePickerProps {
  value: string           // ISO date string YYYY-MM-DD
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value, onChange, label, placeholder = 'Pick a date', error, disabled, className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = React.useMemo(() => {
    if (!value) return undefined
    const d = parse(value, 'yyyy-MM-dd', new Date())
    return isValid(d) ? d : undefined
  }, [value])

  const displayValue = selected ? format(selected, 'dd MMM yyyy') : ''

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 text-sm text-left',
              'transition-all duration-150 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400',
              'disabled:cursor-not-allowed disabled:opacity-50',
              open && 'ring-2 ring-brand-100 border-brand-400',
              error ? 'border-red-300' : 'border-gray-200',
            )}
          >
            <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className={displayValue ? 'text-gray-900 flex-1' : 'text-gray-400 flex-1'}>
              {displayValue || placeholder}
            </span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className={cn(
              'z-50 rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10 p-3',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            )}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(date) => {
                onChange(date ? format(date, 'yyyy-MM-dd') : '')
                setOpen(false)
              }}
              defaultMonth={selected}
              showOutsideDays
              classNames={{
                root: 'rdp-custom',
                months: 'flex flex-col',
                month: 'space-y-3',
                month_caption: 'flex justify-center items-center relative py-1',
                caption_label: 'text-sm font-semibold text-gray-800',
                nav: 'flex items-center gap-1 absolute inset-x-1 top-1 justify-between pointer-events-none',
                button_previous: 'pointer-events-auto h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors',
                button_next: 'pointer-events-auto h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors',
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'text-gray-400 w-8 font-medium text-xs text-center pb-1',
                weeks: '',
                week: 'flex w-full mt-1',
                day: 'text-center text-sm p-0',
                day_button: 'h-8 w-8 rounded-lg text-sm font-normal text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors mx-auto flex items-center justify-center',
                selected: '[&>button]:bg-brand-600 [&>button]:text-white [&>button]:hover:bg-brand-700 [&>button]:font-semibold',
                today: '[&>button]:font-bold [&>button]:text-brand-600 [&>button]:bg-brand-50',
                outside: '[&>button]:text-gray-300',
                disabled: '[&>button]:text-gray-200 [&>button]:cursor-not-allowed',
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
