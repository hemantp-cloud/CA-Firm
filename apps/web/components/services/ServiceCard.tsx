"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Building2 } from "lucide-react"
import Link from "next/link"

interface Service {
  id: string
  title: string
  type: string
  status: string
  dueDate: string | null
  feeAmount: number | null
  user: {
    id: string
    name: string
  }
  client: {
    id: string
    name: string
  } | null
}

interface ServiceCardProps {
  service: Service
  isDragging?: boolean
}

export default function ServiceCard({ service, isDragging }: ServiceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: service.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const formatServiceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`
  }

  // Calculate progress (mock - you can add actual progress calculation)
  const getProgress = () => {
    switch (service.status) {
      case "PENDING":
        return 0
      case "IN_PROGRESS":
        return 50
      case "UNDER_REVIEW":
        return 75
      case "COMPLETED":
        return 100
      default:
        return 0
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 hover:shadow-md transition-shadow cursor-pointer"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4 space-y-3">
        {/* Service Title */}
        <Link href={`/ca/services/${service.id}`}>
          <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
            {service.title}
          </h4>
        </Link>

        {/* Service Type */}
        <Badge variant="outline" className="text-xs">
          {formatServiceType(service.type)}
        </Badge>

        {/* User Name */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{service.user.name}</span>
        </div>

        {/* Client Name */}
        {service.client && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{service.client.name}</span>
          </div>
        )}

        {/* Due Date */}
        {service.dueDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(service.dueDate)}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {getProgress()}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Amount */}
        {service.feeAmount && (
          <div className="text-xs font-medium text-gray-900 dark:text-white">
            {formatCurrency(service.feeAmount)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

