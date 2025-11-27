"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, GripVertical, MoreVertical } from "lucide-react"

interface Task {
  id: string
  title: string
  priority: string
  dueDate: string | null
  serviceId: string
}

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 border-red-200",
      MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
      LOW: "bg-blue-100 text-blue-700 border-blue-200",
    }
    return colors[priority] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 hover:shadow-md transition-shadow"
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {/* GripVertical icon on left (drag handle) */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Priority badge */}
          <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
            {task.priority}
          </Badge>

          {/* MoreVertical button for actions */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto"
            onClick={(e) => {
              e.stopPropagation()
              // Handle menu click
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Task title (font-medium) */}
        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
          {task.title}
        </h4>

        {/* Service reference (text-sm, gray) */}
        <div className="text-sm text-gray-600">
          Service: {task.serviceId}
        </div>

        {/* Due date with Calendar icon */}
        {task.dueDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

