import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "@/lib/api"

export const themes = [
  { id: "blue", name: "Blue", swatch: "linear-gradient(135deg,#6f9bd6,#61c9dc)" },
  { id: "red", name: "Red", swatch: "linear-gradient(135deg,#e58a62,#b44747)" },
  { id: "dark", name: "Dark", swatch: "linear-gradient(135deg,#161d22,#4b6871)" },
  { id: "brown", name: "Brown", swatch: "linear-gradient(135deg,#a86a48,#e0c49b)" },
] as const

type ThemeContextType = { theme: string; setTheme: (theme: string) => Promise<void> }
const ThemeContext = createContext<ThemeContextType | null>(null)

function normalizeTheme(value?: string) {
  return themes.some((item) => item.id === value) ? value! : "blue"
}

export function ThemeProvider({ initialTheme, children }: { initialTheme?: string; children: ReactNode }) {
  const [theme, setThemeState] = useState(normalizeTheme(initialTheme))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (initialTheme) setThemeState(normalizeTheme(initialTheme))
  }, [initialTheme])

  const setTheme = async (next: string) => {
    const normalized = normalizeTheme(next)
    setThemeState(normalized)
    document.documentElement.dataset.theme = normalized
    try {
      await api("/users/theme", {
        method: "PATCH",
        body: JSON.stringify({ theme: normalized }),
      })
    } catch {
      // Theme changes remain local even if persistence is temporarily unavailable.
    }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used inside ThemeProvider")
  return value
}
