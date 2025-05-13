"use client"

import type React from "react"

import { useState } from "react"
import { Check, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Task = {
  id: string
  name: string
  completed: boolean
  pomodorosCompleted: number
  createdAt: string
}

type TaskTrackerProps = {
  tasks: Task[]
  currentTaskId: string | null
  onAddTask: (taskName: string) => void
  onToggleCompletion: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onSelectTask: (taskId: string | null) => void
}

export default function TaskTracker({
  tasks,
  currentTaskId,
  onAddTask,
  onToggleCompletion,
  onDeleteTask,
  onSelectTask,
}: TaskTrackerProps) {
  const [newTaskName, setNewTaskName] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskName.trim()) {
      onAddTask(newTaskName.trim())
      setNewTaskName("")
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed
    if (filter === "completed") return task.completed
    return true
  })

  const activeTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  return (
    <div className="space-y-4 py-4">
      {/* Add new task form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </form>

      {/* Filter tabs */}
      <div className="flex border-b">
        <button
          className={cn(
            "pb-2 px-4 text-sm font-medium",
            filter === "all" ? "border-b-2 border-primary" : "text-muted-foreground",
          )}
          onClick={() => setFilter("all")}
        >
          All ({tasks.length})
        </button>
        <button
          className={cn(
            "pb-2 px-4 text-sm font-medium",
            filter === "active" ? "border-b-2 border-primary" : "text-muted-foreground",
          )}
          onClick={() => setFilter("active")}
        >
          Active ({activeTasks.length})
        </button>
        <button
          className={cn(
            "pb-2 px-4 text-sm font-medium",
            filter === "completed" ? "border-b-2 border-primary" : "text-muted-foreground",
          )}
          onClick={() => setFilter("completed")}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {/* Task list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No tasks found</div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-md",
                task.completed ? "bg-black/10" : "bg-black/5",
                currentTaskId === task.id && "border border-primary/50",
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => onToggleCompletion(task.id)}
                  className={cn(
                    "h-5 w-5 rounded-full border flex items-center justify-center",
                    task.completed ? "bg-primary border-primary" : "border-gray-400",
                  )}
                >
                  {task.completed && <Check className="h-3 w-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      task.completed && "line-through text-muted-foreground",
                    )}
                  >
                    {task.name}
                  </p>
                  {task.pomodorosCompleted > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {task.pomodorosCompleted} pomodoro{task.pomodorosCompleted !== 1 && "s"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!task.completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectTask(currentTaskId === task.id ? null : task.id)}
                    className={cn("text-xs h-8", currentTaskId === task.id ? "bg-primary/20" : "")}
                  >
                    {currentTaskId === task.id ? "Unselect" : "Select"}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteTask(task.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {tasks.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const confirmed = window.confirm("Are you sure you want to delete all completed tasks?")
              if (confirmed) {
                completedTasks.forEach((task) => onDeleteTask(task.id))
              }
            }}
            className="text-xs"
            disabled={completedTasks.length === 0}
          >
            Clear completed
          </Button>
        </div>
      )}
    </div>
  )
}
