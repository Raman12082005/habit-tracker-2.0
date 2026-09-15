import { useState } from "react"
import { AlertTriangle, Palette, Trash2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTheme, themes } from "@/context/ThemeContext"
import { api } from "@/lib/api"
import { Button, Card, SectionTitle } from "@/components/ui"
import { toast } from "sonner"

export default function SettingsPage(){
 const {user,logout}=useAuth(); const {theme,setTheme}=useTheme(); const [deleting,setDeleting]=useState(false)
 const deleteAccount=async()=>{if(!confirm("This permanently deletes your account and tracker data. Continue?"))return;setDeleting(true);try{await api("/users/me",{method:"DELETE"});logout();toast.success("Account deleted.")}catch(e){toast.error(e instanceof Error?e.message:"Could not delete account")}finally{setDeleting(false)}}
 return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><SectionTitle eyebrow="Account" title="Settings" description="Your profile, theme and account controls."/>
 <div className="grid gap-5 lg:grid-cols-2"><Card className="p-6"><h2 className="text-xl font-black">Profile</h2><div className="mt-5 space-y-4"><div><p className="text-xs uppercase tracking-widest text-muted">Email</p><p className="mt-1 text-lg">{user?.email}</p></div><div><p className="text-xs uppercase tracking-widest text-muted">User ID</p><p className="mt-1 font-mono text-accent">{user?.user_id}</p></div></div></Card>
 <Card className="p-6"><div className="flex items-center gap-2"><Palette className="text-accent"/><h2 className="text-xl font-black">Theme</h2></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{themes.map(t=><button key={t.id} onClick={()=>void setTheme(t.id)} className={`rounded-2xl border p-3 text-left transition ${theme===t.id?"border-accent bg-accent/10":"border-border bg-card"}`}><div className="h-12 rounded-xl" style={{background:t.swatch}}/><p className="mt-2 text-sm font-semibold">{t.name}</p></button>)}</div></Card></div>
 <Card className="mt-5 border-rose-500/15 p-6"><div className="flex gap-3"><AlertTriangle className="text-rose-300"/><div><h2 className="font-black">Delete account</h2><p className="mt-1 text-sm text-muted">Your habits, tasks, chats and subscriptions will be permanently removed.</p><Button className="mt-4" variant="danger" disabled={deleting} onClick={()=>void deleteAccount()}><Trash2/>Delete my account</Button></div></div></Card>
 </div>
}
