import { Link } from "react-router-dom"
import { ArrowRight, BarChart3, BrainCircuit, Check, Flame, Sparkles, Target } from "lucide-react"
import { motion } from "motion/react"
import { Button, Card } from "@/components/ui"

export default function LandingPage(){
 return <div className="overflow-hidden">
  <section className="relative grid min-h-[calc(100vh-76px)] items-center">
   <div className="absolute inset-0 grid-glow opacity-70"/>
   <div className="relative mx-auto grid max-w-[1500px] items-center gap-12 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-10">
    <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-bold text-accent"><Sparkles className="h-4 w-4"/>The habit system built for consistency</div>
      <h1 className="max-w-4xl text-6xl font-black leading-[.92] tracking-[-.055em] sm:text-7xl lg:text-8xl">Your life, <span className="text-gradient">measured</span> beautifully.</h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">Track recurring habits, capture anything on any date, understand your patterns and ask a private AI assistant what to improve next.</p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link to="/register"><Button size="lg">Start for free <ArrowRight/></Button></Link><Link to="/about"><Button size="lg" variant="secondary">Explore the product</Button></Link></div>
      <div className="mt-8 flex flex-wrap gap-5 text-sm text-muted"><span className="flex items-center gap-2"><Check className="text-accent"/>Private data isolation</span><span className="flex items-center gap-2"><Check className="text-accent"/>IST-aware tracker</span><span className="flex items-center gap-2"><Check className="text-accent"/>10 saved AI chats</span></div>
    </motion.div>
    <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{delay:.15,duration:.7}} className="relative">
      <div className="absolute -inset-10 rounded-full bg-accent/15 blur-3xl"/>
      <Card className="relative overflow-hidden p-5 sm:p-7">
       <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-muted">Today</p><p className="text-2xl font-black">Monday, 14 Sep</p></div><span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-bold text-accent">68% complete</span></div>
       <div className="grid grid-cols-3 gap-3">{["Wake up","Run 30 min","Read"].map((x,i)=><div key={x} className="rounded-2xl border border-white/7 bg-white/[.03] p-4"><div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${i<2?"bg-accent/15 text-accent":"bg-white/6 text-muted"}`}>{i<2?<Check/>:<Target/>}</div><p className="font-semibold">{x}</p><p className="mt-1 text-xs text-muted">{i<2?"Completed":"Next up"}</p></div>)}</div>
       <div className="mt-4 rounded-2xl border border-white/7 bg-white/[.025] p-5"><div className="flex items-center justify-between"><span className="font-bold">Weekly momentum</span><BarChart3 className="text-accent"/></div><div className="mt-5 flex h-28 items-end gap-2">{[42,58,51,74,67,82,68].map((h,i)=><div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-accent/25 to-accent" style={{height:`${h}%`}}/>)}</div></div>
       <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-400/10 bg-cyan-400/[.05] p-4"><BrainCircuit className="text-cyan-300"/><div><p className="font-bold">Habit AI</p><p className="text-xs text-muted">“Your strongest day is Friday. Your morning routine drives most of the gain.”</p></div></div>
      </Card>
    </motion.div>
   </div>
  </section>
  <section className="mx-auto max-w-7xl px-5 py-20"><div className="grid gap-5 md:grid-cols-3">{[
    [Flame,"Consistency engine","See weekly habit progress without losing the context of each day."],
    [BarChart3,"Visual intelligence","Day, week, month and custom-range analytics with interactive charts."],
    [BrainCircuit,"Private Habit AI","Get practical suggestions based on your own tracker data."]
  ].map(([Icon,title,desc])=><Card key={title as string} className="p-7"><Icon className="h-7 w-7 text-accent"/><h3 className="mt-5 text-xl font-black">{title as string}</h3><p className="mt-2 leading-7 text-muted">{desc as string}</p></Card>)}</div></section>
 </div>
}
