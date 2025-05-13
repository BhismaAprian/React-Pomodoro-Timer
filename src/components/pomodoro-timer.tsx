import { useState, useEffect, useRef } from "react"
import { Pause, Play, RefreshCw, Settings, Bell, BellOff, BarChart2, ListTodo, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import BackgroundSelector from "./background-selector"
import StatisticsDashboard from "./statistics-dashboard"
import TaskTracker from "./task-tracker"

type TimerMode = "focus" | "shortBreak" | "longBreak"
type Task = {
  id: string
  name: string
  completed: boolean
  pomodorosCompleted: number
  createdAt: string
}

type SessionRecord = {
  type: TimerMode
  duration: number // in seconds
  startTime: string
  endTime: string
  taskId?: string
}

export default function PomodoroTimer() {
  // Timer settings
  const [settings, setSettings] = useState({
    focus: 25 * 60, // 25 minutes in seconds
    shortBreak: 5 * 60, // 5 minutes in seconds
    longBreak: 15 * 60, // 15 minutes in seconds
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
  const [statsOpen, setStatsOpen] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Background state
  const [background, setBackground] = useState({
    type: "gradient" as "gradient" | "image" | "video",
    gradient: "bg-gradient-to-br from-rose-500 to-indigo-700",
    image: "",
    video: "",
  })

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationsSupported, setNotificationsSupported] = useState(false)

  // Task state
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  // Statistics state
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([])
  const [todayStats, setTodayStats] = useState({
    focusSeconds: 0,
    pomodorosCompleted: 0,
  })

  // Audio refs
  const startSoundRef = useRef<HTMLAudioElement | null>(null)
  const endSoundRef = useRef<HTMLAudioElement | null>(null)
  const sessionStartTime = useRef<string | null>(null)

  // Initialize audio elements
  useEffect(() => {
    startSoundRef.current = new Audio("/sounds/start.mp3")
    endSoundRef.current = new Audio("/sounds/end.mp3")
  }, [])

  // Load data from localStorage
  useEffect(() => {
    // Load settings
    const savedSettings = localStorage.getItem("pomodoroSettings")
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      setSettings(parsedSettings)
      setTimeRemaining(parsedSettings.focus)
    }

    // Load tasks
    const savedTasks = localStorage.getItem("pomodoroTasks")
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }

    // Load session history
    const savedHistory = localStorage.getItem("pomodoroSessionHistory")
    if (savedHistory) {
      setSessionHistory(JSON.parse(savedHistory))
    }

    // Calculate today's stats
    calculateTodayStats()

    // Check if notifications are supported and permission is granted
    if ("Notification" in window) {
      setNotificationsSupported(true)
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true)
      }
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings))
  }, [settings])

  // Save tasks to localStorage when they change
  useEffect(() => {
    localStorage.setItem("pomodoroTasks", JSON.stringify(tasks))
  }, [tasks])

  // Save session history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("pomodoroSessionHistory", JSON.stringify(sessionHistory))
    calculateTodayStats()
  }, [sessionHistory])

  // Calculate today's statistics
  const calculateTodayStats = () => {
    const today = new Date().toISOString().split("T")[0]

    const todaySessions = sessionHistory.filter((session) => session.startTime.startsWith(today))

    const focusSeconds = todaySessions
      .filter((session) => session.type === "focus")
      .reduce((total, session) => total + session.duration, 0)

    const pomodorosCompleted = todaySessions.filter((session) => session.type === "focus").length

    setTodayStats({
      focusSeconds,
      pomodorosCompleted,
    })
  }

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
    // Check if notifications are enabled and the document is hidden
    if (notificationsEnabled && document.hidden) {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico", // You can add a favicon for the notification
      })

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      // Focus the window when notification is clicked
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
      // If starting a new session, record the start time
      if (!sessionStartTime.current) {
        sessionStartTime.current = new Date().toISOString()
      }

      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    } else if (isRunning && timeRemaining === 0) {
      // Timer completed
      endSoundRef.current?.play()

      // Record the completed session
      if (sessionStartTime.current) {
        const endTime = new Date().toISOString()
        const sessionDuration =
          mode === "focus" ? settings.focus : mode === "shortBreak" ? settings.shortBreak : settings.longBreak

        const newSession: SessionRecord = {
          type: mode,
          duration: sessionDuration,
          startTime: sessionStartTime.current,
          endTime: endTime,
          taskId: currentTaskId || undefined,
        }

        setSessionHistory((prev) => [...prev, newSession])
        sessionStartTime.current = null

        // Update task if it's a focus session
        if (mode === "focus" && currentTaskId) {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === currentTaskId ? { ...task, pomodorosCompleted: task.pomodorosCompleted + 1 } : task,
            ),
          )
        }
      }

      // Send notification based on completed timer type
      if (mode === "focus") {
        sendNotification(
          "Focus Session Complete!",
          `Well done! You've completed ${completedPomodoros + 1} pomodoros. Time for a break.`,
        )
      } else {
        sendNotification("Break Complete!", "Break time is over. Ready to focus again?")
      }

      if (mode === "focus") {
        // Increment completed pomodoros
        const newCompletedPomodoros = completedPomodoros + 1
        setCompletedPomodoros(newCompletedPomodoros)

        // Check if it's time for a long break
        if (newCompletedPomodoros % settings.longBreakInterval === 0) {
          setMode("longBreak")
          setTimeRemaining(settings.longBreak)
        } else {
          setMode("shortBreak")
          setTimeRemaining(settings.shortBreak)
        }

        // Auto start breaks if enabled
        setIsRunning(settings.autoStartBreaks)
      } else {
        // Break completed, go back to focus mode
        setMode("focus")
        setTimeRemaining(settings.focus)

        // Auto start pomodoros if enabled
        setIsRunning(settings.autoStartPomodoros)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [
    isRunning,
    timeRemaining,
    mode,
    completedPomodoros,
    settings.longBreakInterval,
    settings.focus,
    settings.shortBreak,
    settings.longBreak,
    settings.autoStartBreaks,
    settings.autoStartPomodoros,
    notificationsEnabled,
    currentTaskId,
  ])

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
    if (!isRunning && timeRemaining > 0) {
      startSoundRef.current?.play()
    }
    setIsRunning(!isRunning)
  }

  // Handle reset
  const resetTimer = () => {
    setIsRunning(false)
    sessionStartTime.current = null
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
    sessionStartTime.current = null
    setMode(newMode)
    if (newMode === "focus") {
      setTimeRemaining(settings.focus)
    } else if (newMode === "shortBreak") {
      setTimeRemaining(settings.shortBreak)
    } else {
      setTimeRemaining(settings.longBreak)
    }
  }

  // Update settings
  const updateSettings = (newSettings: typeof settings) => {
    setSettings(newSettings)
    setSettingsOpen(false)

    // Update current timer based on mode
    if (mode === "focus") {
      setTimeRemaining(newSettings.focus)
    } else if (mode === "shortBreak") {
      setTimeRemaining(newSettings.shortBreak)
    } else {
      setTimeRemaining(newSettings.longBreak)
    }
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    const total = mode === "focus" ? settings.focus : mode === "shortBreak" ? settings.shortBreak : settings.longBreak

    return ((total - timeRemaining) / total) * 100
  }

  // Handle task operations
  const addTask = (taskName: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name: taskName,
      completed: false,
      pomodorosCompleted: 0,
      createdAt: new Date().toISOString(),
    }

    setTasks((prev) => [...prev, newTask])
  }

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
    )
  }

  const deleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
    if (currentTaskId === taskId) {
      setCurrentTaskId(null)
    }
  }

  const setCurrentTask = (taskId: string | null) => {
    setCurrentTaskId(taskId)
    setTasksOpen(false)
  }

  // Get current task name
  const getCurrentTaskName = () => {
    if (!currentTaskId) return null
    const task = tasks.find((t) => t.id === currentTaskId)
    return task ? task.name : null
  }

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background */}
      {background.type === "gradient" && <div className={`absolute inset-0 ${background.gradient}`} />}

      {background.type === "image" && background.image && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${background.image})` }} />
      )}

      {background.type === "video" && background.video && (
        <video className="absolute inset-0 object-cover w-full h-full" src={background.video} autoPlay muted loop />
      )}

      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Header/Navbar */}
      <header className="relative z-20 w-full">
        <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-white text-xl font-bold">Pomodoro Timer</h1>

              {/* Today's stats summary - desktop */}
              <div className="ml-6 hidden md:flex items-center text-white/70 text-sm">
                <span className="mr-4">Today: {Math.floor(todayStats.focusSeconds / 60)} minutes focused</span>
                <span>{todayStats.pomodorosCompleted} pomodoros completed</span>
              </div>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden text-white p-2" onClick={toggleMobileMenu}>
              <Menu className="h-6 w-6" />
            </button>

            {/* Desktop navbar buttons */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Task button */}
              <Dialog open={tasksOpen} onOpenChange={setTasksOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <ListTodo className="h-4 w-4 mr-2" />
                    Tasks
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Task Tracker</DialogTitle>
                  </DialogHeader>
                  <TaskTracker
                    tasks={tasks}
                    currentTaskId={currentTaskId}
                    onAddTask={addTask}
                    onToggleCompletion={toggleTaskCompletion}
                    onDeleteTask={deleteTask}
                    onSelectTask={setCurrentTask}
                  />
                </DialogContent>
              </Dialog>

              {/* Stats button */}
              <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Statistics
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Statistics Dashboard</DialogTitle>
                  </DialogHeader>
                  <StatisticsDashboard sessionHistory={sessionHistory} todayStats={todayStats} />
                </DialogContent>
              </Dialog>

              {/* Settings button */}
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Timer Settings</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="focusTime">Focus Time (minutes)</Label>
                      <Input
                        id="focusTime"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.focus / 60}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (!isNaN(value) && value > 0) {
                            setSettings({
                              ...settings,
                              focus: value * 60,
                            })
                          }
                        }}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="shortBreakTime">Short Break (minutes)</Label>
                      <Input
                        id="shortBreakTime"
                        type="number"
                        min="1"
                        max="30"
                        value={settings.shortBreak / 60}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (!isNaN(value) && value > 0) {
                            setSettings({
                              ...settings,
                              shortBreak: value * 60,
                            })
                          }
                        }}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="longBreakTime">Long Break (minutes)</Label>
                      <Input
                        id="longBreakTime"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.longBreak / 60}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (!isNaN(value) && value > 0) {
                            setSettings({
                              ...settings,
                              longBreak: value * 60,
                            })
                          }
                        }}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="longBreakInterval">Long Break Interval</Label>
                      <Input
                        id="longBreakInterval"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.longBreakInterval}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (!isNaN(value) && value > 0) {
                            setSettings({
                              ...settings,
                              longBreakInterval: value,
                            })
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoStartBreaks"
                        checked={settings.autoStartBreaks}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            autoStartBreaks: e.target.checked,
                          })
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="autoStartBreaks">Auto-start Breaks</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoStartPomodoros"
                        checked={settings.autoStartPomodoros}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            autoStartPomodoros: e.target.checked,
                          })
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="autoStartPomodoros">Auto-start Pomodoros</Label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => updateSettings(settings)}>Save Settings</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Notification toggle */}
              {notificationsSupported && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={toggleNotifications}
                  title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                >
                  {notificationsEnabled ? (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications On
                    </>
                  ) : (
                    <>
                      <BellOff className="h-4 w-4 mr-2" />
                      Notifications Off
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute w-full bg-black/30 backdrop-blur-md border-b border-white/10 z-30">
            <div className="px-4 py-3 space-y-2">
              <Dialog
                open={tasksOpen}
                onOpenChange={(open) => {
                  setTasksOpen(open)
                  if (!open) setMobileMenuOpen(false)
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 w-full justify-start">
                    <ListTodo className="h-4 w-4 mr-2" />
                    Tasks
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Task Tracker</DialogTitle>
                  </DialogHeader>
                  <TaskTracker
                    tasks={tasks}
                    currentTaskId={currentTaskId}
                    onAddTask={addTask}
                    onToggleCompletion={toggleTaskCompletion}
                    onDeleteTask={deleteTask}
                    onSelectTask={(taskId) => {
                      setCurrentTask(taskId)
                      setMobileMenuOpen(false)
                    }}
                  />
                </DialogContent>
              </Dialog>

              <Dialog
                open={statsOpen}
                onOpenChange={(open) => {
                  setStatsOpen(open)
                  if (!open) setMobileMenuOpen(false)
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 w-full justify-start">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Statistics
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Statistics Dashboard</DialogTitle>
                  </DialogHeader>
                  <StatisticsDashboard sessionHistory={sessionHistory} todayStats={todayStats} />
                </DialogContent>
              </Dialog>

              <Dialog
                open={settingsOpen}
                onOpenChange={(open) => {
                  setSettingsOpen(open)
                  if (!open) setMobileMenuOpen(false)
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Timer Settings</DialogTitle>
                  </DialogHeader>
                  {/* Settings content - same as desktop */}
                </DialogContent>
              </Dialog>

              {notificationsSupported && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 w-full justify-start"
                  onClick={() => {
                    toggleNotifications()
                    setMobileMenuOpen(false)
                  }}
                >
                  {notificationsEnabled ? (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications On
                    </>
                  ) : (
                    <>
                      <BellOff className="h-4 w-4 mr-2" />
                      Notifications Off
                    </>
                  )}
                </Button>
              )}

              {/* Today's stats summary - mobile */}
              <div className="text-white/70 text-sm pt-2 border-t border-white/10">
                <div className="mb-1">Today: {Math.floor(todayStats.focusSeconds / 60)} minutes focused</div>
                <div>{todayStats.pomodorosCompleted} pomodoros completed</div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md mx-auto bg-black/20 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/10">
          {/* Timer tabs */}
          <Tabs
            defaultValue="focus"
            value={mode}
            onValueChange={(value) => changeMode(value as TimerMode)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="focus">Focus</TabsTrigger>
              <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
              <TabsTrigger value="longBreak">Long Break</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Current task display */}
          {currentTaskId && (
            <div className="mb-4 text-center">
              <p className="text-white/80 text-sm">Current Task:</p>
              <p className="text-white font-medium truncate">{getCurrentTaskName()}</p>
            </div>
          )}

          {/* Timer display */}
          <div className="relative flex flex-col items-center justify-center my-8">
            <div className="text-7xl font-bold text-white mb-4">{formatTime(timeRemaining)}</div>

            {/* Progress circle */}
            <div className="absolute -inset-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * calculateProgress()) / 100}
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-white/10 border-white/20 hover:bg-white/20"
              onClick={resetTimer}
            >
              <RefreshCw className="h-5 w-5 text-white" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16 rounded-full bg-white/10 border-white/20 hover:bg-white/20"
              onClick={toggleTimer}
            >
              {isRunning ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ml-1" />}
            </Button>
          </div>

          {/* Session counter */}
          <div className="flex items-center justify-center gap-2 text-white/80">
            <div className="text-sm">
              Completed: <span className="font-bold">{completedPomodoros}</span> pomodoros
            </div>
          </div>
        </div>

        {/* Background selector */}
        <div className="absolute bottom-8 right-8">
          <BackgroundSelector currentBackground={background} onBackgroundChange={setBackground} />
        </div>

        {/* Creator credit */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-xs">
          Created by Bhisma Aprian Prayogi
        </div>
      </div>
    </div>
  )
}
