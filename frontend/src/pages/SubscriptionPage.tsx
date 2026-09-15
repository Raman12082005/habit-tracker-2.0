import { useEffect, useState } from "react"
import { Check, Crown, ShieldCheck, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { api } from "@/lib/api"
import { Button, Card, SectionTitle } from "@/components/ui"
import { toast } from "sonner"

declare global { interface Window { Razorpay?: new (options: Record<string,unknown>) => {open:()=>void} } }

const plans=[{code:"weekly",name:"Weekly",price:99,days:7,tag:"Try it"},{code:"biweekly",name:"Biweekly",price:179,days:14,tag:"Popular"},{code:"monthly",name:"Monthly",price:399,days:30,tag:"Best value"}]

export default function SubscriptionPage(){
  const [current,setCurrent]=useState<{active:boolean;plan?:string;ends_at?:string}>({active:false})
  useEffect(()=>{void api<typeof current>("/subscriptions/current").then(setCurrent).catch(()=>{})},[])
  const checkout=async(plan:string)=>{
    try{
      const order=await api<{order_id:string;amount:number;currency:string;key_id:string}>(`/subscriptions/checkout/${plan}`,{method:"POST"})
      if(!window.Razorpay){toast.error("Payment checkout is not configured yet.");return}
      const rzp=new window.Razorpay({
        key:order.key_id,amount:order.amount,currency:order.currency,name:"Habit Tracker 2.0",description:`${plan} AI subscription`,order_id:order.order_id,
        handler:async(response:Record<string,string>)=>{await api("/subscriptions/verify",{method:"POST",body:JSON.stringify(response)});toast.success("Subscription activated!");setCurrent(await api("/subscriptions/current"))},
        theme:{color:"#8b5cf6"}
      });rzp.open()
    }catch(e){toast.error(e instanceof Error?e.message:"Payment could not start")}
  }
  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <SectionTitle eyebrow="AI access" title="Turn your data into decisions." description="Unlock private summaries, patterns, insights and practical suggestions generated from your own tracker data."/>
    {current.active && <Card className="mb-7 border-accent/25 bg-accent/[.07] p-5"><div className="flex items-center gap-3"><Crown className="text-accent"/><div><p className="font-bold">AI is active on your account</p><p className="text-sm text-muted">Your {current.plan} plan ends {current.ends_at ? new Date(current.ends_at).toLocaleString("en-IN") : "soon"}.</p></div></div></Card>}
    <div className="grid gap-5 lg:grid-cols-3">
      {plans.map((p,i)=><motion.div key={p.code} whileHover={{y:-6}} transition={{type:"spring",stiffness:300}}><Card className={`relative h-full p-7 ${i===2?"border-accent/30 shadow-accent/10":""}`}>{p.tag==="Popular"&&<div className="absolute right-5 top-5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">Popular</div>}<p className="text-sm font-bold text-muted">{p.name}</p><div className="mt-4 flex items-end gap-1"><span className="text-5xl font-black">₹{p.price}</span><span className="mb-1 text-sm text-muted">/{p.days} days</span></div><p className="mt-3 text-sm text-muted">Full AI access for your selected period.</p><div className="my-6 space-y-3">{["15 AI questions every day","Up to 10 saved chat threads","Private tracker-data insights","Subscription history preserved"].map(x=><div key={x} className="flex gap-2 text-sm"><Check className="h-5 w-5 shrink-0 text-accent"/>{x}</div>)}</div><Button className="w-full" size="lg" onClick={()=>void checkout(p.code)}>Choose {p.name}</Button></Card></motion.div>)}
    </div>
    <div className="mt-7 grid gap-4 sm:grid-cols-3"><Card className="p-5"><ShieldCheck className="text-accent"/><p className="mt-3 font-bold">Secure payments</p><p className="mt-1 text-sm text-muted">Payment verification happens on the server.</p></Card><Card className="p-5"><Sparkles className="text-accent"/><p className="mt-3 font-bold">Private by design</p><p className="mt-1 text-sm text-muted">AI receives only the authenticated user's data.</p></Card><Card className="p-5"><Crown className="text-accent"/><p className="mt-3 font-bold">No chat loss</p><p className="mt-1 text-sm text-muted">Your saved conversations remain after expiry.</p></Card></div>
    <p className="mt-7 text-center text-xs text-muted">No-refund policy and subscription terms apply. Final commercial/legal wording should be reviewed before launch.</p>
  </div>
}
