import PomodoroTimer from "@/components/pomodoro-timer"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 overflow-hidden">
      <PomodoroTimer />
    </div>
  )
}
