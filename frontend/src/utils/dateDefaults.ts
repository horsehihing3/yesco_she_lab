const pad = (n: number) => n.toString().padStart(2, '0')

export const formatDate = (v?: string | null): string => v ? v.substring(0, 10) : ''
export const formatDateTime = (v?: string | null): string => v ? v.replace('T', ' ').substring(0, 16) : ''

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayStr = () => toLocalDateStr(new Date())

export const daysFromTodayStr = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toLocalDateStr(d)
}

export const weekFromTodayStr = () => daysFromTodayStr(7)
