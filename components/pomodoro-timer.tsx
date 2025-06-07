"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect, useRef } from "react"
import { Pause, Play, RefreshCw, Settings, Bell, BellOff, ListTodo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import BackgroundSelector from "./background-selector"
import TaskManager from "./task-manager"

type TimerMode = "focus" | "shortBreak" | "longBreak"

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

export default function PomodoroTimer() {
  // Timer settings
  const [settings, setSettings] = useState({
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    autoStartBreaks: true,
    autoStartPomodoros: true,
    longBreakInterval: 4,
  })

  // Timer state
  const [mode, setMode] = useState<TimerMode>("focus")
  const [timeRemaining, setTimeRemaining] = useState(settings.focus)
  const [isRunning, setIsRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(false)

  // Background state
  const [background, setBackground] = useState({
    type: "gradient" as "gradient" | "image" | "video",
    gradient: "bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500",
    image: "",
    video: "",
  })

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationsSupported, setNotificationsSupported] = useState(false)

  // Task state
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  // Audio refs
  const startSoundRef = useRef<HTMLAudioElement | null>(null)
  const endSoundRef = useRef<HTMLAudioElement | null>(null)

  // Load data from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("pomodoroSettings")
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      setSettings(parsedSettings)
      setTimeRemaining(parsedSettings.focus)
    }

    const savedTaskGroups = localStorage.getItem("pomodoroTaskGroups")
    if (savedTaskGroups) {
      setTaskGroups(JSON.parse(savedTaskGroups))
    }

    if ("Notification" in window) {
      setNotificationsSupported(true)
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true)
      }
    }
  }, [])

  // Save settings and task groups
  useEffect(() => {
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem("pomodoroTaskGroups", JSON.stringify(taskGroups))
  }, [taskGroups])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications")
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setNotificationsEnabled(true)
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    }
  }

  // Send notification
  const sendNotification = (title: string, body: string) => {
    if (notificationsEnabled && document.hidden) {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
      })

      setTimeout(() => notification.close(), 5000)
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    }
  }

  // Toggle notifications
  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false)
    } else {
      await requestNotificationPermission()
    }
  }

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    } else if (isRunning && timeRemaining === 0) {
      // Timer completed
      if (mode === "focus") {
        sendNotification(
          "Focus Session Complete! 🎉",
          `Well done! You've completed ${completedPomodoros + 1} pomodoros. Time for a break.`,
        )

        // Update task pomodoros if current task is selected
        if (currentTaskId) {
          setTaskGroups((prevGroups) =>
            prevGroups.map((group) => ({
              ...group,
              tasks: group.tasks.map((task) =>
                task.id === currentTaskId ? { ...task, pomodorosCompleted: task.pomodorosCompleted + 1 } : task,
              ),
            })),
          )
        }
      } else {
        sendNotification("Break Complete! ☕", "Break time is over. Ready to focus again?")
      }

      if (mode === "focus") {
        const newCompletedPomodoros = completedPomodoros + 1
        setCompletedPomodoros(newCompletedPomodoros)

        if (newCompletedPomodoros % settings.longBreakInterval === 0) {
          setMode("longBreak")
          setTimeRemaining(settings.longBreak)
        } else {
          setMode("shortBreak")
          setTimeRemaining(settings.shortBreak)
        }

        setIsRunning(settings.autoStartBreaks)
      } else {
        setMode("focus")
        setTimeRemaining(settings.focus)
        setIsRunning(settings.autoStartPomodoros)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeRemaining, mode, completedPomodoros, settings, notificationsEnabled, currentTaskId])

  // Update time remaining when mode changes
  useEffect(() => {
    if (mode === "focus") {
      setTimeRemaining(settings.focus)
    } else if (mode === "shortBreak") {
      setTimeRemaining(settings.shortBreak)
    } else {
      setTimeRemaining(settings.longBreak)
    }
  }, [settings.focus, settings.shortBreak, settings.longBreak, mode])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle start/pause
  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  // Handle reset
  const resetTimer = () => {
    setIsRunning(false)
    if (mode === "focus") {
      setTimeRemaining(settings.focus)
    } else if (mode === "shortBreak") {
      setTimeRemaining(settings.shortBreak)
    } else {
      setTimeRemaining(settings.longBreak)
    }
  }

  // Handle mode change
  const changeMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    if (newMode === "focus") {
      setTimeRemaining(settings.focus)
    } else if (newMode === "shortBreak") {
      setTimeRemaining(settings.shortBreak)
    } else {
      setTimeRemaining(settings.longBreak)
    }
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    const total = mode === "focus" ? settings.focus : mode === "shortBreak" ? settings.shortBreak : settings.longBreak

    return ((total - timeRemaining) / total) * 100
  }

  // Get current task name
  const getCurrentTaskName = () => {
    if (!currentTaskId) return null
    for (const group of taskGroups) {
      const task = group.tasks.find((t) => t.id === currentTaskId)
      if (task) return task.name
    }
    return null
  }

  // Get mode display info
  const getModeInfo = () => {
    switch (mode) {
      case "focus":
        return { label: "Focus Time", color: "from-rose-400 to-pink-500", icon: "🎯" }
      case "shortBreak":
        return { label: "Short Break", color: "from-emerald-400 to-teal-500", icon: "☕" }
      case "longBreak":
        return { label: "Long Break", color: "from-blue-400 to-indigo-500", icon: "🌟" }
    }
  }

  const modeInfo = getModeInfo()

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background */}
      {background.type === "gradient" && <div className={`absolute inset-0 ${background.gradient}`} />}

      {background.type === "image" && background.image && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${background.image})` }} />
      )}

      {background.type === "video" && background.video && (
        <video className="absolute inset-0 object-cover w-full h-full" src={background.video} autoPlay muted loop />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

      {/* Header */}
      <header className="relative z-20 w-full">
        <div className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-2xl">🍅</span>
                </div>
                <div>
                  <h1 className="text-white text-xl font-bold tracking-tight">Pomodoro</h1>
                  <p className="text-white/70 text-sm">Focus & Productivity</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Tasks Button */}
              <Dialog open={tasksOpen} onOpenChange={setTasksOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 rounded-xl transition-all duration-200"
                  >
                    <ListTodo className="h-4 w-4 mr-2" />
                    Tasks
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Task Manager</DialogTitle>
                  </DialogHeader>
                  <TaskManager
                    taskGroups={taskGroups}
                    setTaskGroups={setTaskGroups}
                    currentTaskId={currentTaskId}
                    setCurrentTaskId={setCurrentTaskId}
                  />
                </DialogContent>
              </Dialog>

              {/* Settings Button */}
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm p-3 rounded-xl transition-all duration-200"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Timer Settings</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-3">
                      <Label htmlFor="focusTime" className="text-sm font-medium">
                        Focus Time (minutes)
                      </Label>
                      <Input
                        id="focusTime"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.focus / 60}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (!isNaN(value) && value > 0) {
                            setSettings({ ...settings, focus: value * 60 })
                          }
                        }}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="shortBreakTime" className="text-sm font-medium">
                        Short Break (minutes)
                      </Label>
                      <Input
                        id="shortBreakTime"
                        type="number"
                        min="1"
                        max="30"
                        value={settings.shortBreak / 60}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (!isNaN(value) && value > 0) {
                            setSettings({ ...settings, shortBreak: value * 60 })
                          }
                        }}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="longBreakTime" className="text-sm font-medium">
                        Long Break (minutes)
                      </Label>
                      <Input
                        id="longBreakTime"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.longBreak / 60}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (!isNaN(value) && value > 0) {
                            setSettings({ ...settings, longBreak: value * 60 })
                          }
                        }}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="longBreakInterval" className="text-sm font-medium">
                        Long Break Interval
                      </Label>
                      <Input
                        id="longBreakInterval"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.longBreakInterval}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (!isNaN(value) && value > 0) {
                            setSettings({ ...settings, longBreakInterval: value })
                          }
                        }}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="autoStartBreaks"
                          checked={settings.autoStartBreaks}
                          onChange={(e) => {
                            setSettings({ ...settings, autoStartBreaks: e.target.checked })
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <Label htmlFor="autoStartBreaks" className="text-sm font-medium">
                          Auto-start Breaks
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="autoStartPomodoros"
                          checked={settings.autoStartPomodoros}
                          onChange={(e) => {
                            setSettings({ ...settings, autoStartPomodoros: e.target.checked })
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <Label htmlFor="autoStartPomodoros" className="text-sm font-medium">
                          Auto-start Pomodoros
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setSettingsOpen(false)} className="rounded-xl px-6">
                      Save Settings
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Notification Toggle */}
              {notificationsSupported && (
                <Button
                  variant="ghost"
                  onClick={toggleNotifications}
                  className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm p-3 rounded-xl transition-all duration-200"
                  title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                >
                  {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
              )}

              {/* Background Selector */}
              <BackgroundSelector currentBackground={background} onBackgroundChange={setBackground} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-[calc(100vh-5rem)] px-6 py-8">
        <div className="w-full max-w-lg mx-auto">
          {/* Timer Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20 mb-8">
            {/* Mode Selector */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-1 border border-white/20">
                <div className="flex space-x-1">
                  {[
                    { mode: "focus" as TimerMode, label: "Focus", icon: "🎯" },
                    { mode: "shortBreak" as TimerMode, label: "Short", icon: "☕" },
                    { mode: "longBreak" as TimerMode, label: "Long", icon: "🌟" },
                  ].map(({ mode: m, label, icon }) => (
                    <button
                      key={m}
                      onClick={() => changeMode(m)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        mode === m
                          ? "bg-white text-gray-900 shadow-lg"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-2">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Task Display */}
            {currentTaskId && (
              <div className="text-center mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                  <p className="text-white/80 text-sm font-medium mb-1">Current Task</p>
                  <p className="text-white font-semibold truncate">{getCurrentTaskName()}</p>
                </div>
              </div>
            )}

            {/* Timer Display */}
            <div className="relative flex flex-col items-center justify-center mb-8">
              {/* Progress Circle */}
              <div className="relative w-64 h-64 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * calculateProgress()) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Timer Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl font-bold text-white mb-2 tracking-tight">{formatTime(timeRemaining)}</div>
                  <div className="text-white/80 text-lg font-medium">{modeInfo.label}</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={resetTimer}
                  className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-200"
                >
                  <RefreshCw className="h-6 w-6 text-white" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={toggleTimer}
                  className="w-20 h-20 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm transition-all duration-200 shadow-xl"
                >
                  {isRunning ? <Pause className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 text-white ml-1" />}
                </Button>
              </div>
            </div>

            {/* Session Counter */}
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20 inline-block">
                <span className="text-white/80 text-sm font-medium">Completed: </span>
                <span className="text-white text-lg font-bold">{completedPomodoros}</span>
                <span className="text-white/80 text-sm font-medium"> pomodoros</span>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Credit */}
        <div className="text-white/50 text-sm text-center">Created by Bhisma Aprian Prayogi</div>
      </div>
    </div>
  )
}
