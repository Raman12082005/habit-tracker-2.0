import { useEffect, useState } from "react"
import { CalendarRange, Download, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts"
import { format, subDays } from "date-fns"
import { api } from "@/lib/api"
import type { Analysis } from "@/types"
import { Button, Card, Input, ProgressRing, SectionTitle } from "@/components/ui"
import { toast } from "sonner"

export default function AnalysisPage(){
  const today = new Date()
  const [start,setStart]=useState(format(subDays(today,29),"yyyy-MM-dd"))
  const [end,setEnd]=useState(format(today,"yyyy-MM-dd"))
  const [data,setData]=useState<Analysis|null>(null)
  const preset=(kind:"day"|"week"|"month")=>{const e=new Date();const s=new Date(e);if(kind==="day")s.setDate(e.getDate());if(kind==="week")s.setDate(e.getDate()-6);if(kind==="month")s.setDate(1);setStart(format(s,"yyyy-MM-dd"));setEnd(format(e,"yyyy-MM-dd"))}
  const load=async()=>{try{setData(await api<Analysis>(`/analytics?start=${start}&end=${end}`))}catch(e){toast.error(e instanceof Error?e.message:"Unable to load analysis")}}
  useEffect(()=>{void load()},[])
  const downloadReport=()=>{
    if(!data)return
    const lines=["Habit Tracker 2.0 Report",`Period: ${data.start} to ${data.end}`,`Progress: ${data.progress}%`,`Completed: ${data.done}/${data.total}`,"","Habit performance",...data.habit_stats.map(h=>`${h.name}: ${h.progress}% (${h.done}/${h.total})`)]
    const blob=new Blob([lines.join("\n")],{type:"text/plain"})
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`habit-report-${data.start}-to-${data.end}.txt`;a.click();URL.revokeObjectURL(a.href)
  }
  if(!data)return <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center text-muted">Loading analytics…</div>
  return <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
    <SectionTitle eyebrow="Insights" title="Performance Analytics" description="Explore days, weeks, months or any custom date range with interactive visualizations."/>
    <Card className="mb-5 p-5">
      <div className="mb-4 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={()=>preset("day")}>Day</Button><Button size="sm" variant="secondary" onClick={()=>preset("week")}>Week</Button><Button size="sm" variant="secondary" onClick={()=>preset("month")}>Month</Button></div><div className="flex flex-col gap-3 lg:flex-row lg:items-end"><div className="flex-1"><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted">From</label><Input type="date" value={start} onChange={e=>setStart(e.target.value)}/></div><div className="flex-1"><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted">To</label><Input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></div><Button onClick={()=>void load()}><CalendarRange/>Analyze range</Button><Button variant="secondary" onClick={downloadReport}><Download/>Download report</Button></div>
    </Card>
    <div className="grid gap-5 md:grid-cols-3">
      <Card className="p-6"><p className="text-sm text-muted">Completion</p><div className="mt-4 flex items-center gap-5"><ProgressRing value={data.progress} size={108} stroke={9}/><div><div className="text-3xl font-black">{data.progress}%</div><p className="text-sm text-muted">{data.done}/{data.total}</p></div></div></Card>
      <Card className="p-6"><p className="text-sm text-muted">Task completion</p><div className="mt-5 text-4xl font-black">{data.task_stats.done}<span className="text-lg text-muted">/{data.task_stats.total}</span></div><p className="mt-1 text-sm text-muted">date-specific tasks</p></Card>
      <Card className="p-6"><p className="text-sm text-muted">Best habit</p><div className="mt-5 text-xl font-black">{[...data.habit_stats].sort((a,b)=>b.progress-a.progress)[0]?.name ?? "—"}</div><p className="mt-1 text-sm text-muted">highest consistency in range</p></Card>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <Card className="p-6"><div className="mb-5 flex items-center gap-2"><TrendingUp className="text-accent"/><h2 className="font-black">Progress trend</h2></div><div className="h-[340px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.daily}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false}/><XAxis dataKey="date" tick={{fill:"#777486",fontSize:11}} tickFormatter={v=>v.slice(5)}/><YAxis domain={[0,100]} tick={{fill:"#777486",fontSize:11}}/><Tooltip contentStyle={{background:"#101016",border:"1px solid rgba(255,255,255,.1)",borderRadius:14}}/><Line type="monotone" dataKey="progress" stroke="var(--accent)" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></div></Card>
      <Card className="p-6"><h2 className="font-black">Habit consistency</h2><div className="mt-5 h-[340px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.habit_stats} layout="vertical" margin={{left:20,right:10}}><CartesianGrid stroke="rgba(255,255,255,.06)" horizontal={false}/><XAxis type="number" domain={[0,100]} hide/><YAxis type="category" dataKey="name" width={95} tick={{fill:"#9a98a8",fontSize:11}}/><Tooltip contentStyle={{background:"#101016",border:"1px solid rgba(255,255,255,.1)",borderRadius:14}}/><Bar dataKey="progress" fill="var(--accent)" radius={[0,8,8,0]}/></BarChart></ResponsiveContainer></div></Card>
    </div>
  </div>
}
