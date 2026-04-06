const ONE_DAY_MS = 24 * 60 * 60 * 1000

export function toIsoDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

export function addDays(value: Date, amount: number): Date {
  const next = new Date(value)
  next.setDate(next.getDate() + amount)
  return startOfDay(next)
}

export function startOfWeekMonday(value: Date): Date {
  const date = startOfDay(value)
  const day = date.getDay()
  const offset = day === 0 ? -6 : 1 - day
  return addDays(date, offset)
}

export function endOfWeekMonday(value: Date): Date {
  return addDays(startOfWeekMonday(value), 6)
}

export function compareDates(left: Date, right: Date): number {
  return startOfDay(left).getTime() - startOfDay(right).getTime()
}

export function isWeekday(value: Date): boolean {
  const day = value.getDay()
  return day >= 1 && day <= 5
}

export function eachDayInclusive(start: Date, end: Date): Date[] {
  const days: Date[] = []
  let cursor = startOfDay(start)
  const last = startOfDay(end)

  while (cursor.getTime() <= last.getTime()) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  return days
}

export function countWeekdaysBetween(start: Date, end: Date): number {
  return eachDayInclusive(start, end).filter(isWeekday).length
}

export function formatShortDate(value: string): string {
  return parseIsoDate(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatWeekLabel(weekStart: string, weekEnd: string): string {
  return `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`
}

export function formatMonthYear(value: string): string {
  return parseIsoDate(value).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function formatRangeWithYear(start: string, end: string): string {
  const startDate = parseIsoDate(start)
  const endDate = parseIsoDate(end)

  const startLabel = startDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const endLabel = endDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return `${startLabel} - ${endLabel}`
}

export function daysBetween(start: Date, end: Date): number {
  return Math.round(
    (startOfDay(end).getTime() - startOfDay(start).getTime()) / ONE_DAY_MS,
  )
}
