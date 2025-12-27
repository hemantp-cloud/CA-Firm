"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import ServicesKanbanColumn from "./ServicesKanbanColumn"
import ServiceCard from "./ServiceCard"
import { Card } from "@/components/ui/card"

interface Service {
  id: string
  title: string
  type: string
  status: string
  dueDate: string | null
  feeAmount: number | null
  client: {
    id: string
    name: string
  } | null
}

interface ServicesKanbanBoardProps {
  services: Service[]
  onStatusUpdate: (serviceId: string, newStatus: string) => void
}

const columns = [
  { id: "PENDING", title: "Pending", color: "bg-gray-50 dark:bg-gray-800" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "UNDER_REVIEW", title: "Under Review", color: "bg-yellow-50 dark:bg-yellow-900/20" },
  { id: "COMPLETED", title: "Completed", color: "bg-green-50 dark:bg-green-900/20" },
]

export default function ServicesKanbanBoard({
  services,
  onStatusUpdate,
}: ServicesKanbanBoardProps) {
  const [activeService, setActiveService] = useState<Service | null>(null)

  // Group services by status
  const groupedServices: Record<string, Service[]> = {
    PENDING: [],
    IN_PROGRESS: [],
    UNDER_REVIEW: [],
    COMPLETED: [],
    CANCELLED: [],
  }

  services.forEach((service) => {
    const status = service.status as keyof typeof groupedServices
    if (groupedServices[status]) {
      groupedServices[status].push(service)
    }
  })

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const service = services.find((s) => s.id === active.id)
    if (service) {
      setActiveService(service)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveService(null)

    if (!over) return

    const serviceId = active.id as string
    const newStatus = over.id as string

    // Check if dropped on a valid column
    if (columns.some((col) => col.id === newStatus)) {
      const service = services.find((s) => s.id === serviceId)
      if (service && service.status !== newStatus) {
        await onStatusUpdate(serviceId, newStatus)
      }
    }
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <SortableContext
            key={column.id}
            id={column.id}
            items={groupedServices[column.id] || []}
            strategy={verticalListSortingStrategy}
          >
            <ServicesKanbanColumn
              id={column.id}
              title={column.title}
              color={column.color}
              services={groupedServices[column.id] || []}
            />
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeService ? (
          <Card className="w-64 p-4 shadow-lg">
            <ServiceCard service={activeService} isDragging />
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

