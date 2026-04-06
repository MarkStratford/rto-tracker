import { addDays, startOfWeekMonday, toIsoDate } from '../lib/date'
import type { AttendanceRecord } from '../types'

const WEEK_PATTERNS = [3, 2, 4, 1, 3, 0, 5, 2, 3, 4, 2, 1]

export function buildSampleAttendance(today: Date): AttendanceRecord[] {
  const currentWeek = startOfWeekMonday(today)
  const oldestWeek = addDays(currentWeek, -77)

  return WEEK_PATTERNS.flatMap((daysInWeek, weekIndex) => {
    const weekStart = addDays(oldestWeek, weekIndex * 7)
    return Array.from({ length: daysInWeek }, (_, dayOffset) => ({
      date: toIsoDate(addDays(weekStart, dayOffset)),
      inOffice: true,
      source: 'manual' as const,
    }))
  })
}
