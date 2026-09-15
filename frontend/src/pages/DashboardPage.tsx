import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Check, Clock3, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { motion } from "motion/react"
import { format, parseISO } from "date-fns"
import { api } from "@/lib/api"
import type { Dashboard, Habit } from "@/types"
import { Button, Card, Input, ProgressRing } from "@/components/ui"
import { toast } from "sonner"

type HabitWithWeek = Habit & { weekly_completion?: Record<string, boolean> }
type Task = { id: string; date: string; title: string; completed: boolean }
const pct = (done: number, total: number) => total ? Math.round((done / total) * 100) : 0

function DayCard({ day, onToggleTask, onAddTask, onDeleteTask, onEditTask }: {
  day: Dashboard["days"][number]
  onToggleTask: (id: string, completed: boolean) => void
  onAddTask: (date: string) => void
  onDeleteTask: (id: string) => void
  onEditTask: (task: Task) => void
}) {
  const progress = pct(day.task_done, day.task_total)
  return (
    <Card className={`day-card ${day.is_today ? "today" : ""}`}>
      <div className="day-head">
        <strong>{format(parseISO(day.date), "EEEE")}</strong>
        <span>{format(parseISO(day.date), "dd MMM yyyy")}</span>
        {day.is_today && <em>TODAY</em>}
      </div>

      <div className="day-progress">
        <ProgressRing value={progress} size={94} stroke={9} />
        <div className="day-progress-copy">
          <span>Personal task progress</span>
          <strong>{day.task_done} / {day.task_total} completed</strong>
        </div>
      </div>

      <div className="task-section">
        <div className="task-section-head">
          <div><strong>PERSONAL TASKS</strong><span>Only tasks created for this date</span></div>
          <button className="square-add" onClick={() => onAddTask(day.date)} aria-label="Add personal task"><Plus /></button>
        </div>
        <div className="task-list">
          {day.tasks.length === 0 ? <div className="empty-task">No personal tasks</div> : day.tasks.map(task => (
            <div className="task-row" key={task.id}>
              <button className={`task-check ${task.completed ? "done" : ""}`} onClick={() => onToggleTask(task.id, !task.completed)} aria-label="Toggle task">
                {task.completed && <Check />}
              </button>
              <span className={task.completed ? "completed" : ""}>{task.title}</span>
              <button className="row-action" onClick={() => onEditTask(task)} aria-label="Edit task"><Pencil /></button>
              <button className="row-action danger" onClick={() => onDeleteTask(task.id)} aria-label="Delete task"><Trash2 /></button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function HabitTracker({ habits, weekDates, onToggle, onAdd, onEdit, onDelete }: {
  habits: HabitWithWeek[]
  weekDates: string[]
  onToggle: (habit: HabitWithWeek, date: string, completed: boolean) => void
  onAdd: () => void
  onEdit: (habit: HabitWithWeek) => void
  onDelete: (habit: HabitWithWeek) => void
}) {
  return (
    <Card className="habit-card">
      <div className="habit-head">
        <div><strong>HABIT TRACKER</strong><span>Recurring habits you want to follow every day this week</span></div>
        <Button size="sm" variant="secondary" onClick={onAdd}><Plus /> Add habit</Button>
      </div>
      {habits.length === 0 ? <div className="habit-empty">No recurring habits yet.</div> : (
        <div className="habit-scroll">
          <table className="habit-table">
            <thead><tr>
              <th className="habit-name-head">HABIT</th>
              {weekDates.map(date => <th key={date}>{format(parseISO(date), "EEE")}</th>)}
              <th>PROGRESS</th><th>ACTIONS</th>
            </tr></thead>
            <tbody>{habits.map(habit => {
              const done = weekDates.filter(date => habit.weekly_completion?.[date]).length
              const progress = pct(done, 7)
              return <tr key={habit.id}>
                <td className="habit-name">{habit.name}</td>
                {weekDates.map(date => {
                  const completed = Boolean(habit.weekly_completion?.[date])
                  return <td key={date}><button className={`habit-check ${completed ? "done" : ""}`} onClick={() => onToggle(habit, date, !completed)} aria-label={`${completed ? "Uncomplete" : "Complete"} ${habit.name}`}>
                    {completed && <Check />}
                  </button></td>
                })}
                <td><div className="habit-progress"><b>{progress}%</b><span><i style={{width:`${progress}%`}}/></span></div></td>
                <td><div className="habit-actions"><button onClick={() => onEdit(habit)} aria-label="Edit habit"><Pencil/></button><button onClick={() => onDelete(habit)} aria-label="Delete habit"><Trash2/></button></div></td>
              </tr>
            })}</tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [habits, setHabits] = useState<HabitWithWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [habitModalOpen, setHabitModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithWeek | null>(null)
  const [habitName, setHabitName] = useState("")
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDate, setTaskDate] = useState("")

  const load = async () => {
    try {
      const [dashboard, habitResponse] = await Promise.all([
        api<Dashboard>("/tracker/dashboard"),
        api<HabitWithWeek[]>("/tracker/habits"),
      ])
      setData(dashboard); setHabits(habitResponse)
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load dashboard") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const weekDates = useMemo(() => data?.days.map(day => day.date) ?? [], [data])
  const openAddHabit = () => { setEditingHabit(null); setHabitName(""); setHabitModalOpen(true) }
  const openEditHabit = (habit: HabitWithWeek) => { setEditingHabit(habit); setHabitName(habit.name); setHabitModalOpen(true) }

  const saveHabit = async () => {
    const name = habitName.trim(); if (!name) return
    try {
      if (editingHabit) await api(`/tracker/habits/${editingHabit.id}`, { method:"PATCH", body:JSON.stringify({name, description:editingHabit.description ?? null, color:editingHabit.color}) })
      else await api("/tracker/habits", {method:"POST", body:JSON.stringify({name,color:"violet"})})
      toast.success(editingHabit ? "Habit updated" : "Habit added")
      setHabitModalOpen(false); setEditingHabit(null); setHabitName(""); await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save habit") }
  }

  const deleteHabit = async (habit: HabitWithWeek) => {
    if (!window.confirm(`Delete "${habit.name}" and its weekly completion history?`)) return
    try { await api(`/tracker/habits/${habit.id}`, {method:"DELETE"}); toast.success("Habit deleted"); await load() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete habit") }
  }

  const toggleHabit = async (habit: HabitWithWeek, date: string, completed: boolean) => {
    try { await api(`/tracker/habits/${habit.id}/completion/${date}`, {method:"PUT", body:JSON.stringify({completed})}); await load() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not update habit") }
  }

  const openAddTask = (date: string) => { setEditingTask(null); setTaskTitle(""); setTaskDate(date); setTaskModalOpen(true) }
  const openEditTask = (task: Task) => { setEditingTask(task); setTaskTitle(task.title); setTaskDate(task.date); setTaskModalOpen(true) }

  const saveTask = async () => {
    const title = taskTitle.trim(); if (!title || !taskDate) return
    try {
      if (editingTask) await api(`/tracker/tasks/${editingTask.id}`, {method:"PATCH", body:JSON.stringify({title,date:taskDate,completed:editingTask.completed})})
      else await api("/tracker/tasks", {method:"POST", body:JSON.stringify({title,date:taskDate,completed:false})})
      toast.success(editingTask ? "Task updated" : "Task added")
      setTaskModalOpen(false); setEditingTask(null); setTaskTitle(""); await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save task") }
  }

  const toggleTask = async (id: string, completed: boolean) => {
    const task = data?.days.flatMap(day => day.tasks).find(item => item.id === id)
    const date = data?.days.find(day => day.tasks.some(item => item.id === id))?.date
    if (!task || !date) return
    try { await api(`/tracker/tasks/${id}`, {method:"PATCH", body:JSON.stringify({title:task.title,date,completed})}); await load() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not update task") }
  }

  const deleteTask = async (id: string) => {
    if (!window.confirm("Delete this personal task?")) return
    try { await api(`/tracker/tasks/${id}`, {method:"DELETE"}); toast.success("Task deleted"); await load() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete task") }
  }

  if (loading) return <div className="dashboard-loading">Loading your weekly tracker…</div>
  if (!data) return null

  const todayLabel = now.toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"})
  const timeLabel = now.toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,timeZone:"Asia/Kolkata"})

  return <div className="dashboard-page">
    <div className="dashboard-shell">
      <header className="dashboard-title"><h1>WEEKLY HABIT TRACKER</h1></header>

      <main>
        <div className="top-dashboard-grid">
          <Card className="info-card">
            <div className="info-item"><span>WEEK</span><strong>{format(parseISO(data.week_start),"dd MMM")} – {format(parseISO(data.week_end),"dd MMM yyyy")}</strong></div>
            <div className="info-item"><span>TODAY</span><strong>{todayLabel}</strong></div>
            <div className="info-item clock"><Clock3/><div><span>IST</span><strong>{timeLabel}</strong></div></div>
          </Card>

          <Card className="overall-card">
            <h2>Overall Progress</h2>
            <div className="overall-content">
              <div className="overall-ring-wrap"><ProgressRing value={data.overall_progress} size={154} stroke={14}/></div>
              <p>{data.overall_done} / {data.overall_total} completed</p>
              <div className="character-placeholder" aria-hidden="true" />
            </div>
          </Card>

          <HabitTracker habits={habits} weekDates={weekDates} onToggle={(h,d,c)=>void toggleHabit(h,d,c)} onAdd={openAddHabit} onEdit={openEditHabit} onDelete={h=>void deleteHabit(h)} />
        </div>

        <section className="daily-section">
          <div className="daily-heading"><h2>DAILY PERSONAL TASKS</h2><p>Each day’s independent. The donut and list below track personal tasks for this date only.</p></div>
          <div className="days-grid">{data.days.map(day => <DayCard key={day.date} day={day} onToggleTask={(id,c)=>void toggleTask(id,c)} onAddTask={openAddTask} onDeleteTask={id=>void deleteTask(id)} onEditTask={openEditTask}/>)}</div>
        </section>
      </main>
    </div>

    {habitModalOpen && <Modal title={editingHabit ? "Update recurring habit" : "Add recurring habit"} eyebrow={editingHabit ? "EDIT HABIT" : "NEW HABIT"} onClose={()=>setHabitModalOpen(false)}>
      <label>Habit name</label><Input autoFocus value={habitName} onChange={e=>setHabitName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void saveHabit();if(e.key==="Escape")setHabitModalOpen(false)}} placeholder="e.g. Gym"/>
      <div className="modal-actions"><Button onClick={()=>void saveHabit()} disabled={!habitName.trim()}><Save/> {editingHabit ? "Update habit" : "Add habit"}</Button><Button variant="ghost" onClick={()=>setHabitModalOpen(false)}>Cancel</Button></div>
    </Modal>}

    {taskModalOpen && <Modal title={editingTask ? "Update personal task" : "Add personal task"} eyebrow={editingTask ? "EDIT TASK" : "NEW TASK"} onClose={()=>setTaskModalOpen(false)}>
      <label>Date</label><Input type="date" value={taskDate} onChange={e=>setTaskDate(e.target.value)}/>
      <label>Task</label><Input autoFocus value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void saveTask();if(e.key==="Escape")setTaskModalOpen(false)}} placeholder="e.g. Submit assignment"/>
      <div className="modal-actions"><Button onClick={()=>void saveTask()} disabled={!taskTitle.trim() || !taskDate}><Save/> {editingTask ? "Update task" : "Add task"}</Button><Button variant="ghost" onClick={()=>setTaskModalOpen(false)}>Cancel</Button></div>
    </Modal>}
  </div>
}

function Modal({title,eyebrow,onClose,children}:{title:string;eyebrow:string;onClose:()=>void;children:ReactNode}) {
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><motion.div initial={{opacity:0,y:12,scale:.98}} animate={{opacity:1,y:0,scale:1}} className="modal-card">
    <div className="modal-head"><div><span>{eyebrow}</span><h2>{title}</h2></div><button onClick={onClose}><X/></button></div><div className="modal-body">{children}</div>
  </motion.div></div>
}
