"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, Play, RefreshCw, Settings, Bell, BellOff, BarChart2, ListTodo, Menu } from 'lucide-react'
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
