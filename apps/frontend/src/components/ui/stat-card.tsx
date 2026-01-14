import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  variant?: "default" | "danger" | "warning"
  className?: string
}

const variantStyles = {
  default: "bg-white border-gray-200",
  danger: "bg-red-50 border-red-200",
  warning: "bg-yellow-50 border-yellow-200",
}

export function StatCard({ icon: Icon, value, label, variant = "default", className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border p-6 shadow-md", variantStyles[variant], className)}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  )
}
