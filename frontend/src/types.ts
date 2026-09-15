export type User = {
  id: string
  user_id: string
  email: string
  role: "user" | "admin"
  is_active: boolean
  is_blocked: boolean
  email_verified: boolean
  theme: string
  created_at: string
}

export type Habit = { id: string; name: string; description?: string; color: string; active: boolean; today_completed?: boolean; weekly_completion?: Record<string, boolean> }
export type Day = {
  date: string
  is_today: boolean
  habit_done: number
  habit_total: number
  task_done: number
  task_total: number
  progress: number
  tasks: { id: string; title: string; completed: boolean }[]
}
export type Dashboard = {
  today: string
  week_start: string
  week_end: string
  overall_progress: number
  overall_done: number
  overall_total: number
  days: Day[]
  habits: Habit[]
  habit_stats: { id: string; name: string; done: number; total: number; progress: number }[]
}
export type Thread = { id: string; title: string; created_at: string; updated_at: string }
export type Message = { id: string; role: "user" | "assistant"; content: string; created_at: string }
export type Analysis = {
  start: string; end: string; progress: number; done: number; total: number
  daily: { date: string; done: number; total: number; progress: number }[]
  habit_stats: { name: string; done: number; total: number; progress: number }[]
  task_stats: { done: number; total: number }
}
