import { useEffect, useState } from "react"
import { Ban, CheckCircle2, DollarSign, Search, Shield, Users, X } from "lucide-react"
import { api } from "@/lib/api"
import { Button, Card, Input, SectionTitle } from "@/components/ui"
import { toast } from "sonner"

type Overview={total_users:number;paid_users:number;free_users:number;blocked_users:number;revenue_paise:number}
type Row={user_id:string;email:string;role:string;is_blocked:boolean;email_verified:boolean;created_at:string}
type Detail={user:{user_id:string;email:string;role:string;is_blocked:boolean;email_verified:boolean;created_at:string};habit_count:number;task_count:number;subscriptions:{plan:string;starts_at:string;ends_at:string;status:string}[]}

export default function AdminPage(){
 const [overview,setOverview]=useState<Overview|null>(null)
 const [rows,setRows]=useState<Row[]>([])
 const [selected,setSelected]=useState<Detail|null>(null)
 const [q,setQ]=useState("")
 const load=async()=>{
  try{
   const [o,u]=await Promise.all([api<Overview>("/admin/overview"),api<Row[]>(`/admin/users?q=${encodeURIComponent(q)}`)])
   setOverview(o);setRows(u)
  }catch(e){toast.error(e instanceof Error?e.message:"Admin request failed")}
 }
 useEffect(()=>{void load()},[])
 const openUser=async(id:string)=>{
  try{setSelected(await api<Detail>(`/admin/users/${id}`))}
  catch(e){toast.error(e instanceof Error?e.message:"Could not load user")}
 }
 const toggle=async(r:Row)=>{
  await api(`/admin/users/${r.user_id}/${r.is_blocked?"unblock":"block"}`,{method:"POST"})
  toast.success(r.is_blocked?"User unblocked":"User blocked");await load()
 }
 return <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
  <SectionTitle eyebrow="Control room" title="Admin dashboard" description="Platform health, user management, subscription signals and business metrics."/>
  {overview&&<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
   [Users,"Total users",overview.total_users],[CheckCircle2,"Paid users",overview.paid_users],[Shield,"Free users",overview.free_users],[DollarSign,"Revenue",`₹${(overview.revenue_paise/100).toLocaleString("en-IN")}`]
  ].map(([Icon,label,value])=><Card key={String(label)} className="p-5"><Icon className="text-accent"/><p className="mt-5 text-sm text-muted">{String(label)}</p><p className="mt-1 text-3xl font-black">{String(value)}</p></Card>)}</div>}
  <Card className="mt-5 p-5">
   <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-4 h-5 w-5 text-muted"/><Input className="pl-12" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void load()}} placeholder="Search by User ID or email"/></div><Button onClick={()=>void load()}>Search</Button></div>
   <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="border-b border-white/8 text-xs uppercase tracking-widest text-muted"><tr><th className="px-3 py-3">User ID</th><th>Email</th><th>Verified</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>{rows.map(r=><tr key={r.user_id} className="border-b border-white/6"><td className="px-3 py-4"><button onClick={()=>void openUser(r.user_id)} className="font-mono text-accent hover:underline">{r.user_id}</button></td><td>{r.email}</td><td>{r.email_verified?"Yes":"No"}</td><td>{r.is_blocked?"Blocked":"Active"}</td><td>{new Date(r.created_at).toLocaleDateString("en-IN")}</td><td><Button size="sm" variant={r.is_blocked?"secondary":"danger"} onClick={()=>void toggle(r)}>{r.is_blocked?<CheckCircle2/>:<Ban/>}{r.is_blocked?"Unblock":"Block"}</Button></td></tr>)}</tbody></table></div>
  </Card>
  {selected&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={()=>setSelected(null)}>
   <div className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6" onClick={e=>e.stopPropagation()}>
    <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-widest text-muted">User profile</p><h2 className="mt-1 text-2xl font-black">{selected.user.email}</h2><p className="font-mono text-sm text-accent">{selected.user.user_id}</p></div><button onClick={()=>setSelected(null)} className="rounded-xl p-2 text-muted hover:bg-white/6"><X/></button></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/[.03] p-4"><p className="text-xs text-muted">Habits</p><p className="mt-1 text-2xl font-black">{selected.habit_count}</p></div><div className="rounded-2xl bg-white/[.03] p-4"><p className="text-xs text-muted">Tasks</p><p className="mt-1 text-2xl font-black">{selected.task_count}</p></div><div className="rounded-2xl bg-white/[.03] p-4"><p className="text-xs text-muted">Verified</p><p className="mt-1 text-2xl font-black">{selected.user.email_verified?"Yes":"No"}</p></div></div>
    <div className="mt-6"><p className="mb-3 font-bold">Subscription history</p><div className="space-y-2">{selected.subscriptions.length?selected.subscriptions.map((s,i)=><div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/7 p-3 text-sm"><span className="font-semibold">{s.plan}</span><span className="text-muted">{new Date(s.starts_at).toLocaleDateString("en-IN")} → {new Date(s.ends_at).toLocaleDateString("en-IN")}</span><span className="text-accent">{s.status}</span></div>):<p className="text-sm text-muted">No subscription history.</p>}</div></div>
   </div>
  </div>}
 </div>
}
