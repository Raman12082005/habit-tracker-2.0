import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "@/lib/api"
import type { User } from "@/types"

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, confirm_password: string) => Promise<string>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const token = localStorage.getItem("ht_token")
    if (!token) { setUser(null); setLoading(false); return }
    try { setUser(await api<User>("/users/me")) }
    catch { localStorage.removeItem("ht_token"); setUser(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [])

  const login = async (email: string, password: string) => {
    const data = await api<{ access_token: string; user: User }>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password })
    })
    localStorage.setItem("ht_token", data.access_token)
    setUser(data.user)
  }

  const register = async (email: string, password: string, confirm_password: string) => {
    const data = await api<{ message: string; user_id: string }>("/auth/register", {
      method: "POST", body: JSON.stringify({ email, password, confirm_password })
    })
    return data.message
  }

  const logout = () => {
    localStorage.removeItem("ht_token")
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}
