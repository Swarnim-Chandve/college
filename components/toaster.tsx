"use client"

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export default function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        if (!title && !description) return null
        const isDestructive = (props as any)?.variant === "destructive"
        return (
          <Toast key={id} {...props}>
            {title && <ToastTitle className={isDestructive ? "text-white" : undefined}>{title}</ToastTitle>}
            {description && (
              <ToastDescription className={isDestructive ? "text-white/90" : undefined}>
                {description}
              </ToastDescription>
            )}
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}


