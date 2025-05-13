"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TimerMode = "focus" | "shortBreak" | "longBreak"

type SessionRecord = {
  type: TimerMode
  duration: number // in seconds
  startTime: string
  endTime: string
  taskId?: string
}

type StatisticsDashboardProps = {
  sessionHistory: SessionRecord[]
  todayStats: {
    focusSeconds: number
    pomodorosCompleted: number
  }
}

export default function StatisticsDashboard({ sessionHistory, todayStats }: StatisticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month" | "all">("today")

  // Format time as HH:MM
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Get filtered sessions based on timeframe
  const getFilteredSessions = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (timeframe) {
      case "today":
        return sessionHistory.filter((session) => new Date(session.startTime) >= today)
      case "week": {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return sessionHistory.filter((session) => new Date(session.startTime) >= weekStart)
      }
      case "month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        return sessionHistory.filter((session) => new Date(session.startTime) >= monthStart)
      }
      default:
        return sessionHistory
    }
  }

  // Calculate statistics
  const calculateStats = () => {
    const filteredSessions = getFilteredSessions()

    const focusSessions = filteredSessions.filter((s) => s.type === "focus")
    const shortBreakSessions = filteredSessions.filter((s) => s.type === "shortBreak")
    const longBreakSessions = filteredSessions.filter((s) => s.type === "longBreak")

    const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.duration, 0)
    const totalShortBreakTime = shortBreakSessions.reduce((sum, s) => sum + s.duration, 0)
    const totalLongBreakTime = longBreakSessions.reduce((sum, s) => sum + s.duration, 0)
    const totalBreakTime = totalShortBreakTime + totalLongBreakTime

    const pomodorosCompleted = focusSessions.length

    // Calculate daily averages if applicable
    let dailyAvgPomodoros = 0
    let dailyAvgFocusTime = 0

    if (timeframe !== "today") {
      const days = new Set()
      filteredSessions.forEach((session) => {
        const day = session.startTime.split("T")[0]
        days.add(day)
      })

      const numDays = Math.max(1, days.size)
      dailyAvgPomodoros = pomodorosCompleted / numDays
      dailyAvgFocusTime = totalFocusTime / numDays
    }

    return {
      totalFocusTime,
      totalBreakTime,
      pomodorosCompleted,
      dailyAvgPomodoros,
      dailyAvgFocusTime,
      focusSessions,
      shortBreakSessions,
      longBreakSessions,
    }
  }

  const stats = calculateStats()

  // Generate day labels for the chart
  const generateDayLabels = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const today = new Date().getDay()

    if (timeframe === "today") {
      return [days[today]]
    } else if (timeframe === "week") {
      const result = []
      for (let i = 0; i < 7; i++) {
        const dayIndex = (today - i + 7) % 7
        result.unshift(days[dayIndex])
      }
      return result
    } else {
      return days
    }
  }

  // Generate data for the chart
  const generateChartData = () => {
    const dayLabels = generateDayLabels()
    const data = Array(dayLabels.length).fill(0)

    if (timeframe === "today") {
      data[0] = stats.pomodorosCompleted
    } else {
      const filteredSessions = getFilteredSessions()
      const focusSessions = filteredSessions.filter((s) => s.type === "focus")

      focusSessions.forEach((session) => {
        const date = new Date(session.startTime)
        const dayOfWeek = date.getDay()
        const dayIndex = dayLabels.indexOf(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek])

        if (dayIndex !== -1) {
          data[dayIndex]++
        }
      })
    }

    return { labels: dayLabels, data }
  }

  const chartData = generateChartData()
  const maxValue = Math.max(...chartData.data, 1)

  return (
    <div className="space-y-6 py-4">
      <Tabs defaultValue="today" onValueChange={(value) => setTimeframe(value as any)}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{stats.pomodorosCompleted}</div>
          <div className="text-sm text-muted-foreground">Pomodoros</div>
        </div>
        <div className="bg-black/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{formatTime(stats.totalFocusTime)}</div>
          <div className="text-sm text-muted-foreground">Focus Time</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-black/10 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Pomodoros Completed</h3>
        <div className="h-40 flex items-end justify-between gap-1">
          {chartData.data.map((value, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-rose-500/70 rounded-t"
                style={{
                  height: `${(value / maxValue) * 100}%`,
                  minHeight: value > 0 ? "4px" : "0",
                }}
              ></div>
              <div className="text-xs mt-1">{chartData.labels[index]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional stats */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Focus sessions:</span>
          <span>{stats.focusSessions.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Short breaks:</span>
          <span>{stats.shortBreakSessions.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Long breaks:</span>
          <span>{stats.longBreakSessions.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Break time:</span>
          <span>{formatTime(stats.totalBreakTime)}</span>
        </div>

        {timeframe !== "today" && (
          <>
            <div className="flex justify-between text-sm">
              <span>Daily avg. pomodoros:</span>
              <span>{stats.dailyAvgPomodoros.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Daily avg. focus time:</span>
              <span>{formatTime(stats.dailyAvgFocusTime)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
