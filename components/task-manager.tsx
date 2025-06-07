"use client"

import type React from "react"

import { useState } from "react"
import { Plus, ChevronDown, ChevronRight, Trash2, Clock, Play, Check, Edit2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type TaskGroup = {
  id: string
  name: string
  tasks: Task[]
  isExpanded: boolean
  createdAt: string
}

type Task = {
  id: string
  name: string
  duration: number // in minutes
  completed: boolean
  pomodorosCompleted: number
  subtasks: Subtask[]
  createdAt: string
}

type Subtask = {
  id: string
  name: string
  completed: boolean
}

interface TaskManagerProps {
  taskGroups: TaskGroup[]
  setTaskGroups: React.Dispatch<React.SetStateAction<TaskGroup[]>>
  currentTaskId: string | null
  setCurrentTaskId: (taskId: string | null) => void
}

export default function TaskManager({ taskGroups, setTaskGroups, currentTaskId, setCurrentTaskId }: TaskManagerProps) {
  const [newGroupName, setNewGroupName] = useState("")
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskDuration, setNewTaskDuration] = useState(25)
  const [newSubtaskName, setNewSubtaskName] = useState("")
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState("")
  const [editTaskName, setEditTaskName] = useState("")
  const [editTaskDuration, setEditTaskDuration] = useState(25)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // Add new task group
  const addTaskGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: TaskGroup = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        tasks: [],
        isExpanded: true,
        createdAt: new Date().toISOString(),
      }
      setTaskGroups([...taskGroups, newGroup])
      setNewGroupName("")
    }
  }

  // Delete task group
  const deleteTaskGroup = (groupId: string) => {
    setTaskGroups(taskGroups.filter((group) => group.id !== groupId))
    if (currentTaskId) {
      // Check if current task was in deleted group
      const deletedGroup = taskGroups.find((g) => g.id === groupId)
      if (deletedGroup?.tasks.some((t) => t.id === currentTaskId)) {
        setCurrentTaskId(null)
      }
    }
  }

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setTaskGroups(
      taskGroups.map((group) => (group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group)),
    )
  }

  // Add task to group
  const addTaskToGroup = (groupId: string) => {
    if (newTaskName.trim() && newTaskDuration > 0) {
      const newTask: Task = {
        id: Date.now().toString(),
        name: newTaskName.trim(),
        duration: newTaskDuration,
        completed: false,
        pomodorosCompleted: 0,
        subtasks: [],
        createdAt: new Date().toISOString(),
      }

      setTaskGroups(
        taskGroups.map((group) => (group.id === groupId ? { ...group, tasks: [...group.tasks, newTask] } : group)),
      )

      setNewTaskName("")
      setNewTaskDuration(25)
      setActiveGroupId(null)
    }
  }

  // Delete task
  const deleteTask = (groupId: string, taskId: string) => {
    setTaskGroups(
      taskGroups.map((group) =>
        group.id === groupId ? { ...group, tasks: group.tasks.filter((task) => task.id !== taskId) } : group,
      ),
    )

    if (currentTaskId === taskId) {
      setCurrentTaskId(null)
    }
  }

  // Toggle task completion
  const toggleTaskCompletion = (groupId: string, taskId: string) => {
    setTaskGroups(
      taskGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
            }
          : group,
      ),
    )
  }

  // Add subtask
  const addSubtask = (groupId: string, taskId: string) => {
    if (newSubtaskName.trim()) {
      const newSubtask: Subtask = {
        id: Date.now().toString(),
        name: newSubtaskName.trim(),
        completed: false,
      }

      setTaskGroups(
        taskGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                tasks: group.tasks.map((task) =>
                  task.id === taskId ? { ...task, subtasks: [...task.subtasks, newSubtask] } : task,
                ),
              }
            : group,
        ),
      )

      setNewSubtaskName("")
      setActiveTaskId(null)
    }
  }

  // Toggle subtask completion
  const toggleSubtaskCompletion = (groupId: string, taskId: string, subtaskId: string) => {
    setTaskGroups(
      taskGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      subtasks: task.subtasks.map((subtask) =>
                        subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
                      ),
                    }
                  : task,
              ),
            }
          : group,
      ),
    )
  }

  // Delete subtask
  const deleteSubtask = (groupId: string, taskId: string, subtaskId: string) => {
    setTaskGroups(
      taskGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
                    }
                  : task,
              ),
            }
          : group,
      ),
    )
  }

  // Start editing group
  const startEditingGroup = (group: TaskGroup) => {
    setEditingGroupId(group.id)
    setEditGroupName(group.name)
  }

  // Save group edit
  const saveGroupEdit = (groupId: string) => {
    if (editGroupName.trim()) {
      setTaskGroups(
        taskGroups.map((group) => (group.id === groupId ? { ...group, name: editGroupName.trim() } : group)),
      )
    }
    setEditingGroupId(null)
    setEditGroupName("")
  }

  // Start editing task
  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditTaskName(task.name)
    setEditTaskDuration(task.duration)
  }

  // Save task edit
  const saveTaskEdit = (groupId: string, taskId: string) => {
    if (editTaskName.trim() && editTaskDuration > 0) {
      setTaskGroups(
        taskGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                tasks: group.tasks.map((task) =>
                  task.id === taskId ? { ...task, name: editTaskName.trim(), duration: editTaskDuration } : task,
                ),
              }
            : group,
        ),
      )
    }
    setEditingTaskId(null)
    setEditTaskName("")
    setEditTaskDuration(25)
  }

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
      {/* Add New Group */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-4 border border-blue-100 dark:border-slate-600">
        <div className="flex gap-3">
          <Input
            placeholder="Create new task group (e.g., Final Exam Prep)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTaskGroup()}
            className="flex-1 rounded-xl border-blue-200 dark:border-slate-500 focus:border-blue-400 dark:focus:border-slate-400"
          />
          <Button
            onClick={addTaskGroup}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Group
          </Button>
        </div>
      </div>

      {/* Task Groups */}
      <div className="space-y-4">
        {taskGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden"
          >
            {/* Group Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleGroupExpansion(group.id)}
                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors"
                  >
                    {group.isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>

                  {editingGroupId === group.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && saveGroupEdit(group.id)}
                        className="text-lg font-semibold bg-white dark:bg-slate-700 rounded-lg"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => saveGroupEdit(group.id)} className="rounded-lg">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingGroupId(null)} className="rounded-lg">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
                        {group.tasks.length} tasks
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditingGroup(group)}
                    className="rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTaskGroup(group.id)}
                    className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Group Content */}
            {group.isExpanded && (
              <div className="p-6 space-y-4">
                {/* Add Task Form */}
                {activeGroupId === group.id ? (
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium mb-2 block">Task Name</Label>
                        <Input
                          placeholder="Study Software Engineering"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Duration (minutes)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="480"
                          value={newTaskDuration}
                          onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => setActiveGroupId(null)} className="rounded-lg">
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addTaskToGroup(group.id)}
                        className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        Add Task
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setActiveGroupId(group.id)}
                    className="w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-6 transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">Add New Task</span>
                  </Button>
                )}

                {/* Tasks List */}
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "bg-gray-50 dark:bg-slate-700 rounded-xl p-4 border-2 transition-all duration-200",
                        currentTaskId === task.id
                          ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-transparent hover:border-gray-200 dark:hover:border-slate-600",
                        task.completed && "opacity-60",
                      )}
                    >
                      {editingTaskId === task.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <Input
                                value={editTaskName}
                                onChange={(e) => setEditTaskName(e.target.value)}
                                className="rounded-lg"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                min="1"
                                max="480"
                                value={editTaskDuration}
                                onChange={(e) => setEditTaskDuration(Number(e.target.value))}
                                className="rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingTaskId(null)}
                              className="rounded-lg"
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => saveTaskEdit(group.id, task.id)} className="rounded-lg">
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Task Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleTaskCompletion(group.id, task.id)}
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                                  task.completed
                                    ? "bg-green-500 border-green-500"
                                    : "border-gray-300 dark:border-slate-500 hover:border-green-400",
                                )}
                              >
                                {task.completed && <Check className="h-4 w-4 text-white" />}
                              </button>

                              <div>
                                <h4
                                  className={cn(
                                    "font-semibold text-gray-900 dark:text-white",
                                    task.completed && "line-through text-gray-500 dark:text-gray-400",
                                  )}
                                >
                                  {task.name}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {task.duration} min
                                  </span>
                                  {task.pomodorosCompleted > 0 && (
                                    <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-xs font-medium">
                                      🍅 {task.pomodorosCompleted}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {!task.completed && (
                                <Button
                                  size="sm"
                                  onClick={() => setCurrentTaskId(currentTaskId === task.id ? null : task.id)}
                                  className={cn(
                                    "rounded-lg text-xs",
                                    currentTaskId === task.id
                                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                                      : "bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500",
                                  )}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  {currentTaskId === task.id ? "Active" : "Select"}
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingTask(task)}
                                className="rounded-lg text-gray-600 dark:text-gray-300"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteTask(group.id, task.id)}
                                className="rounded-lg text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Subtasks */}
                          <div className="space-y-2">
                            {task.subtasks.map((subtask) => (
                              <div
                                key={subtask.id}
                                className="flex items-center justify-between bg-white dark:bg-slate-600 rounded-lg p-3"
                              >
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => toggleSubtaskCompletion(group.id, task.id, subtask.id)}
                                    className={cn(
                                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200",
                                      subtask.completed
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300 dark:border-slate-400 hover:border-green-400",
                                    )}
                                  >
                                    {subtask.completed && <Check className="h-3 w-3 text-white" />}
                                  </button>
                                  <span
                                    className={cn(
                                      "text-sm text-gray-700 dark:text-gray-200",
                                      subtask.completed && "line-through text-gray-500 dark:text-gray-400",
                                    )}
                                  >
                                    {subtask.name}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteSubtask(group.id, task.id, subtask.id)}
                                  className="rounded-lg text-red-600 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}

                            {/* Add Subtask */}
                            {activeTaskId === task.id ? (
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Review lecture materials"
                                  value={newSubtaskName}
                                  onChange={(e) => setNewSubtaskName(e.target.value)}
                                  onKeyPress={(e) => e.key === "Enter" && addSubtask(group.id, task.id)}
                                  className="flex-1 rounded-lg text-sm"
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => addSubtask(group.id, task.id)} className="rounded-lg">
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setActiveTaskId(null)}
                                  className="rounded-lg"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setActiveTaskId(task.id)}
                                className="w-full rounded-lg border border-dashed border-gray-300 dark:border-slate-500 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 text-sm"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Subtask
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {taskGroups.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Task Groups Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create your first task group to get started with organized productivity!
          </p>
        </div>
      )}
    </div>
  )
}
