"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect, useRef } from "react"
import { Pause, Play, RefreshCw, Settings, Bell, BellOff, ListTodo, Sparkles } from "lucide-react"
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
        return {
          label: "Focus Time",
          color: "from-rose-400 via-pink-500 to-purple-600",
          icon: "🎯",
          bgGlow: "shadow-rose-500/25",
        }
      case "shortBreak":
        return {
          label: "Short Break",
          color: "from-emerald-400 via-teal-500 to-cyan-600",
          icon: "☕",
          bgGlow: "shadow-emerald-500/25",
        }
      case "longBreak":
        return {
          label: "Long Break",
          color: "from-blue-400 via-indigo-500 to-purple-600",
          icon: "🌟",
          bgGlow: "shadow-blue-500/25",
        }
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

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

      {/* Floating Brand */}
      <div className="absolute top-8 left-8 z-30">
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-2xl rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🍅</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Pomodoro</h1>
            <p className="text-white/70 text-sm">Focus Studio</p>
          </div>
        </div>
      </div>

      {/* Floating Controls - Top Right */}
      <div className="absolute top-8 right-8 z-30 flex flex-col space-y-4">
        {/* Background Selector */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-2 border border-white/20 shadow-2xl">
          <BackgroundSelector currentBackground={background} onBackgroundChange={setBackground} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-2 border border-white/20 shadow-2xl">
          <div className="flex flex-col space-y-2">
            {/* Tasks Button */}
            <Dialog open={tasksOpen} onOpenChange={setTasksOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-xl text-white hover:bg-white/20 transition-all duration-300 group"
                  title="Task Manager"
                >
                  <ListTodo className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Task Manager
                  </DialogTitle>
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
                  size="icon"
                  className="w-12 h-12 rounded-xl text-white hover:bg-white/20 transition-all duration-300 group"
                  title="Settings"
                >
                  <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Timer Settings
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-3">
                    <Label htmlFor="focusTime" className="text-sm font-medium flex items-center">
                      <span className="mr-2">🎯</span>
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
                      className="rounded-xl border-2 focus:border-purple-400 transition-colors"
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="shortBreakTime" className="text-sm font-medium flex items-center">
                      <span className="mr-2">☕</span>
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
                      className="rounded-xl border-2 focus:border-emerald-400 transition-colors"
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="longBreakTime" className="text-sm font-medium flex items-center">
                      <span className="mr-2">🌟</span>
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
                      className="rounded-xl border-2 focus:border-blue-400 transition-colors"
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="longBreakInterval" className="text-sm font-medium flex items-center">
                      <span className="mr-2">🔄</span>
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
                      className="rounded-xl border-2 focus:border-indigo-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoStartBreaks"
                        checked={settings.autoStartBreaks}
                        onChange={(e) => {
                          setSettings({ ...settings, autoStartBreaks: e.target.checked })
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <Label htmlFor="autoStartPomodoros" className="text-sm font-medium">
                        Auto-start Pomodoros
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setSettingsOpen(false)}
                    className="rounded-xl px-8 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                  >
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Notification Toggle */}
            {notificationsSupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNotifications}
                className="w-12 h-12 rounded-xl text-white hover:bg-white/20 transition-all duration-300 group"
                title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
              >
                {notificationsEnabled ? (
                  <Bell className="h-5 w-5 group-hover:animate-bounce" />
                ) : (
                  <BellOff className="h-5 w-5 group-hover:scale-110 transition-transform" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Timer Container */}
      <div className="relative z-10 flex items-center justify-center w-full min-h-screen px-6">
        <div className="relative">
          {/* Floating Mode Selector */}
          <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-2 border border-white/30 shadow-2xl">
              <div className="flex space-x-2">
                {[
                  { mode: "focus" as TimerMode, label: "Focus", icon: "🎯", color: "from-rose-400 to-pink-500" },
                  {
                    mode: "shortBreak" as TimerMode,
                    label: "Break",
                    icon: "☕",
                    color: "from-emerald-400 to-teal-500",
                  },
                  { mode: "longBreak" as TimerMode, label: "Rest", icon: "🌟", color: "from-blue-400 to-indigo-500" },
                ].map(({ mode: m, label, icon, color }) => (
                  <button
                    key={m}
                    onClick={() => changeMode(m)}
                    className={`relative px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                      mode === m
                        ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
                        : "text-white/80 hover:text-white hover:bg-white/10 hover:scale-105"
                    }`}
                  >
                    <span className="mr-2 text-lg">{icon}</span>
                    {label}
                    {mode === m && <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Timer Card */}
          <div
            className={`relative bg-white/10 backdrop-blur-3xl rounded-[3rem] p-12 shadow-2xl border border-white/20 ${modeInfo.bgGlow} shadow-2xl`}
          >
            {/* Decorative Elements */}
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl rotate-12 opacity-80"></div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl rotate-45 opacity-60"></div>

            {/* Current Task Display */}
            {currentTaskId && (
              <div className="absolute -top-16 left-8 right-8">
                <div className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/30 shadow-xl">
                  <div className="flex items-center justify-center space-x-3">
                    <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                    <p className="text-white font-medium text-center truncate">{getCurrentTaskName()}</p>
                    <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Timer Display */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Progress Circle */}
              <div className="relative w-80 h-80 mb-8">
                {/* Outer decorative ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-white/5 p-4">
                  <div className="w-full h-full rounded-full bg-white/5"></div>
                </div>

                {/* Main progress circle */}
                <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="264"
                    strokeDashoffset={264 - (264 * calculateProgress()) / 100}
                    className="transition-all duration-1000 ease-out drop-shadow-lg"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Timer Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-7xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{modeInfo.icon}</span>
                    <div className="text-white/90 text-xl font-medium">{modeInfo.label}</div>
                  </div>
                </div>

                {/* Floating progress indicator */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                  <div className="bg-white/20 backdrop-blur-xl rounded-full px-4 py-2 border border-white/30">
                    <span className="text-white text-sm font-medium">{Math.round(calculateProgress())}%</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-6">
                <Button
                  variant="ghost"
                  onClick={resetTimer}
                  className="w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 group"
                >
                  <RefreshCw className="h-6 w-6 text-white group-hover:rotate-180 transition-transform duration-500" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={toggleTimer}
                  className="w-24 h-24 rounded-3xl bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-2xl group"
                >
                  {isRunning ? (
                    <Pause className="h-10 w-10 text-white group-hover:scale-110 transition-transform" />
                  ) : (
                    <Play className="h-10 w-10 text-white ml-1 group-hover:scale-110 transition-transform" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl px-8 py-4 border border-white/30 shadow-xl">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">{completedPomodoros}</div>
                  <div className="text-white/70 text-sm font-medium">Completed</div>
                </div>
                <div className="w-px h-8 bg-white/30"></div>
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">
                    {Math.floor((completedPomodoros * settings.focus) / 3600)}h{" "}
                    {Math.floor(((completedPomodoros * settings.focus) % 3600) / 60)}m
                  </div>
                  <div className="text-white/70 text-sm font-medium">Focus Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Creator Credit */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
          <p className="text-white/60 text-sm">Created by Bhisma Aprian Prayogi</p>
        </div>
      </div>
    </div>
  )
}
