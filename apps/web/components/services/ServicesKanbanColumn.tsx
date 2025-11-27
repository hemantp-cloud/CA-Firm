"use client"

import { useDroppable } from "@dnd-kit/core"
import { Badge } from "@/components/ui/badge"
import ServiceCard from "./ServiceCard"

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

interface ServicesKanbanColumnProps {
  id: string
  title: string
  color: string
  services: Service[]
}

export default function ServicesKanbanColumn({
  id,
  title,
  color,
  services,
}: ServicesKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`${color} rounded-lg p-4 min-h-[600px] flex flex-col ${
        isOver ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <Badge className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 text-xs">
          {services.length}
        </Badge>
      </div>

      {/* Services */}
      <div className="flex-1 space-y-3">
        {services.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            No services
          </div>
        ) : (
          services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        )}
      </div>
    </div>
  )
}

