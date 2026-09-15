import { useEffect, useState } from "react"
import { Bot, MessageCircle, Pencil, Plus, Send, Trash2, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import type { Message, Thread } from "@/types"
import { Button, Input } from "@/components/ui"
import { Link } from "react-router-dom"

export function ChatAssistant() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [activeAccess, setActiveAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return
    void api<{active:boolean}>("/ai/status").then(x => setActiveAccess(x.active)).catch(() => setActiveAccess(false))
  }, [user])

  useEffect(() => {
    if (!open || !activeAccess) return
    void api<Thread[]>("/ai/threads").then(data => {
      setThreads(data)
      if (!active && data[0]) setActive(data[0].id)
    }).catch(() => {})
  }, [open, activeAccess])

  useEffect(() => {
    if (!active) { setMessages([]); return }
    void api<{messages:Message[]}>(`/ai/threads/${active}`).then(data => setMessages(data.messages)).catch(() => {})
  }, [active])

  const createThread = async () => {
    try {
      const thread = await api<{id:string;title:string}>("/ai/threads", { method:"POST", body:JSON.stringify({title:"New chat"}) })
      const item = { ...thread, created_at:new Date().toISOString(), updated_at:new Date().toISOString() }
      setThreads(prev => [item, ...prev]); setActive(item.id); setMessages([])
    } catch (e) { alert(e instanceof Error ? e.message : "Unable to create chat") }
  }

  const send = async () => {
    if (!active || !text.trim() || loading) return
    const value = text.trim(); setText("")
    setMessages(prev => [...prev, {id:crypto.randomUUID(), role:"user", content:value, created_at:new Date().toISOString()}])
    setLoading(true)
    try {
      const data = await api<{answer:string}>(`/ai/threads/${active}/messages`, {method:"POST", body:JSON.stringify({content:value})})
      setMessages(prev => [...prev, {id:crypto.randomUUID(), role:"assistant", content:data.answer, created_at:new Date().toISOString()}])
    } catch (e) {
      setMessages(prev => [...prev, {id:crypto.randomUUID(), role:"assistant", content:e instanceof Error ? e.message : "Something went wrong.", created_at:new Date().toISOString()}])
    } finally { setLoading(false) }
  }

  const deleteThread = async (id:string) => {
    await api(`/ai/threads/${id}`, {method:"DELETE"})
    setThreads(prev => prev.filter(t => t.id !== id))
    if (active === id) { setActive(null); setMessages([]) }
  }

  const renameThread = async (id:string) => {
    if (!editTitle.trim()) return
    await api(`/ai/threads/${id}`, {method:"PATCH", body:JSON.stringify({title:editTitle.trim()})})
    setThreads(prev => prev.map(t => t.id === id ? {...t, title:editTitle.trim()} : t))
    setEditingId(null)
  }

  if (!user) return null
  return <>
    <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-50 grid h-16 w-16 place-items-center rounded-2xl bg-accent text-white shadow-2xl shadow-accent/30 transition hover:scale-105 focus-ring">
      <MessageCircle className="h-7 w-7"/>
    </button>
    <AnimatePresence>
      {open && <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:40}} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[760px] flex-col border-l border-white/10 bg-[#0b0b10]/96 shadow-2xl backdrop-blur-2xl">
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/8 px-5">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15"><Bot className="h-5 w-5 text-accent"/></span><div><p className="font-bold">Habit AI</p><p className="text-xs text-muted">Your private progress copilot</p></div></div>
          <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-muted hover:bg-white/6 hover:text-white"><X/></button>
        </div>
        {!activeAccess ? <div className="grid flex-1 place-items-center p-8 text-center"><div><Bot className="mx-auto mb-5 h-14 w-14 text-accent"/><h2 className="text-2xl font-black">Unlock Habit AI</h2><p className="mx-auto mt-2 max-w-md text-muted">Get private summaries, insights and suggestions from your own tracker data.</p><Link to="/subscription"><Button size="lg" className="mt-6">View plans</Button></Link></div></div> :
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-64 shrink-0 flex-col border-r border-white/8 p-3 sm:flex">
            <Button onClick={createThread} className="w-full"><Plus className="h-4 w-4"/>New chat</Button>
            <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {threads.map(t => <div key={t.id} className={`group flex items-center gap-2 rounded-xl p-2 ${active===t.id ? "bg-white/8" : "hover:bg-white/5"}`}>{editingId===t.id ? <input autoFocus value={editTitle} onChange={e=>setEditTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void renameThread(t.id);if(e.key==="Escape")setEditingId(null)}} onBlur={()=>void renameThread(t.id)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm outline-none"/> : <button className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => setActive(t.id)}>{t.title}</button>}<button onClick={() => {setEditingId(t.id);setEditTitle(t.title)}} className="hidden text-muted hover:text-white group-hover:block"><Pencil className="h-4 w-4"/></button><button onClick={() => void deleteThread(t.id)} className="hidden text-muted hover:text-rose-300 group-hover:block"><Trash2 className="h-4 w-4"/></button></div>)}
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[.03] p-3 text-xs text-muted">10 chats max · 15 questions/day</div>
          </aside>
          <main className="flex min-w-0 flex-1 flex-col">
            {!active ? <div className="grid flex-1 place-items-center p-8 text-center"><div><Bot className="mx-auto mb-4 h-12 w-12 text-accent"/><h3 className="text-xl font-black">Start a private chat</h3><p className="mt-2 text-sm text-muted">Ask about habits, consistency, trends or improvements.</p><Button onClick={createThread} className="mt-5"><Plus/>New chat</Button></div></div> :
            <>
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {messages.map(m => <div key={m.id} className={`flex ${m.role==="user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-[15px] leading-6 ${m.role==="user" ? "bg-accent text-white rounded-br-md" : "bg-blue-500/12 border border-blue-400/10 text-blue-50 rounded-bl-md"}`}>{m.content}</div></div>)}
                {loading && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md bg-blue-500/12 px-4 py-3 text-sm text-blue-100"><span className="animate-pulse">Thinking…</span></div></div>}
              </div>
              <div className="border-t border-white/8 p-4">
                <div className="flex items-end gap-2"><Input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send()}}} placeholder="Ask about your progress…" className="h-14"/><Button onClick={()=>void send()} disabled={!text.trim()||loading} size="lg"><Send className="h-5 w-5"/></Button></div>
              </div>
            </>}
          </main>
        </div>}
      </motion.div>}
    </AnimatePresence>
  </>
}
