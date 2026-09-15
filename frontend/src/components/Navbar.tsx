import { useState } from "react"
import { BarChart3, BrainCircuit, CircleUserRound, Home, LogOut, Menu, Palette, Settings, ShieldCheck, Sparkles, X } from "lucide-react"
import { Link, NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useTheme, themes } from "@/context/ThemeContext"
import { Button } from "@/components/ui"

export function Navbar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = user ? [
    { to: "/dashboard", label: "Home", icon: Home },
    { to: "/analysis", label: "Analysis", icon: BarChart3 },
    { to: "/subscription", label: "AI Access", icon: BrainCircuit },
    ...(user.role === "admin" ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ] : [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: Sparkles },
    { to: "/contact", label: "Contact", icon: CircleUserRound },
  ]

  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        <Link to={user ? "/dashboard" : "/"} onClick={() => setMobileOpen(false)} className="brand">
          <span className="brand-mark"><Sparkles /></span>
          <span className="brand-copy"><span>HABIT</span><strong>Tracker <b>2.0</b></strong></span>
        </Link>

        <nav className="desktop-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon />{label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions">
          <div className="theme-picker">
            <Palette className="theme-icon" />
            {themes.map((t) => (
              <button
                key={t.id}
                title={t.name}
                onClick={() => void setTheme(t.id)}
                className={`theme-swatch ${theme === t.id ? "selected" : ""}`}
                style={{ background: t.swatch }}
              />
            ))}
          </div>

          {user ? (
            <>
              <Link to="/settings" className="nav-icon"><Settings /></Link>
              <button onClick={logout} className="nav-icon"><LogOut /></button>
            </>
          ) : (
            <Link className="hidden sm:block" to="/login"><Button size="sm">Sign in</Button></Link>
          )}

          <button onClick={() => setMobileOpen(v => !v)} className="mobile-menu-button" aria-label="Toggle navigation">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className="mobile-nav-link"><Icon />{label}</NavLink>
          ))}
          <div className="mobile-theme-row">
            {themes.map((t) => <button key={t.id} onClick={() => void setTheme(t.id)} className={`theme-swatch mobile ${theme===t.id?"selected":""}`} style={{background:t.swatch}} aria-label={t.name}/>) }
            {user && <><Link to="/settings" onClick={() => setMobileOpen(false)} className="nav-icon mobile"><Settings/></Link><button onClick={logout} className="nav-icon mobile"><LogOut/></button></>}
          </div>
        </div>
      )}
    </header>
  )
}
