import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './button'

interface ConfirmOptions {
  title?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider')
  return ctx
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ message: string; options?: ConfirmOptions } | null>(null)
  const resolveRef = useRef<(value: boolean) => void>()

  const confirm = useCallback<ConfirmFn>((message, options) => {
    setState({ message, options })
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handle = (result: boolean) => {
    resolveRef.current?.(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${state.options?.danger === false ? 'bg-brand-100' : 'bg-red-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${state.options?.danger === false ? 'text-brand-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">{state.options?.title || 'Are you sure?'}</h2>
                <p className="text-sm text-gray-500 mt-1">{state.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => handle(false)}>
                {state.options?.cancelText || 'Cancel'}
              </Button>
              <Button
                onClick={() => handle(true)}
                className={state.options?.danger === false ? '' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}
              >
                {state.options?.confirmText || 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
