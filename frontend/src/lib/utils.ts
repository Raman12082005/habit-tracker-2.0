export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ")
}
export function initials(email: string) {
  return email.slice(0, 1).toUpperCase()
}
export function percent(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`
}
