import type { ReactNode } from "react"
import { Navbar } from "@/components/Navbar"
import { ChatAssistant } from "@/components/ChatAssistant"

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen"><Navbar/><main>{children}</main><ChatAssistant/></div>
}
