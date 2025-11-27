"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import KanbanColumn from "./KanbanColumn"
import TaskCard from "./TaskCard"
import api from "@/lib/api"

interface Task {
  id: string
  title: string
  priority: string
  dueDate: string | null
  serviceId: string
}

interface ApiTask {
  id: string
  title: string
  priority: string
  dueDate: string | null
  service: {
    id: string
  }
}

interface TasksData {
  TO_DO: Task[]
  IN_PROGRESS: Task[]
  REVIEW: Task[]
  DONE: Task[]
}

interface ApiTasksData {
  TO_DO: ApiTask[]
  IN_PROGRESS: ApiTask[]
  REVIEW: ApiTask[]
  DONE: ApiTask[]
}

interface KanbanBoardProps {
  initialTasks: ApiTasksData | TasksData
  onTaskMove?: (taskId: string, newStatus: string) => void
}

// Transform API tasks to TaskCard format
const transformTasks = (apiTasks: ApiTasksData | TasksData): TasksData => {
  const transformed: TasksData = {
    TO_DO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
  }

  Object.keys(transformed).forEach((status) => {
    const tasks = apiTasks[status as keyof typeof apiTasks] || []
    transformed[status as keyof TasksData] = tasks.map((task: ApiTask | Task) => {
      // Check if task already has serviceId (already transformed)
      if ("serviceId" in task) {
        return task as Task
      }
      // Transform from API format
      return {
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        serviceId: (task as ApiTask).service.id,
      }
    })
  })

  return transformed
}

const columns = [
  { id: "TO_DO", title: "To Do", color: "bg-gray-100" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-50" },
  { id: "REVIEW", title: "Review", color: "bg-yellow-50" },
  { id: "DONE", title: "Done", color: "bg-green-50" },
]

export default function KanbanBoard({
  initialTasks,
  onTaskMove,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TasksData>(() =>
    transformTasks(initialTasks)
  )
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Find task by id across all columns
  const findTask = (id: string): { task: Task; columnId: string } | null => {
    for (const columnId of Object.keys(tasks) as Array<keyof TasksData>) {
      const task = tasks[columnId].find((t) => t.id === id)
      if (task) {
        return { task, columnId }
      }
    }
    return null
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const found = findTask(active.id as string)
    if (found) {
      setActiveTask(found.task)
    }
  }

  // Handle drag over (moving between columns)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeTask = findTask(active.id as string)
    const overColumnId = over.id as string

    if (!activeTask) return

    // If dragging over a column (not a task)
    if (columns.some((col) => col.id === overColumnId)) {
      const newStatus = overColumnId
      if (activeTask.columnId !== newStatus) {
        setTasks((prevTasks) => {
          const newTasks = { ...prevTasks }
          // Remove from old column
          newTasks[activeTask.columnId as keyof TasksData] = prevTasks[
            activeTask.columnId as keyof TasksData
          ].filter((t) => t.id !== active.id)
          // Add to new column
          newTasks[newStatus as keyof TasksData] = [
            ...prevTasks[newStatus as keyof TasksData],
            activeTask.task,
          ]
          return newTasks
        })
      }
    } else {
      // Dragging over another task
      const overTask = findTask(over.id as string)
      if (!overTask) return

      if (activeTask.columnId !== overTask.columnId) {
        // Moving to different column
        setTasks((prevTasks) => {
          const newTasks = { ...prevTasks }
          // Remove from old column
          newTasks[activeTask.columnId as keyof TasksData] = prevTasks[
            activeTask.columnId as keyof TasksData
          ].filter((t) => t.id !== active.id)
          // Add to new column at the position of over task
          const overIndex = prevTasks[overTask.columnId as keyof TasksData].findIndex(
            (t) => t.id === over.id
          )
          const newColumnTasks = [...prevTasks[overTask.columnId as keyof TasksData]]
          newColumnTasks.splice(overIndex, 0, activeTask.task)
          newTasks[overTask.columnId as keyof TasksData] = newColumnTasks
          return newTasks
        })
      } else {
        // Reordering within same column
        setTasks((prevTasks) => {
          const columnTasks = prevTasks[activeTask.columnId as keyof TasksData]
          const oldIndex = columnTasks.findIndex((t) => t.id === active.id)
          const newIndex = columnTasks.findIndex((t) => t.id === over.id)

          const newTasks = { ...prevTasks }
          newTasks[activeTask.columnId as keyof TasksData] = arrayMove(
            columnTasks,
            oldIndex,
            newIndex
          )
          return newTasks
        })
      }
    }
  }

  // Handle drag end (finalize move and call API)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveTask(null)

    if (!over) return

    const activeTask = findTask(active.id as string)
    if (!activeTask) return

    const overColumnId = over.id as string

    // Check if dropped on a column
    if (columns.some((col) => col.id === overColumnId)) {
      const newStatus = overColumnId
      if (activeTask.columnId !== newStatus) {
        // Update task status via API
        try {
          await api.patch(`/tasks/${active.id}/status`, {
            status: newStatus,
          })

          // Call onTaskMove callback if provided
          if (onTaskMove) {
            onTaskMove(active.id as string, newStatus)
          }
        } catch (error) {
          console.error("Failed to update task status:", error)
          // Revert on error
          setTasks(transformTasks(initialTasks))
        }
      }
    } else {
      // Dropped on another task
      const overTask = findTask(over.id as string)
      if (!overTask) return

      if (activeTask.columnId !== overTask.columnId) {
        // Moved to different column
        try {
          await api.patch(`/tasks/${active.id}/status`, {
            status: overTask.columnId,
          })

          // Call onTaskMove callback if provided
          if (onTaskMove) {
            onTaskMove(active.id as string, overTask.columnId)
          }
        } catch (error) {
          console.error("Failed to update task status:", error)
          // Revert on error
          setTasks(transformTasks(initialTasks))
        }
      }
    }
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={tasks[column.id as keyof TasksData] || []}
            color={column.color}
          />
        ))}
      </div>

      {/* DragOverlay for smooth dragging visual */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
