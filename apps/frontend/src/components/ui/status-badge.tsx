import { memo } from "react"
import type React from "react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  variant: "danger" | "warning" | "info" | "success" | "neutral"
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  danger: "bg-red-20 text-red-700 border-red-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  success: "bg-green-100 text-general-20 border-green-200",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
}

function StatusBadgeComponent({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export const StatusBadge = memo(StatusBadgeComponent)
