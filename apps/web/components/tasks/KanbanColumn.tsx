"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import TaskCard from "./TaskCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Task {
  id: string
  title: string
  priority: string
  dueDate: string | null
  serviceId: string
}

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
  color: string
}

export default function KanbanColumn({
  id,
  title,
  tasks,
  color,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const taskIds = tasks.map((task) => task.id)

  return (
    <div
      ref={setNodeRef}
      className={`${color} rounded-lg p-4 min-h-[600px] flex flex-col ${
        isOver ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
    >
      {/* Header with title and count badge */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Badge className="bg-white text-gray-700 border-gray-200 text-xs">
          {tasks.length}
        </Badge>
      </div>

      {/* SortableContext with tasks */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No tasks
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </SortableContext>

      {/* Add Task button at bottom */}
      <Button
        variant="ghost"
        size="sm"
        className="text-sm text-gray-600 hover:text-gray-900 mt-4 w-full justify-start"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>
    </div>
  )
}

