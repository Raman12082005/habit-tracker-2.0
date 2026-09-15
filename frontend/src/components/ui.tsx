import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Button({ className, variant="primary", size="md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"secondary"|"ghost"|"danger"; size?: "sm"|"md"|"lg" }) {
  const styles = {
    primary: "ui-button ui-button-primary",
    secondary: "ui-button ui-button-secondary",
    ghost: "ui-button ui-button-ghost",
    danger: "ui-button ui-button-danger",
  }
  const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-4", lg: "h-13 px-6 text-base" }
  return <button className={cn("focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition", styles[variant], sizes[size], className)} {...props} />
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("focus-ring h-13 w-full rounded-xl border px-4 text-[15px] outline-none transition ui-input", props.className)} {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("focus-ring min-h-32 w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition ui-input", props.className)} {...props} />
}

export function Card({ children, className="" }: { children: ReactNode; className?: string }) {
  return <section className={cn("ui-card rounded-[20px]", className)}>{children}</section>
}

export function ProgressRing({ value, size=132, stroke=10 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * Math.max(0, Math.min(100, value)) / 100
  return (
    <div className="progress-ring relative shrink-0" style={{ width:size, height:size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle cx={size/2} cy={size/2} r={r} fill="none" className="progress-ring-track" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" className="progress-ring-value" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`}/>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <span className="progress-ring-label text-2xl font-black tracking-tight">{Math.round(value)}%</span>
      </div>
    </div>
  )
}

export function SectionTitle({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return <div className="mb-7"><div className="mb-2 text-xs font-bold uppercase tracking-[.24em] text-accent">{eyebrow}</div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-muted">{description}</p>}</div>
}

export function Spinner() { return <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/20 border-t-current" /> }
