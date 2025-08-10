export function toISOFromInput(dateStr: string): string {
  // Accepts yyyy-mm-dd from <input type="date">
  return new Date(dateStr).toISOString()
}

export function diffDaysInclusive(fromISO: string, toISO: string): number {
  const from = new Date(fromISO)
  const to = new Date(toISO)
  const ms = to.getTime() - from.getTime()
  if (isNaN(ms)) return 0
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}
