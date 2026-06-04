const pad = (n: number) => n.toString().padStart(2, '0')

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayStr = () => toLocalDateStr(new Date())

export const daysFromTodayStr = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toLocalDateStr(d)
}

export const weekFromTodayStr = () => daysFromTodayStr(7)
