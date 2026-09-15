import { useState, type ReactNode, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { Button, Card, Input } from "@/components/ui"
import { toast } from "sonner"

function AuthLayout({children,title,subtitle}:{children:ReactNode;title:string;subtitle:string}){
 return <div className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[1.05fr_.95fr]">
  <div className="hidden overflow-hidden border-r border-white/7 p-10 lg:flex lg:flex-col lg:justify-center"><div className="mx-auto max-w-xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent"><Sparkles className="h-3.5 w-3.5"/>AI-powered personal growth</span><h1 className="text-6xl font-black leading-[.95] tracking-[-.05em]">Build habits.<br/><span className="text-gradient">See patterns.</span><br/>Become consistent.</h1><p className="mt-7 max-w-lg text-lg leading-8 text-muted">A premium workspace for recurring habits, personal tasks, visual analytics and an AI coach that knows only your data.</p></div></div>
  <div className="grid place-items-center p-5 sm:p-10"><motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="w-full max-w-md"><div className="mb-6"><h2 className="text-3xl font-black">{title}</h2><p className="mt-2 text-muted">{subtitle}</p></div>{children}</motion.div></div>
 </div>
}

export function LoginPage(){
 const {login}=useAuth(); const nav=useNavigate(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [show,setShow]=useState(false); const [loading,setLoading]=useState(false)
 const submit=async(e:FormEvent)=>{e.preventDefault();setLoading(true);try{await login(email,password);nav("/dashboard")}catch(err){toast.error(err instanceof Error?err.message:"Login failed")}finally{setLoading(false)}}
 return <AuthLayout title="Welcome back" subtitle="Sign in to your private workspace."><form onSubmit={submit} className="space-y-4"><Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" required/><div className="relative"><Input value={password} onChange={e=>setPassword(e.target.value)} type={show?"text":"password"} placeholder="Password" required className="pr-12"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3.5 text-muted">{show?<EyeOff/>:<Eye/>}</button></div><Button className="w-full" size="lg">Sign in</Button><div className="flex justify-between text-sm"><Link className="text-accent hover:underline" to="/forgot-password">Forgot password?</Link><Link className="text-muted hover:text-white" to="/register">Create account</Link></div></form></AuthLayout>
}

export function RegisterPage(){
 const {register}=useAuth(); const nav=useNavigate(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [loading,setLoading]=useState(false)
 const submit=async(e:FormEvent)=>{e.preventDefault();setLoading(true);try{const msg=await register(email,password,confirm);toast.success(msg);nav("/login")}catch(err){toast.error(err instanceof Error?err.message:"Registration failed")}finally{setLoading(false)}}
 return <AuthLayout title="Create your account" subtitle="Start your private productivity system."><form onSubmit={submit} className="space-y-4"><Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" required/><Input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password (8+ characters)" required/><Input value={confirm} onChange={e=>setConfirm(e.target.value)} type="password" placeholder="Confirm password" required/><Button className="w-full" size="lg">Create account</Button><div className="flex items-center gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-accent"/>Your account is ready to use immediately.</div><p className="text-center text-sm text-muted">Already have an account? <Link className="text-accent hover:underline" to="/login">Sign in</Link></p></form></AuthLayout>
}

export function ForgotPasswordPage(){
 const [email,setEmail]=useState(""); const [done,setDone]=useState(false)
 const submit=async(e:FormEvent)=>{e.preventDefault();try{const x=await api<{message:string}>("/auth/forgot-password",{method:"POST",body:JSON.stringify({email})});toast.success(x.message);setDone(true)}catch(err){toast.error(err instanceof Error?err.message:"Could not send reset link")}}
 return <AuthLayout title="Reset your password" subtitle="We'll send a secure, time-limited reset link."><form onSubmit={submit} className="space-y-4"><Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" required/><Button className="w-full" size="lg"><Mail/>Send reset link</Button>{done&&<div className="rounded-2xl border border-accent/20 bg-accent/10 p-4 text-sm text-muted">Check your email. In local development, the backend prints the link in the terminal.</div>}<Link to="/login" className="block text-center text-sm text-accent">Back to sign in</Link></form></AuthLayout>
}

export function ResetPasswordPage(){
 const token=new URLSearchParams(useLocation().search).get("token")||""; const [password,setPassword]=useState(""); const [done,setDone]=useState(false)
 const submit=async(e:FormEvent)=>{e.preventDefault();try{const x=await api<{message:string}>("/auth/reset-password",{method:"POST",body:JSON.stringify({token,password})});toast.success(x.message);setDone(true)}catch(err){toast.error(err instanceof Error?err.message:"Could not reset password")}}
 return <AuthLayout title="Choose a new password" subtitle="Use a strong password you don't reuse elsewhere."><form onSubmit={submit} className="space-y-4"><Input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="New password" required minLength={8}/><Button className="w-full" size="lg"><KeyRound/>Reset password</Button>{done&&<Link to="/login" className="block text-center text-sm text-accent">Continue to sign in</Link>}</form></AuthLayout>
}

export function VerifyEmailPage(){
 const token=new URLSearchParams(useLocation().search).get("token")||""; const [status,setStatus]=useState("Verifying…")
 useState(()=>{if(token)void api(`/auth/verify-email?token=${encodeURIComponent(token)}`).then(()=>setStatus("Email verified. You can now sign in.")).catch(e=>setStatus(e instanceof Error?e.message:"Verification failed"))})
 return <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center p-6"><Card className="w-full p-8 text-center"><Mail className="mx-auto h-12 w-12 text-accent"/><h1 className="mt-5 text-2xl font-black">{status}</h1><Link to="/login"><Button className="mt-6">Go to login</Button></Link></Card></div>
}
