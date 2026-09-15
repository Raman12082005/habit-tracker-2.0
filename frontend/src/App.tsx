import { Navigate, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"
import { AppShell } from "@/components/AppShell"
import { useAuth } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/ThemeContext"
import LandingPage from "@/pages/LandingPage"
import DashboardPage from "@/pages/DashboardPage"
import AnalysisPage from "@/pages/AnalysisPage"
import SubscriptionPage from "@/pages/SubscriptionPage"
import AdminPage from "@/pages/AdminPage"
import SettingsPage from "@/pages/SettingsPage"
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from "@/pages/AuthPages"
import { AboutPage, ContactPage } from "@/pages/InfoPages"
import { TermsPage, PrivacyPage } from "@/pages/LegalPages"
import { Card } from "@/components/ui"

function Guard({children,admin=false}:{children:ReactNode;admin?:boolean}){
 const {user,loading}=useAuth()
 if(loading)return <div className="grid min-h-[70vh] place-items-center text-muted">Loading…</div>
 if(!user)return <Navigate to="/login" replace/>
 if(admin&&user.role!=="admin")return <Navigate to="/dashboard" replace/>
 return <>{children}</>
}
function AppRoutes(){
 const {user}=useAuth()
 return <AppShell><Routes>
  <Route path="/" element={user?<Navigate to="/dashboard" replace/>:<LandingPage/>}/>
  <Route path="/about" element={<AboutPage/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/terms" element={<TermsPage/>}/><Route path="/privacy" element={<PrivacyPage/>}/>
  <Route path="/login" element={user?<Navigate to="/dashboard" replace/>:<LoginPage/>}/>
  <Route path="/register" element={user?<Navigate to="/dashboard" replace/>:<RegisterPage/>}/>
  <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
  <Route path="/reset-password" element={<ResetPasswordPage/>}/>
  <Route path="/verify-email" element={<VerifyEmailPage/>}/>
  <Route path="/dashboard" element={<Guard><DashboardPage/></Guard>}/>
  <Route path="/analysis" element={<Guard><AnalysisPage/></Guard>}/>
  <Route path="/subscription" element={<Guard><SubscriptionPage/></Guard>}/>
  <Route path="/settings" element={<Guard><SettingsPage/></Guard>}/>
  <Route path="/admin" element={<Guard admin><AdminPage/></Guard>}/>
  <Route path="*" element={<div className="mx-auto max-w-xl px-5 py-20"><Card className="p-10 text-center"><h1 className="text-5xl font-black">404</h1><p className="mt-2 text-muted">This page doesn't exist.</p></Card></div>}/>
 </Routes></AppShell>
}
export default function App(){
 const {user}=useAuth()
 return <ThemeProvider initialTheme={user?.theme}><AppRoutes/></ThemeProvider>
}
